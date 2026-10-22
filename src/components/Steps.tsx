import { useEffect, useRef, type CSSProperties } from 'react';
import { sections, steps } from '../content';
import './Steps.css';

export function Steps() {
  const listRef = useRef<HTMLOListElement>(null);

  // Линия-прогресс заполняется по мере прокрутки
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = list.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height + vh * 0.2)));
      list.style.setProperty('--progress', p.toFixed(3));
      list.querySelectorAll<HTMLElement>('.steps__item').forEach((li, i, all) => {
        li.classList.toggle('is-done', p >= (i + 0.5) / all.length - 0.05);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section className="section steps" id="process" aria-labelledby="process-title">
      <div className="container">
        <div className="section-head">
          <h2 id="process-title" data-reveal="up">
            {sections.steps.title}
          </h2>
          <p data-reveal="up" style={{ '--delay': '0.1s' } as CSSProperties}>
            {sections.steps.lead}
          </p>
        </div>

        <ol ref={listRef} className="steps__list">
          {steps.map((s, i) => (
            <li key={s.title} className="steps__item" data-reveal="up" style={{ '--delay': `${i * 0.08}s` } as CSSProperties}>
              <span className="steps__num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
