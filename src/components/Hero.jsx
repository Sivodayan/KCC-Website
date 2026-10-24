import React from 'react';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import GlassImage from './GlassImage.jsx';

export default function Hero({ onExploreHistory }) {
  const { content } = useSiteContent();
  const hero = content?.hero || {};

  const title = hero.title || "J/Kopay Christian College";
  const tamilTitle = hero.tamilTitle || "யா/ கோப்பாய் கிறிஸ்தவ கல்லூரி";
  const subtitle = hero.subtitle || "A well-established mixed school in Kopay, Jaffna, dedicated to delivering holistic secondary and collegiate education.";
  const image = hero.image || "/assets/hero.jpg";
  const buttonText = hero.buttonText || "Explore History";

  const handleScrollToPrinciples = (e) => {
    e.preventDefault();
    const el = document.getElementById('principles');
    if (el) {
      const header = document.getElementById('mainHeader') || document.querySelector('header');
      const navHeight = header ? header.getBoundingClientRect().height : 76;
      const targetTop = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({
        top: Math.max(0, Math.round(targetTop)),
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-5 sm:py-8 bg-brand-white dark:bg-[#0b120c] border-b border-brand-pale dark:border-emerald-950/60 transition-colors" id="about">
      <div className="max-w-9xl mx-auto px-4 sm:px-10 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-forest dark:bg-[#071309] shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),_0_0_35px_rgba(74,222,128,0.12)] border border-brand-soft/40 dark:border-emerald-500/30 min-h-[550px] lg:min-h-[550px] flex items-center">

          {/* Background School Archway Image Container */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <GlassImage
              src={image}
              alt={`${title} School`}
              variant="dark"
              loading="eager"
              containerClassName="w-full h-full hero-bg-photo"
              className="w-full h-full object-cover object-top scale-105 sm:scale-110 lg:scale-100 origin-center translate-x-0 sm:translate-x-[8%] lg:translate-x-[26%] brightness-[0.94] contrast-[1.04] hero-bg-photo"
              fallbackSrc="/assets/hero.jpg"
            />

            {/* Desktop Scrim: Multi-stop optical easing curve that seamlessly dissolves into the campus photo */}
            <div className="hidden sm:block absolute inset-0 hero-scrim-desktop pointer-events-none" />

            {/* Mobile Scrim: Top-to-bottom gentle fade preventing text clash */}
            <div className="sm:hidden absolute inset-0 hero-scrim-mobile pointer-events-none" />

            {/* Ambient Lighting Vignette: Subtle radial spotlight behind typography + grounded bottom shadow */}
            <div className="absolute inset-0 hero-ambient-vignette pointer-events-none" />
          </div>

          {/* Hero Typography & Content */}
          <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-12 lg:py-16 text-left">
            <div className="space-y-3 mb-5 animate-hero-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-white tracking-tight leading-[1.14] drop-shadow-xs">
                {title}
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-pale dark:text-emerald-200 font-tamil tracking-tight leading-snug drop-shadow-xs">
                {tamilTitle}
              </h2>
            </div>

            <p className="text-base sm:text-lg text-emerald-50/95 dark:text-emerald-100/85 max-w-xl leading-relaxed mb-8 font-normal animate-hero-2">
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 animate-hero-3">
              <button
                type="button"
                onClick={onExploreHistory}
                className="group relative inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-brand-white text-brand-forest hover:bg-emerald-50 font-bold shadow-md hover:shadow-lg transition-all duration-200 ease-out transform-gpu text-sm sm:text-base cursor-pointer select-none active:scale-[0.98]"
              >
                <span>{buttonText}</span>
                <svg
                  className="w-4 h-4 text-brand-forest transition-transform duration-200 ease-out group-hover:translate-x-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
