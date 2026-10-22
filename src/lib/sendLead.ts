import type { LeadData, LeadErrors } from './validation';

export type SendResult =
  | { ok: true }
  | { ok: false; kind: 'offline' | 'timeout' | 'network' | 'server' | 'rate' | 'validation'; message: string; fields?: LeadErrors };

const ENDPOINT = (import.meta.env.VITE_LEAD_ENDPOINT as string | undefined) || `${import.meta.env.BASE_URL}api/lead`;
const DEMO = import.meta.env.VITE_DEMO === '1';
const TIMEOUT_MS = 15000;

/** Отправка заявки с таймаутом и понятными сообщениями на каждый тип ошибки. */
export async function sendLead(data: LeadData): Promise<SendResult> {
  if (DEMO) {
    await new Promise((r) => setTimeout(r, 1100));
    return { ok: true };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, kind: 'offline', message: 'Нет подключения к интернету. Проверьте сеть и отправьте ещё раз — данные в форме сохранены.' };
  }

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl.signal,
    });

    let body: { ok?: boolean; error?: string; fields?: LeadErrors } = {};
    try {
      body = await res.json();
    } catch {
      /* сервер вернул не JSON — обработаем по статусу */
    }

    if (res.ok && body.ok !== false) return { ok: true };

    if (res.status === 422 || res.status === 400) {
      return {
        ok: false,
        kind: 'validation',
        message: body.error || 'Проверьте поля, отмеченные красным.',
        fields: body.fields,
      };
    }
    if (res.status === 429) {
      return { ok: false, kind: 'rate', message: 'Слишком много заявок подряд. Подождите минуту и попробуйте снова.' };
    }
    return {
      ok: false,
      kind: 'server',
      message: 'Заявка не дошла из-за сбоя на сервере. Попробуйте ещё раз или отправьте её в WhatsApp одной кнопкой.',
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { ok: false, kind: 'timeout', message: 'Сервер долго не отвечает. Попробуйте ещё раз или отправьте заявку в WhatsApp.' };
    }
    return { ok: false, kind: 'network', message: 'Не получилось связаться с сервером. Проверьте интернет или отправьте заявку в WhatsApp.' };
  } finally {
    window.clearTimeout(timer);
  }
}
