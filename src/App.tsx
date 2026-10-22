import { useEffect } from 'react';
import { About } from './components/About';
import { Benefits } from './components/Benefits';
import { Booking } from './components/Booking';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { Formats } from './components/Formats';
import { Gallery } from './components/Gallery';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { MobileBar } from './components/MobileBar';
import { Packages } from './components/Packages';
import { Reviews } from './components/Reviews';
import { Steps } from './components/Steps';
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
        <About />
        <Formats />
        <Packages />
        <Benefits />
        <Steps />
        <Gallery />
        <Reviews />
        <Faq />
        <Booking />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
