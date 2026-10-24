import React from 'react';
import GlassImage from './GlassImage.jsx';
import { useSiteContent } from '../context/SiteContentContext.jsx';

/**
 * HistoryTimeline Component
 *
 * Archival chronology presentation for J/Kopay Christian College.
 * Dynamically rendered from centralized content context (siteContent.json / admin edits).
 * Supports bilingual rendering (Tamil treatise vs English treatise)
 * with alternating milestone spine, blockquotes, and archival photographs.
 */
export default function HistoryTimeline({ lang = 'en' }) {
  const { content } = useSiteContent();
  const history = content?.history || {};
  const overview = history.overview || {};
  const milestones = history.milestones || [];

  if (lang === 'ta') {
    return (
      <article className="space-y-10 font-tamil">
        <header className="text-center max-w-3xl mx-auto space-y-2 pb-6 mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-forest tracking-tight leading-snug">
            {overview.titleTa || "CMS ஆங்கிலப் பாடசாலையும் இன்றைய கிறிஸ்தவ கல்லூரியும்"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            ஆசிரியர்கள்:{' '}
            <span className="text-slate-800 font-bold">
              {overview.authorsTa || "வண. J. S. இரட்ணாதிக்கம் & வண. A. M. நத்தானியல்"}
            </span>
          </p>
          {overview.leadTa && (
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto pt-1 leading-relaxed">
              {overview.leadTa}
            </p>
          )}
        </header>

        <div className="relative border-l-2 border-brand-pale ml-3 sm:ml-28 space-y-8">
          {milestones.map((m, idx) => {
            const isAlternate = idx % 2 === 1;
            const yearDisplay = m.yearTa || m.year;
            const titleDisplay = m.titleTa || m.titleEn;
            const descDisplay = m.descTa || m.descEn;
            const quoteDisplay = m.quoteTa || m.quoteEn;
            const paragraphs = (descDisplay || '').split('\n').filter(p => p.trim());

            return (
              <div key={m.id || idx} className="relative pl-6 sm:pl-10 group">
                <span className="absolute -left-[7px] top-5 w-3.5 h-3.5 rounded-full bg-brand-forest ring-4 ring-brand-light" />
                <span className="hidden sm:block absolute -left-28 top-3.5 w-20 text-right font-bold text-brand-forest text-xs">
                  {yearDisplay}
                </span>

                <div className="bg-white border border-brand-pale rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs hover:shadow-md transition-shadow">
                  <span className="sm:hidden inline-block px-2.5 py-0.5 rounded-full bg-brand-light border border-brand-pale text-brand-forest text-[11px] font-bold mb-2.5">
                    {yearDisplay}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-brand-forest">
                    {titleDisplay}
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {isAlternate && m.image && (
                      <div className="lg:col-span-5 order-2 lg:order-1 bg-brand-light/30 border border-brand-pale rounded-xl p-2.5 shadow-2xs">
                        <GlassImage
                          src={m.image}
                          alt={m.imageAlt || titleDisplay}
                          containerClassName="w-full min-h-[220px] flex items-center justify-center"
                          className="w-full max-h-[460px] object-contain mx-auto"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className={`${m.image ? 'lg:col-span-7' : 'lg:col-span-12'} ${isAlternate ? 'order-1 lg:order-2' : ''} space-y-4 text-slate-800 text-sm sm:text-base leading-loose`}>
                      {paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                      {quoteDisplay && (
                        <blockquote className="border-l-4 border-brand-forest dark:border-emerald-400 bg-brand-light/70 dark:bg-[#132817] rounded-r-2xl p-4 italic text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed shadow-xs dark:shadow-none">
                          {quoteDisplay}
                        </blockquote>
                      )}
                    </div>
                    {!isAlternate && m.image && (
                      <div className="lg:col-span-5 bg-brand-light/30 border border-brand-pale rounded-xl p-2.5 shadow-2xs">
                        <GlassImage
                          src={m.image}
                          alt={m.imageAlt || titleDisplay}
                          containerClassName="w-full min-h-[220px] flex items-center justify-center"
                          className="w-full max-h-[460px] object-contain mx-auto"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    );
  }

  return (
    <article className="space-y-10">
      <header className="text-center max-w-3xl mx-auto space-y-2 pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-forest tracking-tight leading-tight">
          {overview.titleEn || "CMS English School & Today’s Christian College"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Compiled by:{' '}
          <span className="text-slate-800 font-bold">
            {overview.authorsEn || "Rev. J. S. Ratnathikkam & Rev. A. M. Nathaniel"}
          </span>
        </p>
        {overview.leadEn && (
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto pt-1 leading-relaxed">
            {overview.leadEn}
          </p>
        )}
      </header>

      <div className="relative border-l-2 border-brand-pale ml-3 sm:ml-28 space-y-8">
        {milestones.map((m, idx) => {
          const isAlternate = idx % 2 === 1;
          const yearDisplay = m.year || m.yearTa;
          const titleDisplay = m.titleEn || m.titleTa;
          const descDisplay = m.descEn || m.descTa;
          const quoteDisplay = m.quoteEn || m.quoteTa;
          const paragraphs = (descDisplay || '').split('\n').filter(p => p.trim());

          return (
            <div key={m.id || idx} className="relative pl-6 sm:pl-10 group">
              <span className="absolute -left-[7px] top-5 w-3.5 h-3.5 rounded-full bg-brand-forest ring-4 ring-brand-light" />
              <span className="hidden sm:block absolute -left-28 top-3.5 w-20 text-right font-bold text-brand-forest text-xs">
                {yearDisplay}
              </span>

              <div className="bg-white border border-brand-pale rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs hover:shadow-md transition-shadow">
                <span className="sm:hidden inline-block px-2.5 py-0.5 rounded-full bg-brand-light border border-brand-pale text-brand-forest text-[11px] font-bold mb-2.5">
                  {yearDisplay}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-brand-forest">
                  {titleDisplay}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {isAlternate && m.image && (
                    <div className="lg:col-span-5 order-2 lg:order-1 bg-brand-light/30 border border-brand-pale rounded-xl p-2.5 shadow-2xs">
                      <GlassImage
                        src={m.image}
                        alt={m.imageAlt || titleDisplay}
                        containerClassName="w-full min-h-[220px] flex items-center justify-center"
                        className="w-full max-h-[460px] object-contain mx-auto"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className={`${m.image ? 'lg:col-span-7' : 'lg:col-span-12'} ${isAlternate ? 'order-1 lg:order-2' : ''} space-y-4 text-slate-800 text-sm sm:text-base leading-loose`}>
                    {paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                    {quoteDisplay && (
                      <blockquote className="border-l-4 border-brand-forest dark:border-emerald-400 bg-brand-light/70 dark:bg-[#132817] rounded-r-2xl p-4 italic text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed shadow-xs dark:shadow-none">
                        {quoteDisplay}
                      </blockquote>
                    )}
                  </div>
                  {!isAlternate && m.image && (
                    <div className="lg:col-span-5 bg-brand-light/30 border border-brand-pale rounded-xl p-2.5 shadow-2xs">
                      <GlassImage
                        src={m.image}
                        alt={m.imageAlt || titleDisplay}
                        containerClassName="w-full min-h-[220px] flex items-center justify-center"
                        className="w-full max-h-[460px] object-contain mx-auto"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
