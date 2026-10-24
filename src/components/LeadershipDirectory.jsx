import React from 'react';
import { useSiteContent } from '../context/SiteContentContext.jsx';

/**
 * LeadershipDirectory Component
 *
 * Archival record detailing the institutional leadership lineage of J/Kopay Christian College,
 * including historical Headmasters (தலைமையாசிரியர்கள்) and Managers (முகாமையாளர்கள்)
 * from 1880 through the modern era.
 *
 * Dynamically rendered from SiteContentContext (editable via Admin Page).
 * Supports bilingual rendering (`lang === 'ta'` vs English default).
 */
export default function LeadershipDirectory({ lang = 'en' }) {
  const { content } = useSiteContent();
  const headmasters = content?.history?.headmasters || [];
  const managers = content?.history?.managers || [];

  if (lang === 'ta') {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 font-tamil">
        <div className="bg-brand-light dark:bg-[#101b12] rounded-2xl border border-brand-pale dark:border-emerald-900/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-brand-forest dark:bg-emerald-700 text-brand-white flex items-center justify-center font-bold text-xs">
              தலை
            </span>
            <h2 className="text-base font-bold text-brand-forest dark:text-emerald-400">
              தலைமையாசிரியர்கள் (Headmasters)
            </h2>
          </div>
          <div className="divide-y divide-brand-pale/70 dark:divide-emerald-900/40 text-sm">
            {headmasters.map((item, idx) => (
              <div key={item.id || idx} className="py-2.5 flex justify-between gap-4">
                <span className="font-bold text-brand-forest shrink-0">{item.period}</span>
                <span className="font-medium text-slate-800 text-right">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-light dark:bg-[#101b12] rounded-2xl border border-brand-pale dark:border-emerald-900/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-brand-forest dark:bg-emerald-700 text-brand-white flex items-center justify-center font-bold text-xs">
              முகா
            </span>
            <h2 className="text-base font-bold text-brand-forest dark:text-emerald-400">
              முகாமையாளர்கள் (Managers)
            </h2>
          </div>
          <div className="divide-y divide-brand-pale/70 dark:divide-emerald-900/40 text-sm">
            {managers.map((item, idx) => (
              <div key={item.id || idx} className="py-2.5 flex justify-between gap-4">
                <span className="font-bold text-brand-forest shrink-0">{item.period}</span>
                <span className="font-medium text-slate-800 text-right">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
      <div className="bg-brand-light dark:bg-[#101b12] rounded-2xl border border-brand-pale dark:border-emerald-900/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-lg bg-brand-forest dark:bg-emerald-700 text-brand-white flex items-center justify-center font-bold text-xs">
            HM
          </span>
          <h2 className="text-base font-bold text-brand-forest dark:text-emerald-400">
            Headmasters (1880 - 1944)
          </h2>
        </div>
        <div className="divide-y divide-brand-pale/70 dark:divide-emerald-900/40 text-sm">
          {headmasters.map((item, idx) => (
            <div key={item.id || idx} className="py-2.5 flex justify-between gap-4">
              <span className="font-bold text-brand-forest shrink-0">{item.period}</span>
              <span className="font-medium text-slate-800 text-right">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-light dark:bg-[#101b12] rounded-2xl border border-brand-pale dark:border-emerald-900/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-lg bg-brand-forest dark:bg-emerald-700 text-brand-white flex items-center justify-center font-bold text-xs">
            M
          </span>
          <h2 className="text-base font-bold text-brand-forest dark:text-emerald-400">
            Managers (1899 - 1960)
          </h2>
        </div>
        <div className="divide-y divide-brand-pale/70 dark:divide-emerald-900/40 text-sm">
          {managers.map((item, idx) => (
            <div key={item.id || idx} className="py-2.5 flex justify-between gap-4">
              <span className="font-bold text-brand-forest shrink-0">{item.period}</span>
              <span className="font-medium text-slate-800 text-right">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
