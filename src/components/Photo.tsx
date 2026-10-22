import { useEffect, useRef, useState } from 'react';
import { person, photos, type PhotoKey } from '../content';
import { photoUrls } from '../lib/photoSrc';

interface PhotoProps {
  photo: PhotoKey;
  /** Атрибут sizes — подсказка браузеру, какой ширины картинка на экране. */
  sizes: string;
  className?: string;
  /** Первый экран: грузим сразу и с высоким приоритетом. */
  priority?: boolean;
  /** Переопределить alt (например, пустой для декоративных копий). */
  alt?: string;
}

/**
 * Адаптивная картинка: srcset, ленивая загрузка, фиксированные пропорции
 * (без скачков вёрстки) и аккуратная заглушка, если фото не загрузилось.
 */
export function Photo({ photo, sizes, className, priority = false, alt }: PhotoProps) {
  const data = photos[photo];
  const urls = photoUrls(photo);
  const initials = `${person.firstName[0]}${person.lastName[0]}`;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // После гидратации проверяем картинки, которые успели загрузиться/упасть до React.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth === 0) setFailed(true);
    else setLoaded(true);
  }, []);

  const width = 800;
  const height = Math.round(width / data.ratio);
  const cls = ['photo', loaded ? 'is-loaded' : '', failed ? 'is-failed' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} style={{ aspectRatio: String(data.ratio) }}>
      {failed ? (
        alt === '' ? (
          <span className="photo__fallback" aria-hidden="true">
            {initials}
          </span>
        ) : (
          <span className="photo__fallback" role="img" aria-label={alt ?? data.alt}>
            <span aria-hidden="true">{initials}</span>
          </span>
        )
      ) : (
        <picture>
          {urls.avif && <source type="image/avif" srcSet={urls.avif} sizes={sizes} />}
          {urls.webp && <source type="image/webp" srcSet={urls.webp} sizes={sizes} />}
          <img
            ref={imgRef}
            src={urls.src}
            srcSet={urls.srcSet}
            sizes={urls.srcSet ? sizes : undefined}
            alt={alt ?? data.alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </picture>
      )}
    </span>
  );
}
