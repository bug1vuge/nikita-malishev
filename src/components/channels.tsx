import type { ComponentType, SVGProps } from 'react';
import { contacts } from '../content';
import { InstagramIcon, RingsIcon, TelegramIcon, VkIcon, WhatsAppIcon } from './Icons';

export interface Channel {
  key: string;
  href: string;
  /** Название канала: «WhatsApp», «Горько» */
  name: string;
  /** Подпись действия: «Написать сообщение» */
  action: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Каналы связи, которые заполнены в content.ts. Пустые не показываются. */
export const channels: Channel[] = [
  { key: 'whatsapp', href: contacts.whatsapp, name: 'WhatsApp', action: 'Написать сообщение', Icon: WhatsAppIcon },
  { key: 'telegram', href: contacts.telegram, name: 'Telegram', action: 'Написать сообщение', Icon: TelegramIcon },
  { key: 'instagram', href: contacts.instagram, name: 'Instagram', action: contacts.instagramHandle, Icon: InstagramIcon },
  { key: 'vk', href: contacts.vk, name: 'ВКонтакте', action: 'Страница ВК', Icon: VkIcon },
  { key: 'gorko', href: contacts.gorko, name: 'Горько', action: 'Профиль и 160 отзывов', Icon: RingsIcon },
].filter((c) => c.href);
