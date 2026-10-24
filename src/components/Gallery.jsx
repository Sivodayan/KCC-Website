import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSiteContent } from '../context/SiteContentContext.jsx';
import GlassImage from './GlassImage.jsx';

const defaultJournalGallery = [
  { src: "/assets/gal_(1).jpeg" },
  { src: "/assets/gal_(2).jpeg" },
  { src: "/assets/gal_(3).jpeg" },
  { src: "/assets/gal_(4).jpeg" },
  { src: "/assets/gal_(5).jpeg" },
  { src: "/assets/gal_(6).jpeg" },
  { src: "/assets/gal_(7).jpeg" },
  { src: "/assets/gal_(8).jpeg" },
  { src: "/assets/gal_(9).jpeg" },
  { src: "/assets/gal_(10).jpeg" },
  { src: "/assets/gal_(11).jpeg" }
];

/**
 * Interactive 3D Cylindrical Gallery Carousel
 * Computes angular offsets and perspective depth matrices dynamically
 * based on distance from the active center index.
 */
export default function Gallery({ showHeader = true }) {
  const { content } = useSiteContent();
  const journalGallery = (content?.gallery && content.gallery.length > 0) ? content.gallery : defaultJournalGallery;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash.toLowerCase() === '#gallery';
    }
    return false;
  });
  const [isEntering, setIsEntering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hoveredSide, setHoveredSide] = useState(null);

  const stageRef = useRef(null);
  const sectionRef = useRef(null);
  const initialSlideTimerRef = useRef(null);
  const total = journalGallery.length;

  const focusIndex = useCallback((targetIndex) => {
    if (!hasEntered) {
      setHasEntered(true);
      setIsEntering(false);
    }
    const safeIndex = ((targetIndex % total) + total) % total;
    setCurrentIndex(safeIndex);
  }, [hasEntered, total]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsInView(true);

          if (!hasEntered) {
            setHasEntered(true);
            setIsEntering(true);

            setTimeout(() => {
              setIsEntering(false);
            }, 700);

            if (initialSlideTimerRef.current) clearTimeout(initialSlideTimerRef.current);
            initialSlideTimerRef.current = setTimeout(() => {
              setCurrentIndex(prev => (prev + 1) % total);
            }, 400);
          }
        } else {
          setIsInView(false);
        }
      });
    }, { threshold: 0.05 });

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
      if (initialSlideTimerRef.current) clearTimeout(initialSlideTimerRef.current);
    };
  }, [hasEntered, total]);

  useEffect(() => {
    if (!hasEntered || !isInView || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % total);
    }, 3200);

    return () => clearInterval(interval);
  }, [hasEntered, isInView, isPaused, total]);

  useEffect(() => {
    function handleVisibility() {
      setIsPaused(document.hidden);
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        focusIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        focusIndex(currentIndex + 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, focusIndex]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e) {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 2) {
        focusIndex(currentIndex + (diffX < 0 ? 1 : -1));
      }
    }

    stage.addEventListener('touchstart', handleTouchStart, { passive: true });
    stage.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      stage.removeEventListener('touchstart', handleTouchStart);
      stage.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, focusIndex]);

  const handleStageMouseMove = (e) => {
    if (!stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const centerX = stageRect.left + stageRect.width / 2;
    const mouseX = e.clientX;

    const cardHalfWidth = 260;
    if (mouseX < centerX - cardHalfWidth + 50) {
      setHoveredSide('prev');
    } else if (mouseX > centerX + cardHalfWidth - 50) {
      setHoveredSide('next');
    } else {
      setHoveredSide(null);
    }
  };

  const handleStageMouseLeave = () => {
    setHoveredSide(null);
  };

  const handleStageClick = (e) => {
    if (!stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const clickX = e.clientX - stageRect.left;
    const width = stageRect.width;

    if (clickX < width * 0.35) {
      focusIndex(currentIndex - 1);
    } else if (clickX > width * 0.65) {
      focusIndex(currentIndex + 1);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 bg-brand-light dark:bg-[#081009] border-b border-brand-pale dark:border-emerald-950/60 overflow-hidden select-none transition-colors"
      id="gallery"
    >
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">


        <div className="relative w-full flex items-center justify-center py-4 sm:py-6 overflow-hidden">
          <div
            ref={stageRef}
            onClick={handleStageClick}
            onMouseMove={handleStageMouseMove}
            onMouseLeave={handleStageMouseLeave}
            className="journal-stage relative w-full max-w-6xl h-[340px] sm:h-[430px] lg:h-[500px] flex items-center justify-center cursor-pointer"
          >
            {journalGallery.map((item, index) => {
              let offset = index - currentIndex;
              if (offset > Math.floor(total / 2)) offset -= total;
              if (offset < -Math.floor(total / 2)) offset += total;
              const absOffset = Math.abs(offset);

              let style = {};
              let extraClasses = '';

              if (!hasEntered) {
                const dir = offset > 0 ? 1 : (offset < 0 ? -1 : 0);
                if (offset === 0) {
                  style = {
                    transform: 'translateX(0) scale(0.85) rotateY(0deg) translateZ(-60px)',
                    opacity: 0,
                    zIndex: 30
                  };
                } else {
                  style = {
                    transform: `translateX(${dir * 18}%) scale(0.65) rotateY(${dir * -12}deg) translateZ(-140px)`,
                    opacity: 0,
                    zIndex: 10
                  };
                }
              } else {
                if (offset === 0) {
                  extraClasses += ' is-active-center';
                  style = {
                    transform: 'translateX(0) scale(1) rotateY(0deg) translateZ(0)',
                    zIndex: 30,
                    opacity: 1,
                    filter: 'none',
                    pointerEvents: 'auto',
                    cursor: 'default'
                  };
                } else if (absOffset === 1) {
                  const dir = offset > 0 ? 1 : -1;
                  const isNavNext = dir > 0;
                  extraClasses += isNavNext ? ' is-nav-next' : ' is-nav-prev';
                  if ((isNavNext && hoveredSide === 'next') || (!isNavNext && hoveredSide === 'prev')) {
                    extraClasses += ' is-hover-zoomed';
                  }

                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                  const tx = isMobile ? dir * 48 : dir * 64;
                  const rotY = dir * -25;
                  style = {
                    transform: `translateX(${tx}%) scale(0.85) rotateY(${rotY}deg) translateZ(-80px)`,
                    zIndex: 20,
                    opacity: 0.85,
                    filter: 'brightness(0.85)',
                    pointerEvents: 'auto',
                    cursor: 'pointer'
                  };
                } else if (absOffset === 2) {
                  const dir = offset > 0 ? 1 : -1;
                  const isNavNext = dir > 0;
                  extraClasses += isNavNext ? ' is-nav-next' : ' is-nav-prev';
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                  const tx = isMobile ? dir * 80 : dir * 110;
                  const rotY = dir * -38;
                  style = {
                    transform: `translateX(${tx}%) scale(0.70) rotateY(${rotY}deg) translateZ(-160px)`,
                    zIndex: 15,
                    opacity: isMobile ? 0 : 0.55,
                    filter: 'brightness(0.7)',
                    pointerEvents: isMobile ? 'none' : 'auto',
                    cursor: 'pointer'
                  };
                } else if (absOffset === 3) {
                  const dir = offset > 0 ? 1 : -1;
                  extraClasses += dir > 0 ? ' is-nav-next' : ' is-nav-prev';
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                  const tx = isMobile ? dir * 95 : dir * 150;
                  const rotY = dir * -48;
                  style = {
                    transform: `translateX(${tx}%) scale(0.58) rotateY(${rotY}deg) translateZ(-240px)`,
                    zIndex: 10,
                    opacity: isMobile ? 0 : 0.25,
                    filter: 'brightness(0.55)',
                    pointerEvents: isMobile ? 'none' : 'auto',
                    cursor: 'pointer'
                  };
                } else {
                  const dir = offset > 0 ? 1 : -1;
                  style = {
                    transform: `translateX(${dir * 180}%) scale(0.4) rotateY(${dir * -60}deg) translateZ(-350px)`,
                    zIndex: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                    cursor: 'default'
                  };
                }
              }

              if (isEntering) {
                extraClasses += ' is-entering';
              }

              return (
                <div
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    focusIndex(index);
                  }}
                  style={style}
                  className={`journal-card rounded-2xl sm:rounded-3xl shadow-lg border border-brand-pale overflow-hidden bg-transparent transition-all duration-500 ease-out ${extraClasses}`}
                >
                  <div className="w-full h-full relative overflow-hidden bg-transparent">
                    <GlassImage
                      src={item.src}
                      alt={item.caption || `School moment ${index + 1}`}
                      variant="emerald"
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover object-center block pointer-events-none"
                      loading="lazy"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => focusIndex(currentIndex - 1)}
            aria-label="Previous image"
            className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-brand-white/90 border border-brand-pale text-brand-forest hover:bg-brand-white hover:scale-105 transition-all shadow-md items-center justify-center cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => focusIndex(currentIndex + 1)}
            aria-label="Next image"
            className="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-brand-white/90 border border-brand-pale text-brand-forest hover:bg-brand-white hover:scale-105 transition-all shadow-md items-center justify-center cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-6">
          {journalGallery.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => focusIndex(dotIdx)}
              aria-label={`Go to slide ${dotIdx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${dotIdx === currentIndex
                ? 'w-6 bg-brand-forest'
                : 'w-2 bg-brand-pale hover:bg-brand-soft'
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
