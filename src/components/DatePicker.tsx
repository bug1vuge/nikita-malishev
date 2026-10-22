import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import './DatePicker.css';

interface DatePickerProps {
  id: string;
  /** id подписи поля — им назван календарь для скринридеров */
  labelId: string;
  name: string;
  /** Дата в формате YYYY-MM-DD или пустая строка */
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  /** Вызывается, когда пользователь покинул поле (для валидации). */
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
/** Сколько лет вперёд можно листать календарь */
const YEARS_AHEAD = 3;

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Сдвиг на n месяцев с прижатием дня к концу месяца (31 января + 1 месяц = 28/29 февраля) */
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7; // понедельник = 0

const longFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const fullFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** «12 июня 2027 г., сб» */
function displayValue(iso: string): string {
  const d = fromISO(iso);
  return `${longFormat.format(d)}, ${weekdayFormat.format(d)}`;
}

/**
 * Календарь в стиле сайта вместо системного input[type=date].
 * Прошедшие даты недоступны, выходные подсвечены. Клавиатура как в
 * паттерне WAI-ARIA Date Picker Dialog: стрелки — день/неделя,
 * PageUp/PageDown — месяц (с Shift — год), Home/End — начало/конец недели,
 * Enter — выбрать, Escape — закрыть.
 */
export function DatePicker({ id, labelId, name, value, placeholder, onChange, onBlur, invalid, describedBy }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [focused, setFocused] = useState<Date | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const moveFocus = useRef(false);
  const titleId = `${id}-title`;
  const dialogId = `${id}-dialog`;

  const maxDate = today ? new Date(today.getFullYear() + YEARS_AHEAD, today.getMonth() + 1, 0) : null;
  const clamp = (d: Date) => (today && d < today ? today : maxDate && d > maxDate ? maxDate : d);

  const openCalendar = () => {
    const now = new Date();
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = value && fromISO(value) >= t ? fromISO(value) : t;
    setToday(t);
    setFocused(start);
    setView({ y: start.getFullYear(), m: start.getMonth() });
    moveFocus.current = true;
    setOpen(true);
  };

  const close = (focusButton: boolean) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };

  const choose = (d: Date) => {
    onChange(toISO(d));
    close(true);
  };

  /** Перенос фокуса на день (с перелистыванием месяца при необходимости) */
  const focusDay = (d: Date) => {
    const next = clamp(d);
    setFocused(next);
    setView({ y: next.getFullYear(), m: next.getMonth() });
    moveFocus.current = true;
  };

  // Фокус на активный день — только когда он сменился с клавиатуры или при открытии
  useEffect(() => {
    if (!open || !focused || !moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${toISO(focused)}"]`)?.focus();
  }, [open, focused, view]);

  // Клик вне календаря закрывает его
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, onBlur]);

  const onGridKey = (e: KeyboardEvent<HTMLTableElement>) => {
    if (!focused) return;
    const keys: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -weekdayIndex(focused)),
      End: () => addDays(focused, 6 - weekdayIndex(focused)),
      PageUp: () => addMonths(focused, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, e.shiftKey ? 12 : 1),
    };
    if (keys[e.key]) {
      e.preventDefault();
      focusDay(keys[e.key]());
    }
  };

  const onDialogKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    }
  };

  const onDialogBlur = (e: FocusEvent<HTMLDivElement>) => {
    // Фокус ушёл за пределы календаря (Tab) — закрываем
    if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
      onBlur?.();
    }
  };

  const shiftMonth = (n: number) => {
    if (!view || !focused) return;
    const target = addMonths(new Date(view.y, view.m, Math.min(focused.getDate(), 28)), n);
    const next = clamp(new Date(target.getFullYear(), target.getMonth(), focused.getDate() > 28 ? 1 : focused.getDate()));
    setView({ y: target.getFullYear(), m: target.getMonth() });
    setFocused(next);
  };

  // Сетка месяца: пустые ячейки до первого числа, затем дни
  const weeks: (Date | null)[][] = [];
  if (view) {
    const first = new Date(view.y, view.m, 1);
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const cells: (Date | null)[] = Array(weekdayIndex(first)).fill(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(view.y, view.m, d));
    while (cells.length % 7) cells.push(null);
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  }

  const canPrev = !!(view && today && (view.y > today.getFullYear() || (view.y === today.getFullYear() && view.m > today.getMonth())));
  const canNext = !!(view && maxDate && (view.y < maxDate.getFullYear() || (view.y === maxDate.getFullYear() && view.m < maxDate.getMonth())));
  const valueISO = value;
  const todayISO = today ? toISO(today) : '';
  const focusedISO = focused ? toISO(focused) : '';

  return (
    <div ref={rootRef} className={`datepicker${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        name={name}
        className={`datepicker__button${value ? '' : ' is-placeholder'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close(true) : openCalendar())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            openCalendar();
          }
        }}
        onBlur={(e) => {
          if (!open && !rootRef.current?.contains(e.relatedTarget as Node | null)) onBlur?.();
        }}
      >
        <span className="datepicker__value">{value ? displayValue(value) : placeholder}</span>
        <svg className="datepicker__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </button>

      <div
        id={dialogId}
        className="datepicker__dialog"
        role="dialog"
        aria-modal="false"
        aria-labelledby={labelId}
        hidden={!open}
        onKeyDown={onDialogKey}
        onBlur={onDialogBlur}
      >
        {open && view && (
          <>
            <div className="datepicker__head">
              <p className="datepicker__title" id={titleId} aria-live="polite">
                {MONTHS[view.m]} {view.y}
              </p>
              <div className="datepicker__nav">
                <button type="button" className="datepicker__arrow" onClick={() => shiftMonth(-1)} disabled={!canPrev} aria-label="Предыдущий месяц">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M12.5 4.5 7 10l5.5 5.5" />
                  </svg>
                </button>
                <button type="button" className="datepicker__arrow" onClick={() => shiftMonth(1)} disabled={!canNext} aria-label="Следующий месяц">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M7.5 4.5 13 10l-5.5 5.5" />
                  </svg>
                </button>
              </div>
            </div>

            <table ref={gridRef} className="datepicker__grid" role="grid" aria-labelledby={titleId} onKeyDown={onGridKey}>
              <thead>
                <tr>
                  {WEEKDAYS.map((w, i) => (
                    <th key={w} scope="col" className={i >= 5 ? 'is-weekend' : undefined}>
                      <abbr title={['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'][i]}>{w}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((d, di) => {
                      if (!d) return <td key={di} />;
                      const iso = toISO(d);
                      const disabled = !!(today && d < today) || !!(maxDate && d > maxDate);
                      const cls = [
                        'datepicker__day',
                        di >= 5 ? 'is-weekend' : '',
                        iso === todayISO ? 'is-today' : '',
                        iso === valueISO ? 'is-selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <td key={di}>
                          <button
                            type="button"
                            className={cls}
                            data-date={iso}
                            tabIndex={iso === focusedISO ? 0 : -1}
                            disabled={disabled}
                            aria-label={fullFormat.format(d)}
                            aria-pressed={iso === valueISO}
                            aria-current={iso === todayISO ? 'date' : undefined}
                            onClick={() => choose(d)}
                            onFocus={() => setFocused(d)}
                          >
                            {d.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="datepicker__foot">
              <span className="datepicker__legend">
                <i aria-hidden="true" /> выходные
              </span>
              {value && (
                <button
                  type="button"
                  className="datepicker__clear"
                  onClick={() => {
                    onChange('');
                    close(true);
                  }}
                >
                  Сбросить дату
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
