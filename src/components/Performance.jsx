import React, { useState, useEffect, useRef } from 'react';
import { useSiteContent } from '../context/SiteContentContext.jsx';

/**
 * Exponential easing out curve for fluid numeral interpolation.
 */
function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export default function Performance() {
  const { content } = useSiteContent();
  const perf = content?.performance || {};

  // Parse grade numbers if provided as string (e.g., '6 – 13') or numeric defaults
  let gradeMinTarget = 6;
  let gradeMaxTarget = 13;
  if (perf.grades) {
    const match = String(perf.grades).match(/(\d+)\s*(?:–|-|to)\s*(\d+)/i);
    if (match) {
      gradeMinTarget = parseInt(match[1], 10);
      gradeMaxTarget = parseInt(match[2], 10);
    }
  } else if (perf.gradeMin != null && perf.gradeMax != null) {
    gradeMinTarget = Number(perf.gradeMin);
    gradeMaxTarget = Number(perf.gradeMax);
  }

  const targets = {
    founded: perf.founded ?? 1852,
    students: perf.students ?? 386,
    staff: perf.staff ?? 46,
    olPass: perf.olPass ?? 94.2,
    alQual: perf.alQual ?? 78,
    clubs: perf.clubs ?? 18,
    houses: perf.houses ?? 4,
    gradeMin: gradeMinTarget,
    gradeMax: gradeMaxTarget
  };

  const [statsAnimated, setStatsAnimated] = useState(false);
  const [counterValues, setCounterValues] = useState({
    founded: 0,
    students: 0,
    staff: 0,
    olPass: 0,
    alQual: 0,
    clubs: 0,
    houses: 0,
    gradeMin: 0,
    gradeMax: 0
  });

  const performanceRef = useRef(null);

  // Trigger smooth counter animation when section enters viewport
  useEffect(() => {
    if (!performanceRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
          setStatsAnimated(true);

          const duration = 2000;
          let startTime = null;

          function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const ease = easeOutExpo(progress);

            setCounterValues({
              founded: Math.floor(ease * targets.founded),
              students: Math.floor(ease * targets.students),
              staff: Math.floor(ease * targets.staff),
              olPass: (ease * targets.olPass).toFixed(1),
              alQual: Math.floor(ease * targets.alQual),
              clubs: Math.floor(ease * targets.clubs),
              houses: Math.floor(ease * targets.houses),
              gradeMin: Math.floor(ease * targets.gradeMin),
              gradeMax: Math.floor(ease * targets.gradeMax)
            });

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCounterValues({
                founded: targets.founded,
                students: targets.students,
                staff: targets.staff,
                olPass: Number(targets.olPass).toFixed(1),
                alQual: targets.alQual,
                clubs: targets.clubs,
                houses: targets.houses,
                gradeMin: targets.gradeMin,
                gradeMax: targets.gradeMax
              });
            }
          }

          requestAnimationFrame(animate);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(performanceRef.current);
    return () => observer.disconnect();
  }, [statsAnimated, targets.founded, targets.students, targets.staff, targets.olPass, targets.alQual, targets.clubs, targets.houses, targets.gradeMin, targets.gradeMax]);

  return (
    <section ref={performanceRef} className="py-16 bg-brand-white dark:bg-[#0b120c] border-b border-brand-pale dark:border-emerald-950/60 transition-colors" id="performance">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 reveal-item">
          <h2 className="text-3xl font-extrabold text-brand-forest dark:text-emerald-400 mt-1 tracking-tight">
            {perf.title || 'Key Numbers & Performance'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            {perf.subtitle || 'Measurable records reflecting academic commitment, teacher mentorship, and co-curricular vibrancy.'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-brand-light dark:bg-[#111d13] border border-brand-pale dark:border-emerald-500/20 text-center reveal-item stagger-1 transition-all duration-200 hover:border-brand-soft dark:hover:border-emerald-400/50 hover:-translate-y-1">
            <p className="text-3xl lg:text-4xl font-extrabold text-brand-forest dark:text-emerald-300 font-sans">
              {counterValues.founded}{perf.foundedSuffix ?? ''}
            </p>
            <p className="text-xs uppercase font-bold text-brand-sage dark:text-emerald-400 mt-2">
              {perf.foundedLabel || 'Founded Year'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {perf.foundedSub || 'Peninsula Heritage'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-light dark:bg-[#111d13] border border-brand-pale dark:border-emerald-500/20 text-center reveal-item stagger-2 transition-all duration-200 hover:border-brand-soft dark:hover:border-emerald-400/50 hover:-translate-y-1">
            <p className="text-3xl lg:text-4xl font-extrabold text-brand-forest dark:text-emerald-300 font-sans">
              {counterValues.students}{perf.studentsSuffix ?? '+'}
            </p>
            <p className="text-xs uppercase font-bold text-brand-sage dark:text-emerald-400 mt-2">
              {perf.studentsLabel || 'Enrolled Students'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {perf.studentsSub || 'Secondary to Collegiate'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-light dark:bg-[#111d13] border border-brand-pale dark:border-emerald-500/20 text-center reveal-item stagger-3 transition-all duration-200 hover:border-brand-soft dark:hover:border-emerald-400/50 hover:-translate-y-1">
            <p className="text-3xl lg:text-4xl font-extrabold text-brand-forest dark:text-emerald-300 font-sans">
              {counterValues.staff}{perf.staffSuffix ?? ''}
            </p>
            <p className="text-xs uppercase font-bold text-brand-sage dark:text-emerald-400 mt-2">
              {perf.staffLabel || 'Teaching Staff'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {perf.staffSub || 'Dedicated Faculty'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-light dark:bg-[#111d13] border border-brand-pale dark:border-emerald-500/20 text-center reveal-item stagger-4 transition-all duration-200 hover:border-brand-soft dark:hover:border-emerald-400/50 hover:-translate-y-1">
            <p className="text-3xl lg:text-4xl font-extrabold text-brand-forest dark:text-emerald-300 font-sans">
              {counterValues.olPass}{perf.olPassSuffix ?? '%'}
            </p>
            <p className="text-xs uppercase font-bold text-brand-sage dark:text-emerald-400 mt-2">
              {perf.olPassLabel || 'G.C.E. O/L Pass Rate'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {perf.olPassSub || 'National Examination'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-light dark:bg-[#111d13] border border-brand-pale dark:border-emerald-500/20 text-center reveal-item stagger-4 transition-all duration-200 hover:border-brand-soft dark:hover:border-emerald-400/50 hover:-translate-y-1">
            <p className="text-3xl lg:text-4xl font-extrabold text-brand-forest dark:text-emerald-300 font-sans">
              {statsAnimated ? `${counterValues.gradeMin} – ${counterValues.gradeMax}` : (perf.grades || `${targets.gradeMin} – ${targets.gradeMax}`)}{perf.gradesSuffix ?? ''}
            </p>
            <p className="text-xs uppercase font-bold text-brand-sage dark:text-emerald-400 mt-2">
              {perf.gradesLabel || 'School Grades'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {perf.gradesSub || 'Grades from 6 to 13'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-light dark:bg-[#111d13] border border-brand-pale dark:border-emerald-500/20 text-center reveal-item stagger-1 transition-all duration-200 hover:border-brand-soft dark:hover:border-emerald-400/50 hover:-translate-y-1">
            <p className="text-3xl lg:text-4xl font-extrabold text-brand-forest dark:text-emerald-300 font-sans">
              {counterValues.alQual}{perf.alQualSuffix ?? '%'}
            </p>
            <p className="text-xs uppercase font-bold text-brand-sage dark:text-emerald-400 mt-2">
              {perf.alQualLabel || 'University Qualifying'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {perf.alQualSub || 'G.C.E. A/L Streams'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-light dark:bg-[#111d13] border border-brand-pale dark:border-emerald-500/20 text-center reveal-item stagger-2 transition-all duration-200 hover:border-brand-soft dark:hover:border-emerald-400/50 hover:-translate-y-1">
            <p className="text-3xl lg:text-4xl font-extrabold text-brand-forest dark:text-emerald-300 font-sans">
              {counterValues.clubs}{perf.clubsSuffix ?? ''}
            </p>
            <p className="text-xs uppercase font-bold text-brand-sage dark:text-emerald-400 mt-2">
              {perf.clubsLabel || 'Clubs & Societies'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {perf.clubsSub || 'Co-Curricular Groups'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-light dark:bg-[#111d13] border border-brand-pale dark:border-emerald-500/20 text-center reveal-item stagger-3 transition-all duration-200 hover:border-brand-soft dark:hover:border-emerald-400/50 hover:-translate-y-1">
            <p className="text-3xl lg:text-4xl font-extrabold text-brand-forest dark:text-emerald-300 font-sans">
              {counterValues.houses}{perf.housesSuffix ?? ''}
            </p>
            <p className="text-xs uppercase font-bold text-brand-sage dark:text-emerald-400 mt-2">
              {perf.housesLabel || 'Competitive Houses'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {perf.housesSub || 'Annual Sports Division'}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
