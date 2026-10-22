import { useEffect, useState, type CSSProperties } from 'react';
import { contacts, person } from '../content';
import { channels } from './channels';
import { PhoneIcon, SparkIcon } from './Icons';
import './Header.css';

export const NAV = [
  { href: '#about', label: 'Обо мне' },
  { href: '#formats', label: 'Форматы' },
  { href: '#packages', label: 'Цены' },
  { href: '#process', label: 'Как работаю' },
  { href: '#reviews', label: 'Отзывы' },
  { href: '#faq', label: 'Вопросы' },
  { href: '#contacts', label: 'Контакты' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="container header__bar">
        <a className="header__logo" href="#top" aria-label={`${person.fullName}, на главную`} onClick={close}>
          <SparkIcon className="header__spark" />
          <span>{person.lastName}</span>
        </a>

        <nav className="header__nav" aria-label="Основное меню">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {contacts.phone && (
          <a className="header__phone" href={contacts.phoneHref} aria-label={`Позвонить: ${contacts.phone}`}>
            <PhoneIcon />
            <span>{contacts.phone}</span>
          </a>
        )}
        <a className="btn header__cta" href="#booking">
          Забронировать дату
        </a>

        <button
          type="button"
          className="header__burger"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Мобильное меню">
          <ul>
            {NAV.map((n, i) => (
              <li key={n.href} style={{ '--i': i } as CSSProperties}>
                <a href={n.href} onClick={close}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu__contacts">
          {contacts.phone && (
            <a className="mobile-menu__phone" href={contacts.phoneHref}>
              {contacts.phone}
            </a>
          )}
          <div className="mobile-menu__socials">
            {channels.map(({ key, href, name, Icon }) => (
              <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={name}>
                <Icon />
              </a>
            ))}
          </div>
          <a className="btn" href="#booking" onClick={close}>
            Забронировать дату
          </a>
        </div>
      </div>
    </header>
  );
}
