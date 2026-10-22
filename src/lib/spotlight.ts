/**
 * Прожектор на первом экране: световой конус из-под потолка ведёт пятно света
 * за курсором, пылинки в луче вспыхивают, имя подсвечивается там, куда падает свет.
 * На сенсорных экранах и без движения мыши пятно само медленно «ищет» по сцене.
 * Всё управление — через CSS-переменные; JS только считает координаты.
 */

interface Options {
  section: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Элемент с подсвечиваемым текстом (имя) */
  lit: HTMLElement;
  reduced: boolean;
  finePointer: boolean;
}

interface Mote {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  phase: number;
}

const IDLE_MS = 3500;

export function createSpotlight({ section, canvas, lit, reduced, finePointer }: Options) {
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let active = true;
  let lastPointer = -Infinity;
  const pos = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let motes: Mote[] = [];

  const homePoint = () => {
    // Центр имени — сюда свет смотрит по умолчанию
    const s = section.getBoundingClientRect();
    const n = lit.getBoundingClientRect();
    return { x: n.left - s.left + n.width * 0.45, y: n.top - s.top + n.height * 0.5 };
  };

  const resize = () => {
    const r = section.getBoundingClientRect();
    w = r.width;
    h = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (w * h) / 16000));
    motes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vy: -(0.05 + Math.random() * 0.18),
      vx: (Math.random() - 0.5) * 0.08,
      phase: Math.random() * Math.PI * 2,
    }));
  };

  const apply = () => {
    // Источник света — прожектор под шапкой сайта
    const srcX = w * 0.5;
    const srcY = (parseFloat(getComputedStyle(section).getPropertyValue('--header-h')) || 72) + 14;
    const dx = pos.x - srcX;
    const dy = pos.y - srcY;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
    section.style.setProperty('--sx', `${pos.x.toFixed(1)}px`);
    section.style.setProperty('--sy', `${pos.y.toFixed(1)}px`);
    section.style.setProperty('--beam-len', `${(len + 140).toFixed(1)}px`);
    section.style.setProperty('--beam-angle', `${(-angle).toFixed(2)}deg`);
    const s = section.getBoundingClientRect();
    const n = lit.getBoundingClientRect();
    lit.style.setProperty('--lx', `${(pos.x - (n.left - s.left)).toFixed(1)}px`);
    lit.style.setProperty('--ly', `${(pos.y - (n.top - s.top)).toFixed(1)}px`);
  };

  const drawMotes = (t: number) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const R = Math.max(180, Math.min(w, h) * 0.32);
    for (const m of motes) {
      if (!reduced) {
        m.x += m.vx + Math.sin(t * 0.0006 + m.phase) * 0.05;
        m.y += m.vy;
        if (m.y < -4) {
          m.y = h + 4;
          m.x = Math.random() * w;
        }
      }
      const d = Math.hypot(m.x - pos.x, m.y - pos.y);
      const glow = Math.max(0, 1 - d / R);
      const twinkle = 0.75 + 0.25 * Math.sin(t * 0.003 + m.phase);
      const a = (0.06 + glow * glow * 0.85) * twinkle;
      if (a < 0.03) continue;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 236, 205, ${a.toFixed(3)})`;
      ctx.arc(m.x, m.y, m.r * (1 + glow * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const frame = (t: number) => {
    raf = 0;
    if (!finePointer || t - lastPointer > IDLE_MS) {
      // Свободный поиск: плавная восьмёрка вокруг имени
      const home = homePoint();
      const k = t * 0.00035;
      target.x = home.x + Math.sin(k) * w * 0.22;
      target.y = home.y + Math.sin(k * 1.7) * h * 0.12;
    }
    pos.x += (target.x - pos.x) * 0.08;
    pos.y += (target.y - pos.y) * 0.08;
    apply();
    drawMotes(t);
    if (active) raf = requestAnimationFrame(frame);
  };

  const onMove = (e: PointerEvent) => {
    const r = section.getBoundingClientRect();
    target.x = e.clientX - r.left;
    target.y = e.clientY - r.top;
    lastPointer = performance.now();
  };

  const start = () => {
    if (!raf && active && !reduced) raf = requestAnimationFrame(frame);
  };

  const onResize = () => {
    resize();
    if (reduced) {
      Object.assign(pos, homePoint());
      apply();
      drawMotes(0);
    }
  };

  resize();
  Object.assign(pos, homePoint());
  Object.assign(target, pos);
  apply();
  drawMotes(0);
  window.addEventListener('resize', onResize, { passive: true });
  if (finePointer && !reduced) section.addEventListener('pointermove', onMove, { passive: true });
  start();

  return {
    setActive(v: boolean) {
      active = v;
      if (v) start();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      section.removeEventListener('pointermove', onMove);
    },
  };
}
