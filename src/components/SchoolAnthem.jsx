import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * SchoolAnthem Component
 *
 * Primary archival presentation of the J/Kopay Christian College Anthem (பாடசாலைக் கீதம்).
 * Rendered in Tamil typography with Hamsadhvani melodic arrangement context.
 *
 * Provides native print dialog invocation (`window.print()`), copy-to-clipboard
 * with transient UI confirmation, and navigational links to the heritage timeline.
 */
export default function SchoolAnthem() {
  const [copied, setCopied] = useState(false);

  const anthemTamil = `வாழிய நம் கலைக்கூடமே வாழ்க
வாழிய வாழிய வாழியவே
கழனிகள் சூழ்ந்திடு கோவையம் பதியில்
விளங்குநற் சிறந்தவக் கல்லூரி
உண்மையும் நேர்மையும்
உலகிடை அளிக்கும்
உயர்புகழ் என்றென்றும் வாழியவே

பல்புகழ் மலிந்திடும் பல பெரியோர் களைப்
படைத்து நற்பணிபுரிந்தாய்
அவர் மிகு சேவையை ஏந்திட நன்னிலை
அடைந்தநல் நாடெய்தே

மனதினில் உள் திறம் மதிப் பொறிவைத்திட
மகிழ்வொடு நாம் முயல்வோம்
கலைபல கற்றுநற் கனிந்திட நல்லறி
காட்டிடுவாய் தாயே

நிலமிசை நின்புகழ் நீடுவாழ்க
நின்பணி தொடர்ந்து என்றும் வாழ்க
நிலை பெறு கலைகளின் நிறைவுடனாக
நீயென்றும் வாழிய வாழியவே.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(anthemTamil).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <article className="max-w-4xl mx-auto py-8 sm:py-14 px-4 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-forest dark:text-emerald-400 tracking-tight font-tamil leading-tight">
          பாடசாலைக் கீதம்
        </h1>
        <h3 className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mt-3 font-sans max-w-xl mx-auto font-medium">
          School Anthem 
        </h3>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-white dark:bg-emerald-950/60 border border-brand-pale dark:border-emerald-800/50 hover:border-brand-soft text-slate-700 dark:text-slate-200 hover:text-brand-forest dark:hover:text-emerald-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-brand-forest dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print</span>
          </button>

          

          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-forest text-brand-white hover:bg-brand-forestHover text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>Explore College History →</span>
          </Link>
        </div>
      </div>

      <div className="bg-brand-white dark:bg-[#111e13] rounded-3xl border border-brand-pale dark:border-emerald-900/40 p-6 sm:p-12 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.04] pointer-events-none select-none">
          <img src="/assets/logo.png" alt="" className="w-96 h-96 object-contain" />
        </div>

        <div className="relative z-10 font-tamil">
          <div className="flex justify-start mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-light/90 dark:bg-emerald-950/80 border border-brand-pale/80 dark:border-emerald-700/40 text-brand-forest dark:text-emerald-300 text-xs font-semibold shadow-2xs">
              <svg className="w-3.5 h-3.5 text-brand-forest dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span>இராகம்: ஹம்சத்வனி</span>
            </div>
          </div>

          <div className="text-center text-base sm:text-xl text-slate-800 dark:text-slate-200 leading-[2.3] sm:leading-[2.5] font-medium space-y-7 sm:space-y-8 max-w-2xl mx-auto">
            <div className="space-y-1">
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  வாழிய நம் கலைக்கூடமே வாழ்க
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  வாழிய வாழிய வாழியவே
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  கழனிகள் சூழ்ந்திடு கோவையம் பதியில்
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  விளங்குநற் சிறந்தவக் கல்லூரி
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  உண்மையும் நேர்மையும்
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  உலகிடை அளிக்கும்
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  உயர்புகழ் என்றென்றும் வாழியவே
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  பல்புகழ் மலிந்திடும் பல பெரியோர் களைப்
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  படைத்து நற்பணிபுரிந்தாய்
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  அவர் மிகு சேவையை ஏந்திட நன்னிலை
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  அடைந்தநல் நாடெய்தே
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  மனதினில் உள் திறம் மதிப் பொறிவைத்திட
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  மகிழ்வொடு நாம் முயல்வோம்
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  கலைபல கற்றுநற் கனிந்திட நல்லறி
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  காட்டிடுவாய் தாயே
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  நிலமிசை நின்புகழ் நீடுவாழ்க
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  நின்பணி தொடர்ந்து என்றும் வாழ்க
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  நிலை பெறு கலைகளின் நிறைவுடனாக
                </span>
              </p>
              <p className="py-0.5">
                <span className="inline-block transition-all duration-200 ease-out hover:scale-105 hover:text-brand-forest dark:hover:text-emerald-400 cursor-default select-text origin-center">
                  நீயென்றும் வாழிய வாழியவே.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand-forest text-brand-white hover:bg-brand-forestHover font-bold text-xs shadow-xs transition-colors"
        >
          ← Return to Home
        </Link>
      </div>
    </article>
  );
}
