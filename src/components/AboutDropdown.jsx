import React, { useState, useRef, useEffect } from 'react';

/**
 * AboutDropdown Component
 *
 * Header navigation dropdown managing access to institutional sub-sections
 * (History, Anthem, Motto).
 *
 * Implements resilient hover-intent heuristics with a 180ms hysteresis buffer,
 * click-outside listener teardown, Escape key trapping, and strict ARIA compliance.
 */
export default function AboutDropdown({ currentPage, onNavigate, onOpenAnthem }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const clearCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimeout();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearCloseTimeout();
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleItemClick = (action) => {
    setIsOpen(false);
    if (action === 'history') {
      onNavigate('history');
    } else if (action === 'anthem') {
      onNavigate('anthem');
    } else if (action === 'motto') {
      onNavigate('motto');
    }
  };

  const isAboutSectionActive = ['history', 'anthem', 'motto'].includes(currentPage);
  const isButtonHighlighted = isOpen || isAboutSectionActive;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="About menu"
        className={`nav-link px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer inline-flex items-center gap-1.5 ${isButtonHighlighted
            ? 'text-brand-forest dark:text-emerald-300 bg-brand-pale/70 dark:bg-emerald-950/80 font-bold is-active shadow-xs dark:shadow-[0_0_12px_rgba(74,222,128,0.25)]'
            : 'text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 hover:bg-brand-pale/60 dark:hover:bg-emerald-950/60 font-medium'
          }`}
      >
        <span>About</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : 'rotate-0'
            } ${isButtonHighlighted ? 'text-brand-forest dark:text-emerald-300' : 'text-brand-forest dark:text-emerald-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="about-dropdown-menu absolute top-full left-0 mt-2 w-44 rounded-2xl bg-brand-white/95 dark:bg-[#132216]/95 backdrop-blur-md border border-brand-pale dark:border-emerald-500/30 shadow-xl dark:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(74,222,128,0.15),_inset_0_1px_1px_0_rgba(134,239,172,0.25)] py-1.5 px-1.5 z-50 origin-top-left transition-all duration-200 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleItemClick('history')}
            className={`about-dropdown-item w-full flex items-center justify-between px-3.5 py-2 text-sm font-medium rounded-xl cursor-pointer active:scale-[0.98] ${currentPage === 'history' ? 'is-active-item' : ''
              }`}
          >
            <span>History</span>
            {currentPage === 'history' && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-forest dark:bg-emerald-400 shrink-0" />
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleItemClick('anthem')}
            className={`about-dropdown-item w-full flex items-center justify-between px-3.5 py-2 text-sm font-medium rounded-xl cursor-pointer active:scale-[0.98] ${currentPage === 'anthem' ? 'is-active-item' : ''
              }`}
          >
            <span>Anthem</span>
            {currentPage === 'anthem' && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-forest dark:bg-emerald-400 shrink-0" />
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleItemClick('motto')}
            className={`about-dropdown-item w-full flex items-center justify-between px-3.5 py-2 text-sm font-medium rounded-xl cursor-pointer active:scale-[0.98] ${currentPage === 'motto' ? 'is-active-item' : ''
              }`}
          >
            <span>Motto</span>
            {currentPage === 'motto' && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-forest dark:bg-emerald-400 shrink-0" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
