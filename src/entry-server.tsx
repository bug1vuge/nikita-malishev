import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { HERO_PHOTO, HERO_SIZES } from './components/Hero';
import { contacts, faq, person, reviews, seo, site } from './content';
import { photoUrls, REMOTE_ORIGIN } from './lib/photoSrc';

/** HTML приложения для пререндера (поисковики видят весь текст сразу). */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}


/** Предзагрузка главного фото с тем же srcset, что у <img> — без двойной загрузки. */
function heroPreload(): string[] {
  const urls = photoUrls(HERO_PHOTO);
  if (urls.avif) {
    return [`<link rel="preload" as="image" type="image/avif" imagesrcset="${urls.avif}" imagesizes="${HERO_SIZES}" fetchpriority="high">`];
  }
  return [
    `<link rel="preconnect" href="${REMOTE_ORIGIN}">`,
    `<link rel="preload" as="image" imagesrcset="${urls.srcSet}" imagesizes="${HERO_SIZES}" fetchpriority="high">`,
  ];
}

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Мета-теги, Open Graph и микроразметка Schema.org. */
export function head(): string {
  const url = `${site.url}/`;
  const sameAs = [contacts.instagram, contacts.vk, contacts.gorko].filter(Boolean);
  const telephone = contacts.phone ? { telephone: contacts.phone.replace(/[^\d+]/g, '') } : {};

  const realReviews = reviews.filter((r) => !r.placeholder);

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: person.fullName,
      jobTitle: person.role,
      description: seo.description,
      image: seo.ogImage,
      ...telephone,
      url,
      sameAs,
    },
    {
      '@type': 'ProfessionalService',
      '@id': `${url}#service`,
      name: `${person.fullName} — ведущий мероприятий`,
      description: seo.description,
      image: seo.ogImage,
      ...telephone,
      url,
      founder: { '@id': `${url}#person` },
      ...(site.city ? { address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: 'RU' } } : {}),
      areaServed: site.areas.map((name) => ({ '@type': 'Place', name })),
      serviceType: ['Ведущий на свадьбу', 'Ведущий на юбилей', 'Ведущий корпоратива', 'Ведущий выпускного'],
      sameAs,
      ...(realReviews.length
        ? {
            review: realReviews.map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.name },
              reviewBody: r.text,
            })),
          }
        : {}),
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');

  return [
    `<title>${esc(seo.title)}</title>`,
    // Демо-версия (GitHub Pages с образцами отзывов) не должна попасть в поиск
    ...(import.meta.env.VITE_NOINDEX === '1' ? ['<meta name="robots" content="noindex, nofollow">'] : []),
    `<meta name="description" content="${esc(seo.description)}">`,
    `<meta name="keywords" content="${esc(seo.keywords)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="ru_RU">`,
    `<meta property="og:site_name" content="${esc(person.fullName)}">`,
    `<meta property="og:title" content="${esc(seo.title)}">`,
    `<meta property="og:description" content="${esc(seo.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(seo.ogImage)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    ...heroPreload(),
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ');
}
