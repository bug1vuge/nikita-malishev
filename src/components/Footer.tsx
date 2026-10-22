import { contacts, person, sections } from '../content';
import { channels } from './channels';
import { PhoneIcon, SparkIcon } from './Icons';
import { NAV } from './Header';
import './Footer.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <a className="footer__cta" href="#booking">
          <span className="footer__cta-text">{sections.footer.cta}</span>
          <span className="footer__cta-btn btn">Забронировать дату</span>
        </a>

        <div className="footer__grid">
          <div className="footer__brand">
            <p className="footer__logo">
              <SparkIcon />
              {person.fullName}
            </p>
            <p className="footer__role">{person.tagline}</p>
          </div>

          <nav className="footer__nav" aria-label="Навигация в подвале">
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <address className="footer__contacts">
            {contacts.phone && (
              <a className="footer__phone" href={contacts.phoneHref}>
                <PhoneIcon />
                {contacts.phone}
              </a>
            )}
            <div className="footer__socials">
              {channels.map(({ key, href, name, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={name}>
                  <Icon />
                </a>
              ))}
            </div>
          </address>
        </div>

        <div className="footer__bottom">
          <p>
            © {year} {person.fullName}. {person.role}.
          </p>
          <a href={`${import.meta.env.BASE_URL}privacy.html`}>Политика конфиденциальности</a>
        </div>
      </div>
    </footer>
  );
}
