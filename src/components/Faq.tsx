import type { CSSProperties } from 'react';
import { faq, sections } from '../content';
import './Faq.css';

export function Faq() {
  return (
    <section className="section faq" id="faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <div className="section-head">
          <h2 id="faq-title" data-reveal="up">
            {sections.faq.title}
          </h2>
          <p data-reveal="up" style={{ '--delay': '0.1s' } as CSSProperties}>
            {sections.faq.lead}
          </p>
        </div>
        <div className="faq__list">
          {faq.map((item, i) => (
            <details key={item.q} className="faq__item" data-reveal="up" style={{ '--delay': `${i * 0.05}s` } as CSSProperties}>
              <summary>
                <h3>{item.q}</h3>
                <span className="faq__icon" aria-hidden="true" />
              </summary>
              <div className="faq__answer">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
