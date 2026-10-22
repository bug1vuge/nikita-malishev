import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { contacts, reviews, sections } from '../content';
import { prefersReducedMotion } from '../lib/motion';
import { ArrowIcon, RingsIcon } from './Icons';
import './Reviews.css';

const AUTOPLAY_MS = 6000;

/**
 * Слайдер отзывов на нативном scroll-snap: свайп на телефоне работает «из коробки»,
 * плюс стрелки, точки, клавиатура и автопрокрутка с паузой при наведении/фокусе.
 */
export function Reviews() {
  const trackRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [pages, setPages] = useState(reviews.length);
  const [paused, setPaused] = useState(false);

  const slideWidth = () => {
    const track = trackRef.current;
    const first = track?.querySelector<HTMLElement>('.reviews__slide');
    if (!track || !first) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return first.offsetWidth + gap;
  };

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const w = slideWidth();
    const visible = Math.max(1, Math.round(track.clientWidth / w));
    const max = Math.max(0, reviews.length - visible);
    const target = i > max ? 0 : i < 0 ? max : i;
    track.scrollTo({ left: target * w, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, []);

  // Текущий слайд и число «страниц» считаем по прокрутке
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const sync = () => {
      raf = 0;
      const w = slideWidth();
      if (!w) return;
      const visible = Math.max(1, Math.round(track.clientWidth / w));
      setPages(Math.max(1, reviews.length - visible + 1));
      setIndex(Math.round(track.scrollLeft / w));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    sync();
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Автопрокрутка (только когда блок на экране и пользователь не взаимодействует)
  useEffect(() => {
    const track = trackRef.current;
    if (!track || paused || prefersReducedMotion()) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(track);
    const id = window.setInterval(() => {
      if (visible && !document.hidden) goTo(index + 1);
    }, AUTOPLAY_MS);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [index, paused, goTo]);

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(index - 1);
    }
  };

  return (
    <section className="section section--butter reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="container">
        <div className="reviews__head">
          <div className="section-head">
            <h2 id="reviews-title" data-reveal="up">
              {sections.reviews.title}
            </h2>
            <p data-reveal="up" style={{ '--delay': '0.1s' } as CSSProperties}>
              {sections.reviews.lead}
            </p>
          </div>
          {/* Стрелки и точки нужны, только если отзывы не помещаются на экран */}
          <div className="reviews__controls" data-reveal="up" hidden={pages <= 1}>
            <button type="button" className="reviews__arrow reviews__arrow--prev" onClick={() => goTo(index - 1)} aria-label="Предыдущий отзыв">
              <ArrowIcon />
            </button>
            <button type="button" className="reviews__arrow" onClick={() => goTo(index + 1)} aria-label="Следующий отзыв">
              <ArrowIcon />
            </button>
          </div>
        </div>

        <section
          ref={trackRef}
          className="reviews__track"
          aria-roledescription="карусель"
          aria-label="Отзывы клиентов"
          tabIndex={0}
          onKeyDown={onKey}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
        >
          {reviews.map((r, i) => (
            <div
              key={r.name}
              className="reviews__slide"
              role="group"
              aria-roledescription="слайд"
              aria-label={`${i + 1} из ${reviews.length}`}
            >
              <figure className="reviews__figure">
              <svg className="reviews__quote" viewBox="0 0 48 36" aria-hidden="true">
                <path d="M0 36V22C0 9.5 6.6 2.2 19.7 0l1.9 5C14.6 7 11 11 10.5 17H20v19H0Zm27 0V22C27 9.5 33.6 2.2 46.7 0l1.9 5c-7 2-10.6 6-11.1 12H47v19H27Z" />
              </svg>
              <blockquote>
                <p>{r.text}</p>
              </blockquote>
              <figcaption>
                <span className="reviews__name">{r.name}</span>
                <span className="reviews__event">{r.event}</span>
                {r.source && <span className="reviews__sample">отзыв на {r.source}</span>}
              </figcaption>
              </figure>
            </div>
          ))}
        </section>

        <div className="reviews__footer">
          <div className="reviews__dots" role="group" aria-label="Выбор отзыва" hidden={pages <= 1}>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`reviews__dot${i === Math.min(index, pages - 1) ? ' is-active' : ''}`}
                aria-label={`Показать отзыв ${i + 1}`}
                aria-current={i === Math.min(index, pages - 1) ? 'true' : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <a className="btn btn--ink" href={contacts.gorko} target="_blank" rel="noopener noreferrer">
            <RingsIcon />
            Все 160 отзывов на Горько
          </a>
        </div>
      </div>
    </section>
  );
}
