import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { contacts, eventTypes, sections } from '../content';
import { burstConfetti } from '../lib/motion';
import { sendLead } from '../lib/sendLead';
import {
  CONTACT_OPTIONS,
  emptyLead,
  formatPhone,
  LIMITS,
  plainSummary,
  VALIDATED_FIELDS,
  validateField,
  validateLead,
  type LeadData,
  type LeadErrors,
} from '../lib/validation';
import { channels } from './channels';
import { PhoneIcon, RingsIcon, WhatsAppIcon } from './Icons';
import { DatePicker } from './DatePicker';
import { Select } from './Select';
import { Stepper } from './Stepper';
import './Booking.css';

type Status = 'idle' | 'sending' | 'success' | 'error';
const DRAFT_KEY = 'malyshev-lead-draft';

function loadDraft(): Partial<LeadData> {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<LeadData>) : {};
  } catch {
    return {};
  }
}

function saveDraft(d: LeadData | null) {
  try {
    if (!d) window.localStorage.removeItem(DRAFT_KEY);
    else {
      const { consent: _c, website: _w, ...rest } = d;
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    }
  } catch {
    /* хранилище недоступно (приватный режим) — просто не сохраняем */
  }
}

export function Booking() {
  const [data, setData] = useState<LeadData>(emptyLead);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LeadData, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverMsg, setServerMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Черновик и выбор формата из списка «Какие праздники я веду»
  useEffect(() => {
    const draft = loadDraft();
    if (Object.keys(draft).length) setData((d) => ({ ...d, ...draft, consent: false, website: '' }));
    const onPick = (e: Event) => {
      const v = (e as CustomEvent<string>).detail;
      if (eventTypes.includes(v)) setData((d) => ({ ...d, eventType: v }));
    };
    // Кнопка «Выбрать пакет» подставляет пакет в комментарий, если он пустой
    const onPackage = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      setData((d) => (d.comment.trim() ? d : { ...d, comment: `Интересует пакет «${name}»` }));
    };
    window.addEventListener('pick-event', onPick);
    window.addEventListener('pick-package', onPackage);
    return () => {
      window.removeEventListener('pick-event', onPick);
      window.removeEventListener('pick-package', onPackage);
    };
  }, []);

  useEffect(() => {
    if (status === 'idle' || status === 'error') saveDraft(data);
  }, [data, status]);

  const update = <K extends keyof LeadData>(field: K, value: LeadData[K]) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      if (touched[field]) setErrors((e) => ({ ...e, [field]: validateField(field, next) }));
      return next;
    });
  };

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const field = name as keyof LeadData;
    if (type === 'checkbox') update(field, (e.target as HTMLInputElement).checked as never);
    else if (field === 'phone') update('phone', formatPhone(value));
    else update(field, value as never);
  };

  const onBlur = (e: { target: { name: string } }) => {
    const field = e.target.name as keyof LeadData;
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((er) => ({ ...er, [field]: validateField(field, data) }));
  };

  const focusFirstError = (errs: LeadErrors) => {
    const first = VALIDATED_FIELDS.find((f) => errs[f]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.focus();
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (status === 'sending') return;

    const errs = validateLead(data);
    setErrors(errs);
    setTouched(Object.fromEntries(VALIDATED_FIELDS.map((f) => [f, true])));
    if (Object.values(errs).some(Boolean)) {
      setStatus('error');
      setServerMsg('Проверьте поля, отмеченные красным.');
      focusFirstError(errs);
      return;
    }

    // Бот заполнил скрытое поле — делаем вид, что всё прошло
    if (data.website) {
      setStatus('success');
      return;
    }

    setStatus('sending');
    setServerMsg('');
    const res = await sendLead(data);
    if (res.ok) {
      setStatus('success');
      saveDraft(null);
      const r = submitRef.current?.getBoundingClientRect();
      burstConfetti(r ? r.left + r.width / 2 : window.innerWidth / 2, r ? r.top : window.innerHeight / 2);
      requestAnimationFrame(() => successRef.current?.focus());
    } else {
      setStatus('error');
      setServerMsg(res.message);
      if (res.fields) {
        setErrors(res.fields);
        focusFirstError(res.fields);
      }
    }
  };

  const reset = () => {
    setData(emptyLead);
    setErrors({});
    setTouched({});
    setStatus('idle');
    setServerMsg('');
  };

  const err = (f: keyof LeadData) => (touched[f] ? errors[f] : undefined);
  const fieldProps = (f: keyof LeadData) => ({
    id: `lead-${f}`,
    name: f,
    onBlur,
    'aria-invalid': err(f) ? true : undefined,
    'aria-describedby': err(f) ? `lead-${f}-error` : undefined,
  });
  const errorText = (f: keyof LeadData) =>
    err(f) ? (
      <span className="field__error" id={`lead-${f}-error`}>
        {err(f)}
      </span>
    ) : null;

  const waFallback = `${contacts.whatsapp}?text=${encodeURIComponent(plainSummary(data))}`;
  const hasFieldErrors = VALIDATED_FIELDS.some((f) => err(f));

  return (
    <section className="section booking" id="booking" aria-labelledby="booking-title">
      <div className="booking__lights" aria-hidden="true" />
      <div className="container booking__grid">
        <div className="booking__intro" id="contacts">
          <h2 id="booking-title" data-reveal="up">
            {sections.booking.title}
          </h2>
          <p className="booking__lead" data-reveal="up">
            {sections.booking.lead}
          </p>

          <ul className="booking__contacts" data-reveal="up">
            {contacts.phone && (
              <li>
                <a className="booking__contact booking__contact--phone" href={contacts.phoneHref}>
                  <PhoneIcon />
                  <span>
                    <small>Телефон</small>
                    {contacts.phone}
                  </span>
                </a>
              </li>
            )}
            {channels.map(({ key, href, name, action, Icon }) => (
              <li key={key}>
                <a className="booking__contact" href={href} target="_blank" rel="noopener noreferrer">
                  <Icon />
                  <span>
                    <small>{name}</small>
                    {action}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="booking__card" data-reveal="right">
          {status === 'success' ? (
            <div className="booking__success" ref={successRef} tabIndex={-1} role="status">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="30" />
                <path d="M19 33l9 9 17-19" />
              </svg>
              <h3>Заявка отправлена!</h3>
              <p>Спасибо, {data.name.trim() || 'друзья'}! Я свяжусь с вами в ближайшее время.{contacts.phone ? ` Если дело срочное — звоните: ${contacts.phone}.` : ''}</p>
              <button type="button" className="btn btn--ink" onClick={reset}>
                Отправить ещё одну заявку
              </button>
            </div>
          ) : (
            <form ref={formRef} className="lead-form" noValidate onSubmit={submit} aria-describedby="lead-note">
              <h3 className="lead-form__title">Заявка на ведение</h3>

              <div className="lead-form__grid">
                <div className={`field${err('name') ? ' has-error' : ''}`}>
                  <label htmlFor="lead-name">Ваше имя *</label>
                  <input
                    {...fieldProps('name')}
                    type="text"
                    autoComplete="name"
                    maxLength={LIMITS.name}
                    value={data.name}
                    onChange={onChange}
                    placeholder="Анна"
                    required
                  />
                  {errorText('name')}
                </div>

                <div className={`field${err('phone') ? ' has-error' : ''}`}>
                  <label htmlFor="lead-phone">Телефон *</label>
                  <input
                    {...fieldProps('phone')}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={data.phone}
                    onChange={onChange}
                    placeholder="+7 (___) ___-__-__"
                    required
                  />
                  {errorText('phone')}
                </div>

                <div className={`field${err('eventType') ? ' has-error' : ''}`}>
                  <label htmlFor="lead-eventType" id="lead-eventType-label">
                    Формат праздника *
                  </label>
                  <Select
                    id="lead-eventType"
                    labelId="lead-eventType-label"
                    name="eventType"
                    value={data.eventType}
                    options={eventTypes}
                    placeholder="Выберите формат"
                    onChange={(v) => update('eventType', v)}
                    onBlur={() => onBlur({ target: { name: 'eventType' } })}
                    invalid={Boolean(err('eventType'))}
                    describedBy={err('eventType') ? 'lead-eventType-error' : undefined}
                  />
                  {errorText('eventType')}
                </div>

                <div className={`field field--date-end${err('date') ? ' has-error' : ''}`}>
                  <label htmlFor="lead-date" id="lead-date-label">
                    Дата
                  </label>
                  <DatePicker
                    id="lead-date"
                    labelId="lead-date-label"
                    name="date"
                    value={data.date}
                    placeholder="Выберите дату"
                    onChange={(v) => update('date', v)}
                    onBlur={() => onBlur({ target: { name: 'date' } })}
                    invalid={Boolean(err('date'))}
                    describedBy={err('date') ? 'lead-date-error' : undefined}
                  />
                  {errorText('date')}
                </div>

                <div className={`field${err('guests') ? ' has-error' : ''}`}>
                  <label htmlFor="lead-guests">Сколько гостей</label>
                  <Stepper
                    id="lead-guests"
                    name="guests"
                    value={data.guests}
                    min={1}
                    max={5000}
                    placeholder="50"
                    unit="гостей"
                    onChange={(v) => update('guests', v)}
                    onBlur={() => onBlur({ target: { name: 'guests' } })}
                    invalid={Boolean(err('guests'))}
                    describedBy={err('guests') ? 'lead-guests-error' : undefined}
                  />
                  {errorText('guests')}
                </div>

                <div className={`field${err('place') ? ' has-error' : ''}`}>
                  <label htmlFor="lead-place">Город или площадка</label>
                  <input
                    {...fieldProps('place')}
                    type="text"
                    maxLength={LIMITS.place}
                    value={data.place}
                    onChange={onChange}
                    placeholder="Ресторан, загородный клуб…"
                  />
                  {errorText('place')}
                </div>

                <fieldset className="field field--wide field--radios">
                  <legend>Как с вами связаться</legend>
                  <div className="radios">
                    {CONTACT_OPTIONS.map((o) => (
                      <label key={o} className="radio">
                        <input type="radio" name="contactVia" value={o} checked={data.contactVia === o} onChange={onChange} />
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className={`field field--wide${err('comment') ? ' has-error' : ''}`}>
                  <label htmlFor="lead-comment">Расскажите о празднике</label>
                  <textarea
                    {...fieldProps('comment')}
                    rows={3}
                    maxLength={LIMITS.comment}
                    value={data.comment}
                    onChange={onChange}
                    placeholder="Повод, пожелания, что точно не нужно"
                  />
                  {errorText('comment')}
                </div>

                {/* Ловушка для ботов: скрыта от людей и скринридеров */}
                <div className="lead-form__hp" aria-hidden="true">
                  <label htmlFor="lead-website">Сайт</label>
                  <input id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={data.website} onChange={onChange} />
                </div>

                <div className={`field field--wide field--check${err('consent') ? ' has-error' : ''}`}>
                  <label className="check">
                    <input {...fieldProps('consent')} type="checkbox" checked={data.consent} onChange={onChange} required />
                    <span>
                      Согласен(на) на обработку персональных данных в соответствии с{' '}
                      <a href={`${import.meta.env.BASE_URL}privacy.html`} target="_blank" rel="noopener">
                        политикой конфиденциальности
                      </a>
                    </span>
                  </label>
                  {errorText('consent')}
                </div>
              </div>

              {status === 'error' && serverMsg && (
                <div className="lead-form__alert" role="alert">
                  <p>{serverMsg}</p>
                  {!hasFieldErrors && (
                    <div className="lead-form__alert-actions">
                      <button type="button" className="btn btn--ink" onClick={() => submit()}>
                        Отправить ещё раз
                      </button>
                      {contacts.whatsapp ? (
                        <a className="lead-form__wa" href={waFallback} target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon />
                          Отправить в WhatsApp
                        </a>
                      ) : (
                        <a className="lead-form__wa" href={contacts.gorko} target="_blank" rel="noopener noreferrer">
                          <RingsIcon />
                          Написать на Горько
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button ref={submitRef} type="submit" className={`btn lead-form__submit${status === 'sending' ? ' is-loading' : ''}`} disabled={status === 'sending'}>
                {status === 'sending' ? 'Отправляю заявку…' : 'Отправить заявку'}
              </button>
              <p className="lead-form__note" id="lead-note">
                Отвечаю в тот же день. Данные нужны только для связи с вами.
              </p>
              <p className="visually-hidden" aria-live="polite">
                {status === 'sending' ? 'Заявка отправляется' : ''}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
