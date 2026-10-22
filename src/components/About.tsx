import type { CSSProperties } from 'react';
import { about } from '../content';
import { SparkIcon } from './Icons';
import { Photo } from './Photo';
import './About.css';

export function About() {
  return (
    <section className="section section--butter about" id="about" aria-labelledby="about-title">
      <div className="container about__grid">
        <div className="about__media">
          <div className="about__photo about__photo--main" data-reveal="curtain">
            <div data-parallax="-0.06">
              <Photo photo="cover" sizes="(min-width: 1024px) 40vw, (min-width: 600px) 60vw, 90vw" />
            </div>
          </div>
          <div className="about__photo about__photo--small" data-reveal="scale" style={{ '--delay': '0.25s' } as CSSProperties}>
            <div data-parallax="0.12">
              <Photo photo="wide4" sizes="(min-width: 1024px) 18vw, 40vw" />
            </div>
          </div>
          <p className="about__note" data-parallax="0.2">
            {about.note[0]}
            <br />
            {about.note[1]}
          </p>
        </div>

        <div className="about__text">
          <h2 id="about-title" data-reveal="up">
            {about.title}
          </h2>
          {about.paragraphs.map((p, i) => (
            <p key={i} className="about__p" data-reveal="up" style={{ '--delay': `${0.1 + i * 0.1}s` } as CSSProperties}>
              {p}
            </p>
          ))}

          <ul className="about__traits">
            {about.traits.map((t, i) => (
              <li key={t.title} data-reveal="left" style={{ '--delay': `${0.1 + i * 0.12}s` } as CSSProperties}>
                <SparkIcon />
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <dl className="about__facts" data-reveal="up">
            {about.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="about__awards" data-reveal="up">
            <h3 className="about__awards-title">Места в конкурсах ведущих</h3>
            <ul>
              {about.awards.map((a) => (
                <li key={a.title}>
                  <span className="about__award-place">{a.place}</span>
                  <span className="about__award-of">{a.of}</span>
                  <span className="about__award-name">{a.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
