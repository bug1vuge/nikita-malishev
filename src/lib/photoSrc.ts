import { photos, type PhotoKey } from '../content';

/** Ширины для фото с CDN Горько: сервер сам уменьшает картинку по параметру =wN */
const REMOTE_WIDTHS = [400, 800, 1200];

function gorkoUrl(id: string, width: number): string {
  // -rw: отдавать WebP (меньше вес, поддерживается всеми актуальными браузерами)
  return `https://lh3.googleusercontent.com/${id}=w${width}-rw`;
}

export interface PhotoUrls {
  /** Запасной src для <img> */
  src: string;
  /** srcset для <img> (у фото с CDN) */
  srcSet?: string;
  /** srcset для <source type="image/avif"> и webp (у своих фото) */
  avif?: string;
  webp?: string;
}

/** Адреса картинки во всех нужных размерах — для <picture> и для preload. */
export function photoUrls(key: PhotoKey): PhotoUrls {
  const p = photos[key];
  if (p.widths?.length) {
    const base = `${import.meta.env.BASE_URL}img/${key}`;
    const set = (ext: string) => p.widths!.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
    const mid = p.widths[Math.min(1, p.widths.length - 1)];
    return { src: `${base}-${mid}.webp`, avif: set('avif'), webp: set('webp') };
  }
  if (!p.gorko) throw new Error(`У фото «${key}» не задан источник`);
  return {
    src: gorkoUrl(p.gorko, 800),
    srcSet: REMOTE_WIDTHS.map((w) => `${gorkoUrl(p.gorko!, w)} ${w}w`).join(', '),
  };
}

/** Хост CDN — для preconnect */
export const REMOTE_ORIGIN = 'https://lh3.googleusercontent.com';
