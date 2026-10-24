import React, { useEffect } from 'react';

/**
 * AnthemModal Component
 *
 * Ephemeral dialog providing instant access to the college anthem lyrics
 * without unmounting the current active page context.
 *
 * Features Escape key listening, backdrop backdrop-blur overlay dismiss,
 * and semantic Tamil typographic styling.
 */
export default function AnthemModal({ isOpen, onClose }) {
  // Lock body scroll when anthem modal is active
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

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
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-brand-white dark:bg-[#111e13] max-w-lg w-full rounded-2xl border border-brand-pale dark:border-emerald-800/40 overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-modal-content">
        <div className="bg-brand-forest dark:bg-[#0e2a14] p-5 text-brand-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-tamil">பாடசாலைக் கீதம்</h3>
            <p className="text-xs text-brand-pale dark:text-emerald-300 font-tamil mt-0.5">இராகம் : ஹம்சத்வனி</p>
          </div>
          <button
            onClick={onClose}
            className="text-brand-white/80 hover:text-white p-1 rounded transition-colors cursor-pointer"
            aria-label="Close Anthem Modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto font-tamil text-center text-sm sm:text-base bg-brand-light/60 dark:bg-[#0b120c]">
          <div className="p-5 sm:p-6 bg-brand-white dark:bg-[#111e13] rounded-2xl border border-brand-pale dark:border-emerald-800/40 shadow-xs text-slate-800 dark:text-slate-200 leading-[2.2] space-y-6">
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

        <div className="p-3 border-t border-brand-pale dark:border-emerald-800/40 bg-brand-white dark:bg-[#111e13] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-brand-forest hover:bg-brand-forestHover text-brand-white rounded-full text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
