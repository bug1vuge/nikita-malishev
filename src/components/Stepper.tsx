import { useEffect, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import './Stepper.css';

interface StepperProps {
  id: string;
  name: string;
  /** Число строкой; пустая строка — поле не заполнено */
  value: string;
  min: number;
  max: number;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
  /** Подпись для кнопок, в родительном падеже множественного числа: «гостей» */
  unit: string;
}

/**
 * Числовое поле с кнопками «−» и «+» вместо системных стрелок input[type=number].
 * Удержание кнопки повторяет шаг и разгоняется (1 → 5 → 10), стрелки ↑/↓
 * на клавиатуре меняют значение на 1, с Shift — на 10. Можно ввести число руками.
 */
export function Stepper({ id, name, value, min, max, placeholder, onChange, onBlur, invalid, describedBy, unit }: StepperProps) {
  const current = value === '' ? null : Number(value);
  const valueRef = useRef(current);
  valueRef.current = current;
  const timer = useRef<number>(0);
  const fromPointer = useRef(false);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const step = (delta: number) => {
    const base = valueRef.current;
    // Из пустого поля «+» начинает с минимума, «−» ничего не делает
    const next = base === null ? (delta > 0 ? min : null) : clamp(base + delta);
    if (next === null) return;
    valueRef.current = next;
    onChange(String(next));
  };

  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = 0;
  };
  useEffect(() => stop, []);

  // Удержание: первый шаг сразу, через 400 мс — автоповтор, со временем шаг крупнее
  const startHold = (dir: 1 | -1) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    fromPointer.current = true;
    const started = performance.now();
    step(dir);
    const repeat = (delay: number) => {
      timer.current = window.setTimeout(() => {
        const held = performance.now() - started;
        step(dir * (held > 3000 ? 10 : held > 1500 ? 5 : 1));
        repeat(70);
      }, delay);
    };
    repeat(400);
  };

  // Клавиатура/скринридер нажимают кнопку через click — указатель его уже обработал
  const onClick = (dir: 1 | -1) => () => {
    if (fromPointer.current) {
      fromPointer.current = false;
      return;
    }
    step(dir);
  };

  // Если палец/мышь ушли с кнопки, не дав click, следующее нажатие с клавиатуры не должно потеряться
  const resetPointer = () => {
    fromPointer.current = false;
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      step((e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1));
    }
  };

  const atMin = current === null || current <= min;
  const atMax = current !== null && current >= max;

  return (
    <div className={`stepper${invalid ? ' is-invalid' : ''}`}>
      <button
        type="button"
        className="stepper__btn"
        aria-label={`Меньше ${unit}`}
        aria-controls={id}
        disabled={atMin}
        onPointerDown={startHold(-1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={resetPointer}
        onClick={onClick(-1)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 10h10" />
        </svg>
      </button>
      <input
        id={id}
        name={name}
        className="stepper__input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={String(max).length}
        placeholder={placeholder}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').replace(/^0+/, ''))}
        onKeyDown={onKey}
        onBlur={onBlur}
      />
      <button
        type="button"
        className="stepper__btn"
        aria-label={`Больше ${unit}`}
        aria-controls={id}
        disabled={atMax}
        onPointerDown={startHold(1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={resetPointer}
        onClick={onClick(1)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 10h10M10 5v10" />
        </svg>
      </button>
    </div>
  );
}
