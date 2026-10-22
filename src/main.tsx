import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/fonts';
import './styles/base.css';
import { App } from './App';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// В продакшене HTML уже отрендерен заранее (для SEO и скорости) — «оживляем» его.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
