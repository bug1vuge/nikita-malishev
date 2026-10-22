import type { CSSProperties } from 'react';
import { sections, type PhotoKey } from '../content';
import { Photo } from './Photo';
import './Gallery.css';

// Кадры разной ширины идут в ряд с одинаковой высотой — как контактный лист
const ROW_A: PhotoKey[] = ['p1', 'wide1', 'p2', 'wide2', 'p3', 'p1', 'wide1', 'p2'];
const ROW_B: PhotoKey[] = ['wide3', 'p4', 'p5', 'wide4', 'p6', 'wide3', 'p4', 'p5'];

function Row({ items, speed }: { items: PhotoKey[]; speed: number }) {
  return (
    <div className="gallery__row" data-parallax={speed} data-parallax-axis="x">
      {items.map((p, i) => (
        <figure key={`${p}-${i}`} className="gallery__item">
          {/* Повторы картинок — декоративные, без alt для скринридеров */}
          <Photo photo={p} alt={i < 5 ? undefined : ''} sizes="(min-width: 1024px) 40vw, 70vw" />
        </figure>
      ))}
    </div>
  );
}

export function Gallery() {
  return (
    <section className="section section--night-deep gallery" id="gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="section-head">
          <h2 id="gallery-title" data-reveal="up">
            {sections.gallery.title}
          </h2>
          <p data-reveal="up" style={{ '--delay': '0.1s' } as CSSProperties}>
            {sections.gallery.lead}
          </p>
        </div>
      </div>
      <div className="gallery__rows">
        <Row items={ROW_A} speed={0.35} />
        <Row items={ROW_B} speed={-0.35} />
      </div>
    </section>
  );
}
