import { useEffect } from 'react';
import { initButtonGlow, initParallax, initReveal } from './lib/motion';

export function App() {
  useEffect(() => {
    const stops = [initReveal(), initParallax(), initButtonGlow()];
    return () => stops.forEach((s) => s());
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <main id="main" />
    </>
  );
}
