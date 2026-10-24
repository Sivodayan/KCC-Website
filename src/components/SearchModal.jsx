import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const searchItems = [
  {
    title: "School Events & Facebook Community Updates",
    category: "Events",
    url: "events",
    action: "navigate"
  },
  {
    title: "Annual Prize Giving & Student Achievements",
    category: "Events",
    url: "events",
    action: "navigate"
  },
  {
    title: "Inter-House Sports Meet & Athletics",
    category: "Events",
    url: "events",
    action: "navigate"
  },
  {
    title: "Cultural Festivals & College Celebrations",
    category: "Events",
    url: "events",
    action: "navigate"
  },
  {
    title: "Official Facebook Community Page",
    category: "Social",
    url: "https://www.facebook.com/profile.php?id=61575442051109",
    action: "external"
  },
  {
    title: "School Life Journal & 3D Digital Gallery",
    category: "Gallery",
    url: "gallery",
    action: "navigate"
  },
  {
    title: "College History Timeline (1849 - Present)",
    category: "History",
    url: "history",
    action: "navigate"
  },
  {
    title: "Tamil History Chronicle",
    category: "History",
    url: "history?lang=ta",
    action: "navigate"
  },
  {
    title: "Founded Year 1852 (170+ Years of Service)",
    category: "Heritage",
    url: "history",
    action: "navigate"
  },
  {
    title: "Motto: Truth and Justice (மகுடவாசகம்: உண்மைக்கும் நேர்மைக்கும்)",
    category: "Heritage",
    url: "motto",
    action: "navigate"
  },
  {
    title: "Vision: The Ideal School in Peninsula (தூரநோக்கு: குடாநாட்டின் முன்மாதிரிப் பாடசாலை)",
    category: "Heritage",
    url: "motto",
    action: "navigate"
  },
  {
    title: "Mission Statement (நோக்கக்கூற்று: சுயமரியாதை, விழுமியங்கள்...)",
    category: "Heritage",
    url: "motto",
    action: "navigate"
  },
  {
    title: "School Anthem",
    category: "Tradition",
    url: "anthem",
    action: "navigate"
  },
  {
    title: "Key Performance & Enrolment Metrics",
    category: "Academics",
    url: "performance",
    action: "navigate"
  },
  {
    title: "G.C.E. O/L Examination Results (94.2%)",
    category: "Academics",
    url: "performance",
    action: "navigate"
  },
  {
    title: "G.C.E. A/L University Qualifying Rate (78%)",
    category: "Academics",
    url: "performance",
    action: "navigate"
  },
  {
    title: "Clubs & Societies (18 Co-Curriculars)",
    category: "Activities",
    url: "performance",
    action: "navigate"
  },
  {
    title: "Grades 6 to 13 (Secondary & Collegiate)",
    category: "Academics",
    url: "performance",
    action: "navigate"
  },
  {
    title: "College Administrative Office",
    category: "Contact",
    url: "contact",
    action: "navigate"
  },
  {
    title: "Location & Google Maps Directions",
    category: "Contact",
    url: "https://maps.app.goo.gl/UMsXzzu46QNMNwcB8",
    action: "external"
  },
  {
    title: "Instagram Official Tag (@kopaychristiancollege)",
    category: "Social",
    url: "https://www.instagram.com/explore/tags/kopaychristiancollege/",
    action: "external"
  }
];

export default function SearchModal({ isOpen, onClose, onNavigate, onOpenAnthem }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);
  const routerNavigate = useNavigate();

  const hasQuery = Boolean(debouncedQuery.trim());

  // Debounce search by a small, snappy delay (~240ms) and show loading indicator
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setDebouncedQuery('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
      setIsSearching(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredItems = !hasQuery
    ? []
    : searchItems
        .filter(item => {
          const q = debouncedQuery.toLowerCase().trim();
          return (
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          const q = debouncedQuery.toLowerCase().trim();
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const aStarts = aTitle.startsWith(q);
          const bStarts = bTitle.startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        });

  // Lock body scroll when search bar / modal is active
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setIsSearching(false);
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (isSearching) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, isSearching, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  function handleSelect(item) {
    onClose();
    if (item.action === 'external' && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else if (item.action === 'anthem') {
      onOpenAnthem();
    } else if (item.url?.includes('?')) {
      routerNavigate(`/${item.url}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate(item.url);
    }
  }

  function handleQuickFilter(catName) {
    if (query.toLowerCase() === catName.toLowerCase()) {
      setQuery('');
    } else {
      setQuery(catName);
    }
    if (inputRef.current) inputRef.current.focus();
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-brand-white dark:bg-[#0f1911] max-w-2xl w-full rounded-2xl border border-brand-pale dark:border-emerald-500/30 overflow-hidden flex flex-col shadow-2xl animate-modal-content max-h-[80vh]">
        <div className="p-3.5 sm:p-4 border-b border-brand-pale dark:border-emerald-950/70 bg-brand-white dark:bg-[#0f1911]">
          {/* Rounded Border Search Box Container */}
          <div className="search-box-wrapper flex items-center gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-brand-light/70 dark:bg-[#0b140d] border border-brand-pale dark:border-emerald-500/50 focus-within:border-brand-forest dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-brand-forest/20 dark:focus-within:ring-emerald-400/25 transition-all shadow-xs dark:shadow-[0_0_15px_rgba(74,222,128,0.18)]">
            <svg className="w-5 h-5 text-brand-forest dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck="false"
              placeholder="Search events, facebook updates, history, anthem, contact, results..."
              className="search-box-input w-full text-slate-800 dark:text-slate-100 text-sm sm:text-base bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none !border-none !shadow-none !bg-transparent rounded-none"
            />
            {isSearching ? (
              <div className="flex items-center gap-1.5 shrink-0 px-1 text-brand-forest dark:text-emerald-400" aria-label="Searching">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : query ? (
              <button
                onClick={() => {
                  setQuery('');
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-brand-pale/50 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer shrink-0"
                aria-label="Clear input"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-emerald-400/70 bg-slate-100 dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-500/30 rounded-md shrink-0 select-none">
              ESC
            </kbd>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-brand-light/70 dark:bg-[#0b140d]/90 border-b border-brand-pale/70 dark:border-emerald-950/70 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-emerald-400/60 uppercase tracking-wider shrink-0">Quick:</span>
          <button
            type="button"
            onClick={() => handleQuickFilter('Events')}
            className={`px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer text-xs ${query.toLowerCase() === 'events'
                ? 'bg-brand-forest dark:bg-emerald-600 text-white border-brand-forest dark:border-emerald-500 font-semibold shadow-xs'
                : 'bg-brand-white dark:bg-[#111c13] border-brand-pale dark:border-emerald-500/30 hover:border-brand-soft dark:hover:border-emerald-400 text-brand-forest dark:text-emerald-300 hover:bg-brand-pale/40 dark:hover:bg-emerald-950/50'
              }`}
          >
            Events & FB
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter('History')}
            className={`px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer text-xs ${query.toLowerCase() === 'history'
                ? 'bg-brand-forest dark:bg-emerald-600 text-white border-brand-forest dark:border-emerald-500 font-semibold shadow-xs'
                : 'bg-brand-white dark:bg-[#111c13] border-brand-pale dark:border-emerald-500/30 hover:border-brand-soft dark:hover:border-emerald-400 text-brand-forest dark:text-emerald-300 hover:bg-brand-pale/40 dark:hover:bg-emerald-950/50'
              }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter('Anthem')}
            className={`px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer text-xs ${query.toLowerCase() === 'anthem'
                ? 'bg-brand-forest dark:bg-emerald-600 text-white border-brand-forest dark:border-emerald-500 font-semibold shadow-xs'
                : 'bg-brand-white dark:bg-[#111c13] border-brand-pale dark:border-emerald-500/30 hover:border-brand-soft dark:hover:border-emerald-400 text-brand-forest dark:text-emerald-300 hover:bg-brand-pale/40 dark:hover:bg-emerald-950/50'
              }`}
          >
            School Anthem
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter('Gallery')}
            className={`px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer text-xs ${query.toLowerCase() === 'gallery'
                ? 'bg-brand-forest dark:bg-emerald-600 text-white border-brand-forest dark:border-emerald-500 font-semibold shadow-xs'
                : 'bg-brand-white dark:bg-[#111c13] border-brand-pale dark:border-emerald-500/30 hover:border-brand-soft dark:hover:border-emerald-400 text-brand-forest dark:text-emerald-300 hover:bg-brand-pale/40 dark:hover:bg-emerald-950/50'
              }`}
          >
            3D Gallery
          </button>
          <button
            type="button"
            onClick={() => handleQuickFilter('Contact')}
            className={`px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer text-xs ${query.toLowerCase() === 'contact'
                ? 'bg-brand-forest dark:bg-emerald-600 text-white border-brand-forest dark:border-emerald-500 font-semibold shadow-xs'
                : 'bg-brand-white dark:bg-[#111c13] border-brand-pale dark:border-emerald-500/30 hover:border-brand-soft dark:hover:border-emerald-400 text-brand-forest dark:text-emerald-300 hover:bg-brand-pale/40 dark:hover:bg-emerald-950/50'
              }`}
          >
            Contact Office
          </button>
        </div>

        {/* Sleek Indeterminate Progress Bar */}
        {isSearching && (
          <div className="search-progress-track">
            <div className="search-progress-bar" />
            <div className="search-progress-bar-secondary" />
          </div>
        )}

        <div className="overflow-y-auto divide-y divide-brand-pale/60 dark:divide-emerald-950/60 p-2 text-sm max-h-[50vh]">
          {isSearching ? (
            <div className="p-2 space-y-2 select-none">
              {/* Clean institutional status header - strictly no emojis */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-emerald-400/90 font-medium">
                  <svg className="w-3.5 h-3.5 animate-spin text-brand-forest dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Searching college records...</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-emerald-400/70 bg-slate-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-slate-200/80 dark:border-emerald-500/20 truncate max-w-[160px]">
                  "{query.trim()}"
                </span>
              </div>

              {/* 4 Professional Skeleton Rows */}
              {[
                { titleWidth: 'w-3/5', subWidth: 'w-24', category: 'Events' },
                { titleWidth: 'w-4/5', subWidth: 'w-32', category: 'History' },
                { titleWidth: 'w-1/2', subWidth: 'w-20', category: 'Academics' },
                { titleWidth: 'w-2/3', subWidth: 'w-28', category: 'Gallery' },
              ].map((row, i) => (
                <div
                  key={i}
                  className="px-3.5 py-3 rounded-xl glass-surface glass-shimmer border border-brand-pale/50 dark:border-emerald-500/20 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className={`h-4 rounded-md bg-slate-200/80 dark:bg-emerald-950/70 ${row.titleWidth}`} />
                    <div className={`h-2.5 rounded-full bg-slate-200/50 dark:bg-emerald-950/50 ${row.subWidth}`} />
                  </div>
                  <div className="h-5 px-2.5 rounded-md bg-slate-200/50 dark:bg-emerald-950/50 border border-slate-200/60 dark:border-emerald-500/20 shrink-0 flex items-center">
                    <span className="text-[10px] text-slate-400/80 dark:text-emerald-400/50 font-medium">
                      {row.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : !hasQuery ? (
            <div className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-light/80 dark:bg-emerald-950/50 border border-brand-pale dark:border-emerald-500/30 flex items-center justify-center text-brand-forest dark:text-emerald-400 mb-3 shadow-2xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Start typing to search...</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Type keywords (events, history, gallery, anthem, contact) or tap a quick topic above.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <svg className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-semibold text-slate-700 dark:text-slate-200">No matching results found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try searching with a different keyword</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={index}
                  ref={(el) => (itemRefs.current[index] = el)}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`search-item px-3.5 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${isSelected
                      ? 'bg-brand-light dark:bg-emerald-950/50 border border-brand-pale dark:border-emerald-500/40 text-brand-forest dark:text-emerald-300 shadow-2xs translate-x-0.5'
                      : 'hover:bg-brand-light/60 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-200'
                    }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm block truncate">{item.title}</span>
                  </div>
                  <div className="shrink-0 flex items-center text-xs font-semibold text-brand-forest dark:text-emerald-400 gap-1 opacity-90">
                    <span>{item.action === 'external' ? 'Open' : 'Go'}</span>
                    {item.action === 'external' ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-brand-light/50 dark:bg-[#0b140d] border-t border-brand-pale dark:border-emerald-950/70 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-4">
          <div className="flex items-center gap-3">
            {hasQuery && !isSearching && filteredItems.length > 0 && (
              <>
                <span>
                  <kbd className="bg-brand-white dark:bg-[#152317] border border-brand-pale dark:border-emerald-500/30 text-slate-600 dark:text-emerald-300 px-1 rounded shadow-2xs">↑</kbd>{' '}
                  <kbd className="bg-brand-white dark:bg-[#152317] border border-brand-pale dark:border-emerald-500/30 text-slate-600 dark:text-emerald-300 px-1 rounded shadow-2xs">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="bg-brand-white dark:bg-[#152317] border border-brand-pale dark:border-emerald-500/30 text-slate-600 dark:text-emerald-300 px-1 rounded shadow-2xs">↵</kbd> select
                </span>
              </>
            )}
            <span>
              <kbd className="bg-brand-white dark:bg-[#152317] border border-brand-pale dark:border-emerald-500/30 text-slate-600 dark:text-emerald-300 px-1 rounded shadow-2xs">esc</kbd> close
            </span>
          </div>
          <span className="font-medium text-brand-forest dark:text-emerald-400">
            {isSearching ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-brand-forest dark:text-emerald-400">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Searching archives...</span>
              </span>
            ) : !hasQuery ? (
              'Search Kopay Christian College'
            ) : (
              `${filteredItems.length} ${filteredItems.length === 1 ? 'result' : 'results'} found`
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
