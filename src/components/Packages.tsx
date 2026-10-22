import type { CSSProperties } from 'react';
import { packages, sections } from '../content';
import { ArrowIcon } from './Icons';
import './Packages.css';

/** Пакеты с ценами в виде «билетов». Кнопка подставляет пакет в комментарий заявки. */
export function Packages() {
  return (
    <section className="section section--night-deep packages" id="packages" aria-labelledby="packages-title">
      <div className="container">
        <div className="section-head">
          <h2 id="packages-title" data-reveal="up">
            {sections.packages.title}
          </h2>
          <p data-reveal="up" style={{ '--delay': '0.1s' } as CSSProperties}>
            {sections.packages.lead}
          </p>
        </div>

        <ul className="packages__grid">
          {packages.map((p, i) => (
            <li key={p.name} className="ticket" data-reveal="up" style={{ '--delay': `${i * 0.08}s` } as CSSProperties}>
              <div className="ticket__head">
                <h3 className="ticket__name">{p.name}</h3>
                <p className="ticket__hint">{p.hint}</p>
                <p className="ticket__price">{p.price}</p>
              </div>
              <ul className="ticket__items">
                {p.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a
                className="ticket__cta"
                href="#booking"
                onClick={() => window.dispatchEvent(new CustomEvent<string>('pick-package', { detail: p.name }))}
              >
                Выбрать пакет
                <ArrowIcon />
              </a>
            </li>
          ))}
        </ul>

        <p className="packages__note" data-reveal="up">
          {sections.packages.note}
        </p>
      </div>
    </section>
  );
}
