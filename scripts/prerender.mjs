/**
 * Пререндер: превращает SPA в готовый HTML с полным текстом страницы,
 * мета-тегами и микроразметкой. Поисковики и соцсети видят всё сразу,
 * а первый экран рисуется ещё до загрузки JavaScript.
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, process.env.DIST || 'dist');
const ssrEntry = resolve(root, 'dist-ssr/entry-server.js');

const { render, head } = await import(pathToFileURL(ssrEntry).href);
const template = await readFile(resolve(dist, 'index.html'), 'utf8');

const html = template
  .replace('<!--head-->', head())
  .replace('<!--dev-head-->', '')
  .replace('<!--app-->', render());

await writeFile(resolve(dist, 'index.html'), html);

// sitemap с адресом сайта из настроек
const siteUrl = (process.env.VITE_SITE_URL || 'https://malyshev-event.ru').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);
await writeFile(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>
`,
);
try {
  const robots =
    process.env.VITE_NOINDEX === '1'
      ? 'User-agent: *\nDisallow: /\n' // демо-версия закрыта от поисковиков
      : (await readFile(resolve(dist, 'robots.txt'), 'utf8')).replace(/Sitemap: .*/, `Sitemap: ${siteUrl}/sitemap.xml`);
  await writeFile(resolve(dist, 'robots.txt'), robots);
} catch {
  /* robots.txt нет — пропускаем */
}

await rm(resolve(root, 'dist-ssr'), { recursive: true, force: true });
console.log('✓ Пререндер готов: dist/index.html, sitemap.xml, robots.txt');
