import React, { useEffect } from 'react';
import Hero from '../components/Hero.jsx';
import Principles from '../components/Principles.jsx';
import Performance from '../components/Performance.jsx';
import Gallery from '../components/Gallery.jsx';
import Contact from '../components/Contact.jsx';

/**
 * HomePage Component
 *
 * Primary landing view composing the core promotional and informational sections:
 * Hero banner, institutional pillars/motto, performance statistics, highlights gallery,
 * and regional contact details.
 *
 * Coordinates DOM element scroll-reveal classes and smooth-scroll resolution for
 * deeplink hash fragments (e.g., `#performance`, `#contact`) across browser history navigations.
 */
export default function HomePage({ onNavigate }) {
  useEffect(() => {
    function revealInView() {
      const items = document.querySelectorAll('.reveal-item:not(.is-visible)');
      const triggerBottom = window.innerHeight * 0.92;
      items.forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < triggerBottom) {
          el.classList.add('is-visible');
        }
      });
    }

    // Initial viewport evaluations staggered to ensure elements rendered post-hydration are captured
    revealInView();
    const rafId = requestAnimationFrame(revealInView);
    const t1 = setTimeout(revealInView, 150);
    const t2 = setTimeout(revealInView, 400);

    // Resolve anchor scroll target if navigated via URI fragment (e.g., #performance)
    let hashTimer1 = null;
    let hashTimer2 = null;
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const scrollToHash = () => {
        const el = document.getElementById(targetId);
        if (el) {
          const header = document.getElementById('mainHeader') || document.querySelector('header');
          const navHeight = header ? header.getBoundingClientRect().height : 76;
          const elementPosition = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: Math.max(0, Math.round(elementPosition - navHeight)),
            behavior: 'smooth'
          });
        }
      };
      hashTimer1 = setTimeout(scrollToHash, 60);
      hashTimer2 = setTimeout(scrollToHash, 250);
    }

    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('resize', revealInView, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      if (hashTimer1) clearTimeout(hashTimer1);
      if (hashTimer2) clearTimeout(hashTimer2);
      window.removeEventListener('scroll', revealInView);
      window.removeEventListener('resize', revealInView);
    };
  }, []);

  return (
    <main className="flex-grow">
      <Hero onExploreHistory={() => onNavigate('history')} />
      <Principles />
      <Performance />
      <Gallery />
      <Contact />
    </main>
  );
}
