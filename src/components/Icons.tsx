import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const;

export const PhoneIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 6.9 6.9l1.3-2 4 1.6V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);

export const WhatsAppIcon = (p: P) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
  </svg>
);

export const TelegramIcon = (p: P) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.5 13.2 1.8 11.7c-1-.3-1-1 .2-1.5l18.4-7.1c.9-.3 1.6.2 1.5 1.2Z" />
  </svg>
);

export const InstagramIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const VkIcon = (p: P) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M12.8 18C6.4 18 2.8 13.6 2.6 6.3h3.2c.1 5.4 2.5 7.6 4.3 8.1V6.3h3v4.6c1.8-.2 3.7-2.3 4.4-4.6h3a8.8 8.8 0 0 1-4 5.8 9.2 9.2 0 0 1 4.8 5.9h-3.3a5.8 5.8 0 0 0-4.9-4.2V18h-.3Z" />
  </svg>
);

export const ArrowIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const SparkIcon = (p: P) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5C11.5 16.9 7.1 12.5 1.5 12 7.1 11.5 11.5 7.1 12 1.5Z" />
  </svg>
);

/** Два кольца — значок профиля на свадебной площадке Горько */
export const RingsIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <circle cx="9" cy="14" r="5.5" />
    <circle cx="15" cy="14" r="5.5" />
    <path d="M12 3.5 13.6 6h-3.2L12 3.5Z" fill="currentColor" stroke="none" />
  </svg>
);
