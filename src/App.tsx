import { useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { MobileBar } from './components/MobileBar';
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
      <Header />
      <main id="main">
        <Hero />
        <Marquee />
      </main>
      <MobileBar />
    </>
  );
}
