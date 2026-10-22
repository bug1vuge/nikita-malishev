import { contacts } from '../content';
import { PhoneIcon, RingsIcon, TelegramIcon, WhatsAppIcon } from './Icons';
import './MobileBar.css';

/** Нижняя панель на телефоне: контакты всегда под пальцем. Пустые каналы не показываются. */
export function MobileBar() {
  return (
    <nav className="mobile-bar" aria-label="Быстрая связь">
      {contacts.phone ? (
        <a href={contacts.phoneHref} className="mobile-bar__call">
          <PhoneIcon />
          Позвонить
        </a>
      ) : (
        <a href="#booking" className="mobile-bar__call">
          Оставить заявку
        </a>
      )}
      {contacts.whatsapp && (
        <a href={contacts.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Написать в WhatsApp">
          <WhatsAppIcon />
        </a>
      )}
      {contacts.telegram && (
        <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" aria-label="Написать в Telegram">
          <TelegramIcon />
        </a>
      )}
      {!contacts.whatsapp && !contacts.telegram && (
        <a href={contacts.gorko} target="_blank" rel="noopener noreferrer" aria-label="Профиль на Горько">
          <RingsIcon />
        </a>
      )}
      {contacts.phone && (
        <a href="#booking" className="mobile-bar__book">
          Заявка
        </a>
      )}
    </nav>
  );
}
