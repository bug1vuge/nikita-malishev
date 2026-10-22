import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { formats, sections } from '../content';
import { isFinePointer, prefersReducedMotion } from '../lib/motion';
import { ArrowIcon } from './Icons';
import { Photo } from './Photo';
import './Formats.css';

export function Formats() {
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  // Фото «плывёт» за курсором над списком (только мышь)
  useEffect(() => {
    const list = listRef.current;
    const preview = previewRef.current;
    if (!list || !preview || !isFinePointer()) return;
    const reduced = prefersReducedMotion();
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let running = false;

    const loop = () => {
      x += (tx - x) * (reduced ? 1 : 0.14);
      y += (ty - y) * (reduced ? 1 : 0.14);
      const vx = (tx - x) * 0.08;
      preview.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${Math.max(-12, Math.min(12, vx))}deg)`;
      raf = running ? requestAnimationFrame(loop) : 0;
    };
    let lastX = -1;
    let lastY = -1;

    const follow = (clientX: number, clientY: number) => {
      const r = list.getBoundingClientRect();
      tx = clientX - r.left;
      ty = clientY - r.top;
      if (!running) {
        x = tx;
        y = ty;
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    const hide = () => {
      running = false;
      setActive(null);
    };
    const onMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      follow(e.clientX, e.clientY);
    };
    // При прокрутке колесом курсор не двигается, и pointerleave не приходит.
    // Проверяем, что теперь под курсором: другая строка — меняем фото, вне списка — прячем.
    const onScroll = () => {
      if (!running || lastX < 0) return;
      const under = document.elementFromPoint(lastX, lastY);
      const item = under?.closest<HTMLElement>('.formats__item');
      if (!item || !list.contains(item)) {
        hide();
        return;
      }
      const index = Array.from(list.querySelectorAll('.formats__item')).indexOf(item);
      setActive(index);
      follow(lastX, lastY);
    };
    list.addEventListener('pointermove', onMove, { passive: true });
    list.addEventListener('pointerleave', hide);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      list.removeEventListener('pointermove', onMove);
      list.removeEventListener('pointerleave', hide);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section className="section formats" id="formats" aria-labelledby="formats-title">
      <div className="container">
        <div className="section-head">
          <h2 id="formats-title" data-reveal="up">
            {sections.formats.title}
          </h2>
          <p data-reveal="up" style={{ '--delay': '0.1s' } as CSSProperties}>
            {sections.formats.lead}
          </p>
        </div>

        <div ref={listRef} className="formats__wrap">
        <ul className={`formats__list${active !== null ? ' has-active' : ''}`}>
          {formats.map((f, i) => (
            <li
              key={f.id}
              className={`formats__item${active === i ? ' is-active' : ''}`}
              data-reveal="up"
              style={{ '--delay': `${i * 0.06}s` } as CSSProperties}
              onPointerEnter={() => setActive(i)}
            >
              <a
                className="formats__link"
                href="#booking"
                onClick={() => window.dispatchEvent(new CustomEvent<string>('pick-event', { detail: f.title }))}
              >
                <span className="formats__thumb" aria-hidden="true">
                  <Photo photo={f.photo} alt="" sizes="72px" />
                </span>
                <h3 className="formats__title">{f.title}</h3>
                <p className="formats__text">{f.text}</p>
                <span className="formats__go" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </a>
            </li>
          ))}
        </ul>

          <div ref={previewRef} className={`formats__preview${active !== null ? ' is-visible' : ''}`} aria-hidden="true">
            {formats.map((f, i) => (
              <div key={f.id} className={`formats__preview-img${active === i ? ' is-current' : ''}`}>
                <Photo photo={f.photo} alt="" sizes="260px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
