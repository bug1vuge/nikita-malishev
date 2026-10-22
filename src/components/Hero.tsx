import { useEffect, useRef, type CSSProperties } from 'react';
import { contacts, hero, person, site, type PhotoKey } from '../content';
import { isFinePointer, prefersReducedMotion } from '../lib/motion';
import { createSpotlight } from '../lib/spotlight';
import { ArrowIcon, WhatsAppIcon } from './Icons';
import { Photo } from './Photo';
import './Hero.css';

/** Фото первого экрана и его ширина на экране — их же использует предзагрузка в entry-server */
export const HERO_PHOTO: PhotoKey = 'hero';
export const HERO_SIZES = '(min-width: 1024px) 30vw, (min-width: 600px) 40vw, 76vw';

function Word({ text, offset }: { text: string; offset: number }) {
  return (
    <span className="hero__word">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="hero__letter" style={{ '--i': i + offset } as CSSProperties}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const name = nameRef.current;
    if (!section || !canvas || !name) return;

    const spot = createSpotlight({
      section,
      canvas,
      lit: name,
      reduced: prefersReducedMotion(),
      finePointer: isFinePointer(),
    });
    section.classList.add('is-lit');

    // Не тратим кадры, когда первый экран не виден или вкладка в фоне
    let onScreen = true;
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      spot.setActive(onScreen && !document.hidden);
    });
    io.observe(section);
    const onVis = () => spot.setActive(onScreen && !document.hidden);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      spot.destroy();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__curtain" aria-hidden="true" />
      <div className="hero__beam" aria-hidden="true" />
      <div className="hero__spot" aria-hidden="true" />
      <canvas ref={canvasRef} className="hero__dust" aria-hidden="true" />
      <div className="hero__lamp" aria-hidden="true" />

      <div className="container hero__grid">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            {/* data-* нужны для светящейся копии имени в ::after — в тексте заголовка дубля нет */}
            <span ref={nameRef} className="hero__name" data-first={person.firstName} data-last={person.lastName}>
              <Word text={person.firstName} offset={0} />{' '}
              <Word text={person.lastName} offset={person.firstName.length} />
            </span>{' '}
            <span className="hero__role">
              {hero.role}
              {site.cityIn ? ` ${site.cityIn}` : ''}
            </span>
          </h1>

          <p className="hero__tagline">{person.tagline}</p>
          <p className="hero__lead">{hero.lead}</p>

          <div className="hero__actions">
            <a className="btn" href="#booking">
              {hero.primaryCta}
            </a>
            {contacts.whatsapp ? (
              <a className="btn btn--ghost" href={contacts.whatsapp} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon />
                Написать в WhatsApp
              </a>
            ) : (
              <a className="btn btn--ghost" href="#packages">
                Пакеты и цены
                <ArrowIcon />
              </a>
            )}
          </div>

          {contacts.phone && (
            <a className="hero__phone" href={contacts.phoneHref}>
              <span className="hero__phone-label">{hero.phoneLabel}</span>
              <span className="hero__phone-number">{contacts.phone}</span>
            </a>
          )}
        </div>

        <div className="hero__visual">
          <div className="hero__frame">
            <Photo photo={HERO_PHOTO} priority sizes={HERO_SIZES} />
            <svg className="hero__badge" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <path id="badge-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
              </defs>
              <circle cx="100" cy="100" r="98" className="hero__badge-bg" />
              <text>
                <textPath href="#badge-circle" startOffset="0">
                  {hero.badge}
                </textPath>
              </text>
              <path
                className="hero__badge-star"
                d="M100 70c1.6 17 13.4 28.4 30 30-16.6 1.6-28.4 13-30 30-1.6-17-13.4-28.4-30-30 16.6-1.6 28.4-13 30-30Z"
              />
            </svg>
          </div>
        </div>
      </div>

      <a className="hero__scroll" href="#about" aria-label="Листать ниже">
        <span />
      </a>
    </section>
  );
}
