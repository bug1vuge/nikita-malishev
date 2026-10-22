/** Общая валидация заявки — используется и в браузере, и в серверной функции. */

export interface LeadData {
  name: string;
  phone: string;
  eventType: string;
  date: string;
  guests: string;
  place: string;
  contactVia: string;
  comment: string;
  consent: boolean;
  /** Ловушка для спам-ботов: у людей всегда пустое. */
  website: string;
}

export type LeadErrors = Partial<Record<keyof LeadData, string>>;

export const CONTACT_OPTIONS = ['Звонок', 'WhatsApp', 'Telegram'] as const;

export const emptyLead: LeadData = {
  name: '',
  phone: '',
  eventType: '',
  date: '',
  guests: '',
  place: '',
  contactVia: 'Звонок',
  comment: '',
  consent: false,
  website: '',
};

export const LIMITS = { name: 60, place: 120, comment: 1000 } as const;

export function phoneDigits(v: string): string {
  return v.replace(/\D/g, '');
}

/** Маска: +7 (983) 450-30-06. Для иностранных номеров (начинаются с «+» и не с 7) — без маски. */
export function formatPhone(raw: string): string {
  const trimmed = raw.trim();
  let d = phoneDigits(trimmed);
  if (trimmed.startsWith('+') && d && d[0] !== '7') return '+' + d.slice(0, 15);
  if (!d) return trimmed.startsWith('+') ? '+' : '';
  if (d[0] === '8') d = '7' + d.slice(1);
  else if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  let out = '+7';
  if (d.length > 1) out += ' (' + d.slice(1, 4);
  if (d.length >= 4) out += ')';
  if (d.length > 4) out += ' ' + d.slice(4, 7);
  if (d.length > 7) out += '-' + d.slice(7, 9);
  if (d.length > 9) out += '-' + d.slice(9, 11);
  return out;
}

function todayISO(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

export function validateField(field: keyof LeadData, data: LeadData): string | undefined {
  switch (field) {
    case 'name': {
      const v = data.name.trim();
      if (!v) return 'Напишите, как к вам обращаться';
      if (v.length < 2) return 'Имя слишком короткое';
      if (v.length > LIMITS.name) return `Не длиннее ${LIMITS.name} символов`;
      return undefined;
    }
    case 'phone': {
      const d = phoneDigits(data.phone);
      if (!d) return 'Укажите телефон, чтобы я мог с вами связаться';
      if (d.length < 11 || d.length > 15) return 'Проверьте номер: например, +7 (983) 450-30-06';
      return undefined;
    }
    case 'eventType':
      return data.eventType ? undefined : 'Выберите формат праздника';
    case 'date': {
      if (!data.date) return undefined;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return 'Укажите дату в формате ДД.ММ.ГГГГ';
      if (data.date < todayISO()) return 'Эта дата уже прошла';
      return undefined;
    }
    case 'guests': {
      if (!data.guests) return undefined;
      const n = Number(data.guests);
      if (!Number.isInteger(n) || n < 1 || n > 5000) return 'Укажите число гостей от 1 до 5000';
      return undefined;
    }
    case 'place':
      return data.place.length > LIMITS.place ? `Не длиннее ${LIMITS.place} символов` : undefined;
    case 'comment':
      return data.comment.length > LIMITS.comment ? `Не длиннее ${LIMITS.comment} символов` : undefined;
    case 'contactVia':
      return (CONTACT_OPTIONS as readonly string[]).includes(data.contactVia) ? undefined : 'Выберите способ связи';
    case 'consent':
      return data.consent ? undefined : 'Нужно согласие на обработку данных';
    default:
      return undefined;
  }
}

export const VALIDATED_FIELDS: (keyof LeadData)[] = [
  'name',
  'phone',
  'eventType',
  'date',
  'guests',
  'place',
  'contactVia',
  'comment',
  'consent',
];

export function validateLead(data: LeadData): LeadErrors {
  const errors: LeadErrors = {};
  for (const f of VALIDATED_FIELDS) {
    const e = validateField(f, data);
    if (e) errors[f] = e;
  }
  return errors;
}

/** Приводит произвольный JSON к LeadData (на сервере не доверяем входу). */
export function coerceLead(input: unknown): LeadData {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const s = (k: string, max = 2000) => (typeof o[k] === 'string' ? (o[k] as string).slice(0, max) : '');
  return {
    name: s('name', 200),
    phone: s('phone', 40),
    eventType: s('eventType', 60),
    date: s('date', 20),
    guests: s('guests', 10),
    place: s('place', 300),
    contactVia: s('contactVia', 20) || 'Звонок',
    comment: s('comment', 3000),
    consent: o.consent === true,
    website: s('website', 200),
  };
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDateRu(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}.${m}.${y}` : iso;
}

/** Текст сообщения для Telegram (parse_mode=HTML). */
export function telegramMessage(d: LeadData): string {
  const lines = [
    '🎉 <b>Новая заявка с сайта</b>',
    '',
    `👤 <b>Имя:</b> ${escapeHtml(d.name.trim())}`,
    `📞 <b>Телефон:</b> ${escapeHtml(d.phone.trim())}`,
    `💬 <b>Связаться:</b> ${escapeHtml(d.contactVia)}`,
    `🎊 <b>Формат:</b> ${escapeHtml(d.eventType)}`,
  ];
  if (d.date) lines.push(`📅 <b>Дата:</b> ${escapeHtml(formatDateRu(d.date))}`);
  if (d.guests) lines.push(`👥 <b>Гостей:</b> ${escapeHtml(d.guests)}`);
  if (d.place.trim()) lines.push(`📍 <b>Место:</b> ${escapeHtml(d.place.trim())}`);
  if (d.comment.trim()) lines.push('', `📝 ${escapeHtml(d.comment.trim())}`);
  return lines.join('\n');
}

/** Текст для запасного варианта — отправить ту же заявку в WhatsApp. */
export function plainSummary(d: LeadData): string {
  const parts = [
    `Здравствуйте, Никита! Хочу забронировать дату.`,
    `Имя: ${d.name.trim()}`,
    `Телефон: ${d.phone.trim()}`,
    `Формат: ${d.eventType}`,
  ];
  if (d.date) parts.push(`Дата: ${formatDateRu(d.date)}`);
  if (d.guests) parts.push(`Гостей: ${d.guests}`);
  if (d.place.trim()) parts.push(`Место: ${d.place.trim()}`);
  if (d.comment.trim()) parts.push(d.comment.trim());
  return parts.join('\n');
}
