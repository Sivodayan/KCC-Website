import React, { useState, useRef, useEffect } from 'react';
import { useSiteContent, isTrustedFacebookUrl } from '../context/SiteContentContext.jsx';
import { FACEBOOK_POSTS } from '../data/facebookEvents.js';
import { GlassEventSkeleton } from './GlassSkeleton.jsx';

function EventCard({ post }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const cardRef = useRef(null);

  // Safety fallback: if iframe load event is delayed or tracking blocker suppresses onLoad
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIframeLoaded(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const isSafeSrc = isTrustedFacebookUrl(post?.iframeSrc || '');
  const postUrl =
    post.postUrl ||
    (isSafeSrc ? decodeURIComponent(post.iframeSrc.match(/href=([^&]+)/)?.[1] || post.iframeSrc) : '#');

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-[360px] h-[480px] bg-white dark:bg-[#0e1710] rounded-3xl border transition-all duration-300 ease-out overflow-hidden flex flex-col justify-center items-center p-2.5 cursor-pointer group active:scale-[0.99] select-none ${isHovered
          ? '-translate-y-2 scale-[1.02] shadow-2xl shadow-brand-forest/15 dark:shadow-[0_20px_40px_rgba(0,0,0,0.6)] border-brand-forest/40 dark:border-emerald-400/50 ring-2 ring-brand-forest/20 dark:ring-emerald-400/20'
          : 'shadow-sm border-slate-200/90 dark:border-emerald-500/25 hover:shadow-md dark:hover:border-emerald-500/40'
        }`}
    >
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-20 cursor-pointer"
        aria-label={`Open Facebook post ${post.id}`}
        title="Open post on Facebook"
      />

      {/* Glassy loading skeleton placeholder until iframe completes loading */}
      {!isIframeLoaded && <GlassEventSkeleton />}

      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(360px circle at ${mousePos.x}px ${mousePos.y}px, rgba(24, 119, 242, 0.12), rgba(27, 77, 62, 0.05), transparent 70%)`,
        }}
      />

      <div
        className={`pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-forest to-transparent transition-opacity duration-300 z-10 ${isHovered ? 'opacity-100' : 'opacity-0'
          }`}
      />

      <div
        className={`w-full h-full overflow-y-auto overflow-x-hidden flex justify-center relative z-0 transition-opacity duration-500 pointer-events-none ${
          isIframeLoaded ? 'opacity-100' : 'opacity-0'
        } ${post.height <= 300 ? 'items-center' : 'items-start'}`}
      >
        <div
          className="shrink-0 flex justify-center origin-top transition-transform duration-300 pointer-events-none"
          style={{
            width: '500px',
            height: `${post.height}px`,
            transform: 'scale(0.66)',
            marginBottom: `-${post.height * 0.34}px`,
          }}
        >
          {isSafeSrc ? (
            <iframe
              src={post.iframeSrc}
              onLoad={() => setIsIframeLoaded(true)}
              width={post.width || 500}
              height={post.height}
              style={{ border: 'none', overflow: 'hidden' }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              sandbox="allow-scripts allow-same-origin allow-popups"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              className="w-full h-full rounded-2xl pointer-events-none"
              title={`Facebook Post ${post.id}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 p-4 text-center">
              Embed unavailable: Invalid or unverified post source URL.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualEventCard({ post }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const formattedDate = (() => {
    if (!post.date) return '';
    try {
      const d = new Date(post.date);
      if (isNaN(d.getTime())) return post.date;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return post.date;
    }
  })();

  const hasImage = Boolean(post.image && post.image.trim());

  return (
    <>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsDetailOpen(true)}
        className={`relative w-full max-w-[360px] h-[480px] rounded-3xl border transition-all duration-300 ease-out overflow-hidden flex flex-col cursor-pointer group active:scale-[0.99] select-none ${
          hasImage ? 'bg-slate-900 text-white' : 'bg-white dark:bg-[#0e1710] text-slate-800 dark:text-slate-100'
        } ${
          isHovered
            ? '-translate-y-2 scale-[1.02] shadow-2xl shadow-brand-forest/20 dark:shadow-[0_20px_40px_rgba(0,0,0,0.7)] border-brand-forest/40 dark:border-emerald-400/50 ring-2 ring-brand-forest/25 dark:ring-emerald-400/25'
            : 'shadow-sm border-slate-200/90 dark:border-emerald-500/25 hover:shadow-md dark:hover:border-emerald-500/40'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsDetailOpen(true);
          }
        }}
      >
        {hasImage ? (
          <>
            {/* Full Card Cover Image */}
            <img
              src={post.image}
              alt={post.title || 'School Event'}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
            />
            {/* Multi-stop dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/20 pointer-events-none" />

            {/* Radial highlight glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-10"
              style={{
                opacity: isHovered ? 1 : 0,
                background: `radial-gradient(360px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.2), rgba(27, 77, 62, 0.1), transparent 70%)`,
              }}
            />

            {/* Top edge gradient stripe on hover */}
            <div
              className={`pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-300 z-20 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Badges Overlay at Top */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-20 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-brand-forest/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider shadow-md border border-white/20">
                {post.category || 'School Event'}
              </span>
              {formattedDate && (
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold shadow-md border border-white/15">
                  {formattedDate}
                </span>
              )}
            </div>

            {/* Card Content Overlay at Bottom */}
            <div className="relative z-10 mt-auto p-5 space-y-2 flex flex-col justify-end">
              {post.title && (
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug drop-shadow-md">
                  {post.title}
                </h3>
              )}
              {post.titleTa && (
                <p className="text-xs font-tamil font-semibold text-emerald-300 line-clamp-1 drop-shadow-sm">
                  {post.titleTa}
                </p>
              )}
              {post.location && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/80 pt-0.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{post.location}</span>
                </div>
              )}
              {post.description && (
                <p className="text-xs text-white/85 line-clamp-2 leading-relaxed pt-0.5 drop-shadow-xs">
                  {post.description}
                </p>
              )}

              <div className="pt-3 border-t border-white/15 flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-emerald-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  <span>View Details</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
                  KCC Updates
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Text-only fallback card */
          <>
            {/* Radial highlight glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-10"
              style={{
                opacity: isHovered ? 1 : 0,
                background: `radial-gradient(360px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.12), rgba(27, 77, 62, 0.05), transparent 70%)`,
              }}
            />

            {/* Top edge gradient stripe on hover */}
            <div
              className={`pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-forest to-transparent transition-opacity duration-300 z-10 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Media Header (Themed Crest Banner) */}
            <div className="relative w-full h-[200px] bg-gradient-to-br from-brand-forest/10 via-brand-light to-emerald-950/20 dark:from-emerald-950 dark:to-black overflow-hidden shrink-0 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-emerald-900/60 p-2 shadow-xs mb-2 flex items-center justify-center">
                <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-[11px] font-bold text-brand-forest dark:text-emerald-300 uppercase tracking-widest">
                KCC Event
              </span>

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-forest/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                  {post.category || 'Event'}
                </span>
                {formattedDate && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs text-slate-800 dark:text-slate-200 text-[10px] font-bold shadow-2xs">
                    {formattedDate}
                  </span>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="space-y-1.5 min-w-0">
                {post.title && (
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-forest dark:group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                )}
                {post.titleTa && (
                  <p className="text-xs font-tamil font-semibold text-brand-forest dark:text-emerald-400 line-clamp-1">
                    {post.titleTa}
                  </p>
                )}
                {post.location && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <svg className="w-3.5 h-3.5 text-brand-forest dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{post.location}</span>
                  </div>
                )}
                {post.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed pt-1">
                    {post.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                <span className="text-xs font-bold text-brand-forest dark:text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  <span>View Details</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  KCC Updates
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Expanded Modal View for Full Picture and Text */}
      {isDetailOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailOpen(false);
          }}
        >
          <div className="bg-white dark:bg-[#0e1710] border border-slate-200 dark:border-emerald-800/40 rounded-2xl sm:rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col animate-modal-content">
            {/* Header */}
            <div className="bg-brand-forest dark:bg-emerald-950 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                  {post.category || 'School Event'}
                </span>
                {formattedDate && (
                  <span className="text-xs text-brand-pale truncate">
                    {formattedDate}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition shrink-0 ml-2"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
              {post.image && (
                <div className="w-full max-h-[380px] overflow-hidden rounded-2xl bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-emerald-900/40 flex items-center justify-center">
                  <img
                    src={post.image}
                    alt={post.title || 'School Event'}
                    className="w-full h-auto max-h-[380px] object-contain"
                  />
                </div>
              )}

              <div className="space-y-2">
                {post.title && (
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {post.title}
                  </h2>
                )}
                {post.titleTa && (
                  <p className="text-sm font-tamil font-semibold text-brand-forest dark:text-emerald-400">
                    {post.titleTa}
                  </p>
                )}

                {post.location && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1">
                    <svg className="w-4 h-4 text-brand-forest dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{post.location}</span>
                  </div>
                )}
              </div>

              {post.description && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {post.description}
                  </p>
                </div>
              )}

              {post.descriptionTa && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs sm:text-sm font-tamil text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {post.descriptionTa}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 rounded-full bg-brand-forest hover:bg-brand-forestHover text-white text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SchoolEvents() {
  const { content } = useSiteContent();
  const posts = (content?.events && content.events.length > 0) ? content.events : FACEBOOK_POSTS;

  return (
    <section className="py-6 sm:py-10 bg-brand-white dark:bg-[#0b120c] transition-colors" id="events-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center items-stretch">
          {posts.map((post, idx) => {
            const isManual = post.type === 'manual' || (!post.iframeSrc && (post.image || post.title));
            if (isManual) {
              return <ManualEventCard key={post.id || `manual-${idx}`} post={post} />;
            }
            return <EventCard key={post.id || `fb-${idx}`} post={post} />;
          })}
        </div>
      </div>
    </section>
  );
}
