/**
 * Серверная функция: принимает заявку и отправляет её в Telegram.
 * Работает на Vercel из коробки (папка /api). Токен бота хранится
 * только на сервере в переменных окружения и никогда не попадает в браузер.
 *
 *   TELEGRAM_BOT_TOKEN — токен от @BotFather
 *   TELEGRAM_CHAT_ID   — куда слать заявки (личка, группа или канал)
 */
import { coerceLead, telegramMessage, validateLead } from '../src/lib/validation';

interface Req {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

// Простой антиспам: не больше 5 заявок с одного IP за 10 минут (в пределах инстанса)
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Метод не поддерживается' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('[lead] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы');
    return res.status(500).json({ ok: false, error: 'Сервер не настроен' });
  }

  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Слишком много заявок' });
  }

  let raw = req.body;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return res.status(400).json({ ok: false, error: 'Некорректные данные' });
    }
  }
  const data = coerceLead(raw);

  // Бот заполнил скрытое поле — отвечаем «успехом», ничего не отправляя
  if (data.website) return res.status(200).json({ ok: true });

  const errors = validateLead(data);
  if (Object.keys(errors).length) {
    return res.status(422).json({ ok: false, error: 'Проверьте поля, отмеченные красным.', fields: errors });
  }

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: telegramMessage(data), parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10000),
    });
    const body = (await tg.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!tg.ok || !body.ok) {
      console.error('[lead] Telegram API error', tg.status, body.description);
      return res.status(502).json({ ok: false, error: 'Не удалось доставить заявку' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[lead] Telegram request failed', e);
    return res.status(502).json({ ok: false, error: 'Не удалось доставить заявку' });
  }
}
