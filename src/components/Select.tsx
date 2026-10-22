import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import './Select.css';

interface SelectProps {
  id: string;
  /** id подписи поля — им называется раскрытый список для скринридеров */
  labelId: string;
  name: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (value: string) => void;
  /** Вызывается, когда пользователь покинул поле (для валидации). */
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Выпадающий список в стиле сайта (нативный <select> нельзя оформить
 * изнутри — список опций рисует система). Паттерн «кнопка + listbox»:
 * клавиатура (стрелки, Home/End, Enter/Space, Escape, Tab, поиск по букве),
 * клик вне списка, aria-атрибуты для скринридеров.
 */
export function Select({ id, labelId, name, value, options, placeholder, onChange, onBlur, invalid, describedBy }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', timer: 0 });
  const listId = `${id}-list`;
  const optionId = (i: number) => `${listId}-opt-${i}`;
  const selectedIndex = options.indexOf(value);

  const openList = (startAt?: number) => {
    setActive(startAt ?? (selectedIndex >= 0 ? selectedIndex : 0));
    setOpen(true);
  };

  const close = (focusButton: boolean) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };

  const choose = (i: number) => {
    if (i >= 0 && i < options.length) onChange(options[i]);
    close(true);
  };

  // Фокус в список при открытии и прокрутка к активной опции
  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  }, [open, active]); // optionId зависит только от id — стабилен

  // Клик вне списка закрывает его
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

  const findByLetter = (key: string) => {
    const t = typeahead.current;
    window.clearTimeout(t.timer);
    t.text += key.toLowerCase();
    t.timer = window.setTimeout(() => (t.text = ''), 600);
    const from = active >= 0 ? active : 0;
    const search = (text: string) => {
      const order = [...options.keys()].map((k) => (from + (text.length === 1 ? 1 : 0) + k) % options.length);
      return order.find((i) => options[i].toLowerCase().startsWith(text)) ?? -1;
    };
    const found = search(t.text);
    if (found >= 0 || t.text.length === 1) return found;
    // «кн» ничего не нашло — начинаем поиск заново с последней буквы
    t.text = key.toLowerCase();
    return search(t.text);
  };

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList(e.key === 'ArrowUp' && selectedIndex < 0 ? options.length - 1 : undefined);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const i = findByLetter(e.key);
      if (i >= 0) onChange(options[i]);
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(options.length - 1, a + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        setOpen(false);
        onBlur?.();
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const i = findByLetter(e.key);
          if (i >= 0) setActive(i);
        }
    }
  };

  return (
    <div ref={rootRef} className={`select${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        name={name}
        className={`select__button${value ? '' : ' is-placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close(true) : openList())}
        onKeyDown={onButtonKey}
        onBlur={() => {
          if (!open) onBlur?.();
        }}
      >
        <span className="select__value">{value || placeholder}</span>
        <span className="select__chevron" aria-hidden="true" />
      </button>

      <ul
        ref={listRef}
        id={listId}
        className="select__list"
        role="listbox"
        tabIndex={-1}
        aria-labelledby={labelId}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        hidden={!open}
        onKeyDown={onListKey}
      >
        {options.map((o, i) => (
          <li
            key={o}
            id={optionId(i)}
            role="option"
            aria-selected={o === value}
            className={`select__option${i === active ? ' is-active' : ''}`}
            onPointerMove={() => setActive(i)}
            onClick={() => choose(i)}
          >
            {o}
            <svg viewBox="0 0 20 20" aria-hidden="true" className="select__check">
              <path d="M4 10.5l4 4 8-9" />
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
}
