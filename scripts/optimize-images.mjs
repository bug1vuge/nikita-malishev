/**
 * Оптимизация своих фото: исходники лежат в /photos-src (в git не попадают),
 * готовые AVIF + WebP — в /public/img/<key>-<ширина>.<ext>.
 *
 *   npm run images
 *
 * Кадрирование и ретушь делаются заранее, скрипт сохраняет пропорции исходника.
 * Ширины должны совпадать с полем widths у фото в src/content.ts.
 * Ширина больше исходника — это аккуратное увеличение для экранов с высокой
 * плотностью пикселей (Lanczos + лёгкая резкость), а не новые детали.
 */
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PHOTOS = {
  // ключ: { widths, og?: { width, height, top } — превью для соцсетей в JPEG }
  // пример: hero: { widths: [480, 800, 1200], og: { width: 1200, height: 630, top: 0 } },
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'photos-src');
const out = resolve(root, 'public/img');

await mkdir(out, { recursive: true });
const files = (await readdir(src)).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f));

for (const [key, cfg] of Object.entries(PHOTOS)) {
  const file = files.find((f) => basename(f, extname(f)).toLowerCase() === key);
  if (!file) {
    console.error(`Нет исходника для «${key}» в photos-src`);
    process.exitCode = 1;
    continue;
  }
  const input = resolve(src, file);
  const { width: srcWidth } = await sharp(input).metadata();
  for (const w of cfg.widths) {
    const pipeline = sharp(input).rotate().resize({ width: w, kernel: 'lanczos3' });
    if (w > srcWidth) pipeline.sharpen({ sigma: 0.6 });
    await pipeline.clone().avif({ quality: 55, effort: 6 }).toFile(resolve(out, `${key}-${w}.avif`));
    await pipeline.clone().webp({ quality: 78 }).toFile(resolve(out, `${key}-${w}.webp`));
  }
  if (cfg.og) {
    const { width, height, top } = cfg.og;
    await sharp(input)
      .resize({ width })
      .extract({ left: 0, top, width, height })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(resolve(out, `${key}-og.jpg`));
  }
  console.log(`✓ ${key}: ${cfg.widths.join(', ')}${cfg.og ? ' + og' : ''}`);
}
