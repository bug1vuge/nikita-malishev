import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';

// Отдельная сборка «в один файл» для демонстрационного превью:
//   SINGLEFILE=1 VITE_DEMO=1 npx vite build --outDir dist-single
const singleFile = process.env.SINGLEFILE === '1';

export default defineConfig(async () => {
  const plugins: PluginOption[] = [
    react(),
    {
      // В режиме разработки подставляем заголовок; в продакшене мета-теги ставит пререндер
      name: 'dev-head',
      apply: 'serve',
      transformIndexHtml: (html: string) => html.replace('<!--dev-head-->', '<title>Никита Малышев — ведущий свадеб и мероприятий</title>'),
    },
  ];
  if (singleFile) {
    const { viteSingleFile } = await import('vite-plugin-singlefile');
    plugins.push(viteSingleFile());
  }
  return {
    // Для GitHub Pages сайт живёт в подпапке: BASE_PATH=/dambiev-site/
    base: process.env.BASE_PATH || '/',
    plugins,
    build: {
      target: ['es2020', 'safari14', 'firefox90', 'chrome90', 'edge90'],
      cssTarget: ['safari14', 'firefox90', 'chrome90', 'edge90'],
      assetsInlineLimit: singleFile ? 100_000_000 : 4096,
      reportCompressedSize: false,
    },
  };
});
