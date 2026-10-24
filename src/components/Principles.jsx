import React, { useState } from 'react';
import { useSiteContent } from '../context/SiteContentContext.jsx';

export default function Principles() {
  const { content } = useSiteContent();
  const principles = content?.principles || {};

  const motto = principles.motto || {
    english: "\"Truth and Justice\"",
    tamil: "“உண்மைக்கும் நேர்மைக்கும்”"
  };

  const vision = principles.vision || {
    english: "\"The Ideal School in Peninsula\"",
    tamil: "“குடாநாட்டின் முன்மாதிரிப் பாடசாலை”"
  };

  const mission = principles.mission || {
    english: "To foster self respect, values, character, patriotism and Social Justice to lead the school community towards the global frontiers in education and to work for the optimum use of all the available resources skills and abilities.",
    tamil: "சுயமரியாதை, விழுமியங்கள், நடத்தைக் கோலங்கள், நாட்டுப்பற்று, சமூக நியாயப்பாடு என்பவற்றை உள்ளடக்கிப் பாடசாலை சமூகத்தை கல்வியிலும், கல்விசார் கடமைகளிலும், வளங்கள், தேர்ச்சிகள், மற்றும் திறமைகளைப் பயன்படுத்திப் பாடசாலையில் கல்வித்தரத்தை நாட்டின் முதல் வரிசைக்குக் கொண்டு வருதல்."
  };

  const [flippedCards, setFlippedCards] = useState({});

  const toggleFlip = (cardKey) => {
    setFlippedCards(prev => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  const handleKeyDown = (e, cardKey) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlip(cardKey);
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-brand-light dark:bg-[#081009] border-b border-brand-pale dark:border-emerald-950/60 transition-colors" id="principles">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="reveal-item stagger-1 h-[310px] sm:h-[325px] lg:h-[320px]">
            <div
              role="button"
              tabIndex={0}
              aria-label="Motto card - hover or tap to flip between English and Tamil"
              className={`flip-card w-full h-full cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300 ${flippedCards.motto ? 'is-flipped' : ''}`}
              onClick={() => toggleFlip('motto')}
              onKeyDown={(e) => handleKeyDown(e, 'motto')}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front bg-brand-forest text-brand-white p-6 sm:p-7 lg:p-8 border border-brand-soft/40 flex flex-col">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-brand-pale">
                      Motto
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <h3 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-white leading-tight">
                      {motto.english}
                    </h3>
                  </div>
                </div>

                <div className="flip-card-back bg-brand-white text-slate-800 p-6 sm:p-7 lg:p-8 border border-brand-pale flex flex-col">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-brand-forest font-tamil">
                      மகுடவாசகம்
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <h3 className="text-3xl sm:text-4xl lg:text-[36px] font-extrabold text-brand-forest font-tamil leading-[1.6]">
                      <span className="block">{motto.tamil}</span>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal-item stagger-2 h-[310px] sm:h-[325px] lg:h-[320px]">
            <div
              role="button"
              tabIndex={0}
              aria-label="Vision card - hover or tap to flip between English and Tamil"
              className={`flip-card w-full h-full cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300 ${flippedCards.vision ? 'is-flipped' : ''}`}
              onClick={() => toggleFlip('vision')}
              onKeyDown={(e) => handleKeyDown(e, 'vision')}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front bg-brand-white text-slate-800 p-6 sm:p-7 lg:p-8 border border-brand-pale flex flex-col">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-brand-forest">
                      Vision
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-brand-forest tracking-tight leading-snug">
                      {vision.english}
                    </h3>
                  </div>
                </div>

                <div className="flip-card-back bg-brand-forest text-brand-white p-6 sm:p-7 lg:p-8 border border-brand-soft/40 flex flex-col">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-brand-pale font-tamil">
                      தூரநோக்கு
                    </span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <h3 className="text-2xl sm:text-3xl lg:text-[30px] font-bold font-tamil text-white leading-[1.65]">
                      <span className="block">{vision.tamil}</span>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal-item stagger-3 h-[310px] sm:h-[325px] lg:h-[320px]">
            <div
              role="button"
              tabIndex={0}
              aria-label="Mission Statement card - hover or tap to flip between English and Tamil"
              className={`flip-card w-full h-full cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300 ${flippedCards.mission ? 'is-flipped' : ''}`}
              onClick={() => toggleFlip('mission')}
              onKeyDown={(e) => handleKeyDown(e, 'mission')}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front bg-brand-white text-slate-800 p-6 sm:p-7 lg:p-8 border border-brand-pale flex flex-col">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-brand-forest">
                      Mission Statement
                    </span>
                  </div>
                  <div className="flex-1 flex items-center pt-1 overflow-y-auto custom-scrollbar">
                    <p className="text-sm sm:text-[14px] lg:text-[14.5px] text-slate-700 leading-relaxed font-normal">
                      {mission.english}
                    </p>
                  </div>
                </div>

                <div className="flip-card-back bg-brand-forest text-brand-white p-6 sm:p-7 lg:p-8 border border-brand-soft/40 flex flex-col">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-brand-pale font-tamil">
                      நோக்கக்கூற்று
                    </span>
                  </div>
                  <div className="flex-1 flex items-center pt-1 overflow-y-auto custom-scrollbar">
                    <p className="text-xs sm:text-[13px] lg:text-[13.5px] text-brand-light font-tamil leading-[1.8] font-normal">
                      {mission.tamil}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
