import React, { useState } from 'react';
import AboutDropdown from './AboutDropdown.jsx';
import GlassImage from './GlassImage.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar({
  currentPage,
  onNavigate,
  onOpenSearch,
  onOpenAnthem,
  historyLang,
  onChangeHistoryLang
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(true);

  function handleNavLink(page, hash = '') {
    setMobileMenuOpen(false);
    onNavigate(page, hash);
  }

  return (
    <header className="w-full border-b border-brand-pale dark:border-emerald-900/40 bg-brand-white/95 dark:bg-[#0b120c]/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-150" id="mainHeader">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-3.5" aria-label="Main Navigation">
          <button
            onClick={() => handleNavLink('home')}
            aria-label="J/Kopay Christian College Home"
            className="group flex items-center gap-3 cursor-pointer text-left focus:outline-none shrink-0"
          >
            <div
              className="school-crest-badge shrink-0 rounded-xl p-1 shadow-xs transition-all flex items-center justify-center border-0 dark:border dark:border-emerald-500/20"
              style={{ height: '48px', width: 'auto', minWidth: '44px', maxWidth: '54px', backgroundColor: '#ffffff' }}
            >
              <img
                src="/assets/logo.png"
                alt="Logo"
                className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0"
                loading="eager"
              />
            </div>
            <div className="hidden sm:block">
              <span className="block text-xs font-bold text-brand-forest dark:text-emerald-400 uppercase tracking-wider">
                J/Kopay Christian College
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-tamil">
                யா/ கோப்பாய் கிறிஸ்தவ கல்லூரி
              </span>
            </div>
          </button>

          {/* Right End: Navigation Bar Island + Theme Toggle */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0 ml-auto">
            <div className="flex items-center bg-brand-light dark:bg-[#122015] border border-brand-pale dark:border-emerald-800/40 px-3 py-1.5 rounded-full space-x-1 text-sm font-medium">
              <button
                onClick={() => handleNavLink('home')}
                className={`nav-link px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${currentPage === 'home'
                    ? 'text-brand-forest dark:text-emerald-300 bg-brand-pale/70 dark:bg-emerald-950/80 font-bold is-active shadow-xs dark:shadow-[0_0_12px_rgba(74,222,128,0.25)]'
                    : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-pale/60 dark:hover:bg-emerald-950/60'
                  }`}
              >
                Home
              </button>

              <button
                id="nav-performance-btn"
                onClick={() => handleNavLink('performance')}
                className="nav-link px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-pale/60 dark:hover:bg-emerald-950/60"
              >
                Performance
              </button>

              <button
                onClick={() => handleNavLink('events')}
                className={`nav-link px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${currentPage === 'events'
                    ? 'text-brand-forest dark:text-emerald-300 bg-brand-pale/70 dark:bg-emerald-950/80 font-bold is-active shadow-xs dark:shadow-[0_0_12px_rgba(74,222,128,0.25)]'
                    : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-pale/60 dark:hover:bg-emerald-950/60'
                  }`}
              >
                Events
              </button>

              <button
                onClick={() => handleNavLink('gallery')}
                className={`nav-link px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${currentPage === 'gallery'
                    ? 'text-brand-forest dark:text-emerald-300 bg-brand-pale/70 dark:bg-emerald-950/80 font-bold is-active shadow-xs dark:shadow-[0_0_12px_rgba(74,222,128,0.25)]'
                    : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-pale/60 dark:hover:bg-emerald-950/60'
                  }`}
              >
                Gallery
              </button>

              <AboutDropdown
                currentPage={currentPage}
                onNavigate={handleNavLink}
                onOpenAnthem={onOpenAnthem}
              />

              {currentPage === 'history' && (
                <div className="inline-flex items-center bg-brand-white dark:bg-[#101b12] border border-brand-pale dark:border-emerald-800/40 p-0.5 rounded-full text-xs font-semibold ml-1">
                  <button
                    type="button"
                    onClick={() => onChangeHistoryLang('en')}
                    className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${historyLang === 'en'
                        ? 'bg-brand-forest text-brand-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-brand-forest dark:hover:text-emerald-300'
                      }`}
                    aria-label="Switch to English"
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeHistoryLang('ta')}
                    className={`px-2.5 py-1 rounded-full transition-all duration-200 font-tamil cursor-pointer ${historyLang === 'ta'
                        ? 'bg-brand-forest text-brand-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-brand-forest dark:hover:text-emerald-300'
                      }`}
                    aria-label="Switch to Tamil"
                  >
                    தமிழ்
                  </button>
                </div>
              )}

              <button
                onClick={onOpenSearch}
                type="button"
                className="inline-flex items-center gap-1.5 bg-brand-white dark:bg-[#101b12] border border-brand-pale dark:border-emerald-500/40 hover:border-brand-soft dark:hover:border-emerald-400 text-slate-700 dark:text-emerald-100 hover:text-brand-forest dark:hover:text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all group shadow-2xs dark:shadow-[0_0_10px_rgba(74,222,128,0.12)] ml-1 cursor-pointer"
                aria-label="Search website"
              >
                <svg
                  className="w-3.5 h-3.5 text-brand-forest dark:text-emerald-400 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search</span>
              </button>

              <button
                onClick={() => handleNavLink('contact')}
                className={`ml-1 inline-flex items-center px-4 py-1.5 rounded-full font-medium transition-all duration-200 ease-out shadow-sm active:translate-y-0 cursor-pointer ${currentPage === 'contact'
                    ? 'bg-brand-forestHover text-white ring-2 ring-brand-forest font-bold'
                    : 'bg-brand-forest text-brand-white hover:bg-brand-forestHover hover:-translate-y-0.5'
                  }`}
              >
                Contact Us
              </button>
            </div>

            <ThemeToggle />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
            <ThemeToggle />

            <button
              onClick={onOpenSearch}
              type="button"
              className="p-2 rounded-xl bg-brand-light dark:bg-[#101b12] border border-brand-pale dark:border-emerald-500/40 text-slate-700 dark:text-emerald-300 hover:text-brand-forest transition-colors cursor-pointer dark:shadow-[0_0_10px_rgba(74,222,128,0.1)]"
              aria-label="Search"
            >
              <svg className="w-5 h-5 text-brand-forest dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              type="button"
              className="p-2 rounded-xl bg-brand-light dark:bg-[#101b12] border border-brand-pale dark:border-emerald-500/40 text-slate-700 dark:text-emerald-300 hover:text-brand-forest transition-colors cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-white dark:bg-[#101911] border-t border-brand-pale dark:border-emerald-900/40 px-6 py-4 space-y-3 shadow-lg">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSearch();
            }}
            type="button"
            className="w-full flex items-center gap-2 bg-brand-light dark:bg-[#0b140d] border border-brand-pale dark:border-emerald-500/40 px-4 py-2.5 rounded-xl text-xs text-slate-600 dark:text-emerald-200 font-medium hover:bg-brand-pale/50 dark:hover:bg-emerald-950/60 transition-colors text-left dark:shadow-[0_0_10px_rgba(74,222,128,0.1)]"
          >
            <svg className="w-4 h-4 text-brand-forest dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search KCC portal...</span>
          </button>

          <button
            onClick={() => handleNavLink('home')}
            className={`block w-full text-left font-medium py-2 rounded-lg px-3 transition-colors cursor-pointer ${currentPage === 'home'
                ? 'bg-brand-pale dark:bg-emerald-900/60 text-brand-forest dark:text-emerald-300 font-bold'
                : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-light dark:hover:bg-emerald-950/50'
              }`}
          >
            Home
          </button>

          <div className="border border-brand-pale dark:border-emerald-800/40 rounded-xl overflow-hidden bg-brand-light/40 dark:bg-[#0e1910]">
            <button
              type="button"
              onClick={() => setMobileAboutOpen(prev => !prev)}
              className="w-full flex items-center justify-between text-left text-slate-800 dark:text-slate-200 font-semibold py-2.5 px-3 hover:bg-brand-pale/40 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-brand-forest dark:bg-emerald-400"></span>
                <span>About</span>
              </span>
              <svg
                className={`w-4 h-4 text-brand-forest dark:text-emerald-400 transition-transform duration-200 ${mobileAboutOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileAboutOpen && (
              <div className="px-2 pb-2 space-y-1 bg-white/70 dark:bg-[#0c160e] border-t border-brand-pale/40 dark:border-emerald-900/40">
                <button
                  onClick={() => handleNavLink('history')}
                  className={`w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-brand-light dark:hover:bg-emerald-500/15 transition-colors cursor-pointer font-medium ${currentPage === 'history'
                      ? 'bg-brand-pale dark:bg-emerald-900/60 text-brand-forest dark:text-emerald-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300'
                    }`}
                >
                  History
                </button>
                <button
                  onClick={() => handleNavLink('anthem')}
                  className={`w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-brand-light dark:hover:bg-emerald-500/15 transition-colors cursor-pointer font-medium ${currentPage === 'anthem'
                      ? 'bg-brand-pale dark:bg-emerald-900/60 text-brand-forest dark:text-emerald-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300'
                    }`}
                >
                  School Anthem
                </button>
                <button
                  onClick={() => handleNavLink('motto')}
                  className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-brand-light dark:hover:bg-emerald-500/15 transition-colors cursor-pointer font-medium text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300"
                >
                  Motto
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleNavLink('events')}
            className={`block w-full text-left font-medium py-2 rounded-lg px-3 transition-colors cursor-pointer ${currentPage === 'events'
                ? 'bg-brand-pale dark:bg-emerald-900/60 text-brand-forest dark:text-emerald-300 font-bold'
                : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-light dark:hover:bg-emerald-950/50'
              }`}
          >
            Events
          </button>
          <button
            onClick={() => handleNavLink('gallery')}
            className={`block w-full text-left font-medium py-2 rounded-lg px-3 transition-colors cursor-pointer ${currentPage === 'gallery'
                ? 'bg-brand-pale dark:bg-emerald-900/60 text-brand-forest dark:text-emerald-300 font-bold'
                : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-light dark:hover:bg-emerald-950/50'
              }`}
          >
            Gallery
          </button>
          <button
            onClick={() => handleNavLink('performance')}
            className="block w-full text-left font-medium py-2 rounded-lg px-3 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-light dark:hover:bg-emerald-950/50"
          >
            Performance
          </button>
          <button
            onClick={() => handleNavLink('contact')}
            className={`block w-full text-center py-2.5 rounded-full font-medium transition-colors cursor-pointer ${currentPage === 'contact' ? 'bg-brand-forestHover text-white ring-2 ring-brand-forest font-bold' : 'bg-brand-forest hover:bg-brand-forestHover text-brand-white'
              }`}
          >
            Contact Us
          </button>

          {currentPage === 'history' && (
            <div className="flex items-center justify-between pt-2 border-t border-brand-pale dark:border-emerald-900/40">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">History Language:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onChangeHistoryLang('en')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${historyLang === 'en' ? 'bg-brand-forest text-white' : 'bg-brand-light dark:bg-emerald-950/60 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  English
                </button>
                <button
                  onClick={() => onChangeHistoryLang('ta')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold font-tamil ${historyLang === 'ta' ? 'bg-brand-forest text-white' : 'bg-brand-light dark:bg-emerald-950/60 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>
          )}

          {/* Theme Mode Switcher for Mobile */}
          <div className="pt-2 border-t border-brand-pale dark:border-emerald-900/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Appearance
            </span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
