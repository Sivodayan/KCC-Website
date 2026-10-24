import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import HistoryTimeline from '../components/HistoryTimeline.jsx';
import LeadershipDirectory from '../components/LeadershipDirectory.jsx';

/**
 * HistoryPage Component
 *
 * Dedicated archival history portal for J/Kopay Christian College.
 * Dynamically switches between English and Tamil historical treatises,
 * re-mounting child timeline and leadership directory components via keyed instances.
 * Automatically scrolls to top on language toggle or route entry.
 */
export default function HistoryPage({ lang = 'en' }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lang]);

  return (
    <main className="flex-grow py-4 sm:py-6 bg-brand-white dark:bg-[#0b120c] transition-colors">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-light dark:bg-emerald-950/70 border border-brand-pale dark:border-emerald-800/40 text-brand-forest dark:text-emerald-300 hover:bg-brand-pale/70 dark:hover:bg-emerald-900/60 font-semibold transition-all shadow-2xs hover:-translate-x-0.5"
          >
            <span>← Home</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            {lang === 'ta' ? 'கல்லூரி வரலாறு' : 'History & Heritage'}
          </span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <HistoryTimeline key={`timeline-${lang}`} lang={lang} />
        <LeadershipDirectory key={`lead-${lang}`} lang={lang} />
      </div>
    </main>
  );
}
