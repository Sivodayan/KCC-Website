import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * GlassSkeleton Primitive
 * Flexible frosted glass skeleton block with animated shimmer highlight.
 */
export function GlassSkeleton({
  className = '',
  variant = 'light', // 'light' | 'dark' | 'emerald' | 'none'
  rounded = 'rounded-xl',
  style = {}
}) {
  const surfaceClass =
    variant === 'dark'
      ? 'glass-surface-dark glass-shimmer-dark'
      : variant === 'emerald'
        ? 'glass-surface-emerald glass-shimmer'
        : variant === 'none'
          ? 'bg-slate-200/60 dark:bg-emerald-950/40 glass-shimmer'
          : 'glass-surface glass-shimmer';

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`${surfaceClass} ${rounded} ${className} relative overflow-hidden select-none pointer-events-none transition-colors duration-200`}
    />
  );
}

/**
 * GlassHeroSkeleton
 * Proportional hero banner tile matching Hero.jsx layout, dimensions, and typography hierarchy.
 */
export function GlassHeroSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-3xl min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] p-6 sm:p-12 lg:p-16 flex flex-col justify-center glass-surface glass-swipe-diagonal shadow-2xl border border-brand-pale/60 dark:border-emerald-500/30"
    >
      {/* Specular light beam at top edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

      {/* Heritage badge pill */}
      <div className="inline-flex items-center gap-2 mb-6">
        <GlassSkeleton className="h-7 w-48 sm:w-56" rounded="rounded-full" variant="emerald" />
      </div>

      {/* Hero Headline lines */}
      <div className="space-y-3.5 mb-6 max-w-2xl">
        <GlassSkeleton className="h-9 sm:h-12 w-11/12" rounded="rounded-2xl" variant="emerald" />
        <GlassSkeleton className="h-8 sm:h-11 w-3/4" rounded="rounded-2xl" variant="emerald" />
      </div>

      {/* Subtitle paragraph lines */}
      <div className="space-y-2 mb-8 max-w-xl">
        <GlassSkeleton className="h-4 w-full" rounded="rounded-md" />
        <GlassSkeleton className="h-4 w-4/5" rounded="rounded-md" />
        <GlassSkeleton className="h-4 w-2/3" rounded="rounded-md" />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3.5 mb-8">
        <GlassSkeleton className="h-12 w-40 sm:w-44" rounded="rounded-full" variant="emerald" />
        <GlassSkeleton className="h-12 w-32 sm:w-36" rounded="rounded-full" />
      </div>

      {/* Bottom legacy metrics */}
      <div className="pt-6 border-t border-brand-pale/40 dark:border-emerald-900/50 flex items-center gap-6 sm:gap-10 max-w-xl">
        <div className="space-y-1">
          <GlassSkeleton className="h-7 w-16" rounded="rounded-lg" variant="emerald" />
          <GlassSkeleton className="h-3 w-24" rounded="rounded-full" />
        </div>
        <div className="w-px h-8 bg-slate-200 dark:bg-emerald-900/60" />
        <div className="space-y-1">
          <GlassSkeleton className="h-7 w-16" rounded="rounded-lg" variant="emerald" />
          <GlassSkeleton className="h-3 w-24" rounded="rounded-full" />
        </div>
        <div className="w-px h-8 bg-slate-200 dark:bg-emerald-900/60" />
        <div className="space-y-1">
          <GlassSkeleton className="h-7 w-16" rounded="rounded-lg" variant="emerald" />
          <GlassSkeleton className="h-3 w-24" rounded="rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * GlassPrinciplesSkeleton
 * 3-column institutional pillars matching Principles.jsx.
 */
export function GlassPrinciplesSkeleton() {
  return (
    <div className="space-y-8 py-6">
      {/* Section Title */}
      <div className="text-center max-w-xl mx-auto space-y-2.5">
        <GlassSkeleton className="h-8 sm:h-9 w-64 mx-auto" rounded="rounded-2xl" variant="emerald" />
        <GlassSkeleton className="h-4 w-80 max-w-full mx-auto" rounded="rounded-full" />
      </div>

      {/* 3 Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-3xl p-6 sm:p-7 flex flex-col gap-4 glass-surface glass-swipe-diagonal border border-brand-pale/60 dark:border-emerald-500/20"
          >
            <GlassSkeleton className="w-14 h-14" rounded="rounded-2xl" variant="emerald" />
            <GlassSkeleton className="h-6 w-36" rounded="rounded-xl" variant="emerald" />
            <div className="space-y-2 flex-1">
              <GlassSkeleton className="h-3.5 w-full" rounded="rounded-md" />
              <GlassSkeleton className="h-3.5 w-5/6" rounded="rounded-md" />
              <GlassSkeleton className="h-3.5 w-4/6" rounded="rounded-md" />
            </div>
            <GlassSkeleton className="h-4 w-28 mt-2" rounded="rounded-full" variant="emerald" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GlassPerformanceSkeleton
 * 4-metric counter grid matching Performance.jsx.
 */
export function GlassPerformanceSkeleton() {
  return (
    <div className="py-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-36 glass-surface glass-shimmer border border-brand-pale/50 dark:border-emerald-500/20"
          >
            <GlassSkeleton className="w-8 h-8" rounded="rounded-xl" variant="emerald" />
            <div className="space-y-1.5">
              <GlassSkeleton className="h-8 w-20" rounded="rounded-xl" variant="emerald" />
              <GlassSkeleton className="h-3.5 w-28" rounded="rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GlassEventSkeleton
 * Full-fidelity frosted glass skeleton replicating the layout of Facebook Post embed cards
 * in SchoolEvents while the iframe is loading from the network.
 */
export function GlassEventSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-10 w-full h-full p-4 flex flex-col justify-between glass-surface glass-swipe-diagonal rounded-3xl overflow-hidden pointer-events-none transition-opacity duration-500 ease-out border border-brand-pale/50 dark:border-emerald-500/30"
    >
      {/* Specular top light streak */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

      {/* Header: Avatar + Author + Timestamp */}
      <div className="flex items-center gap-3">
        <GlassSkeleton className="w-10 h-10 shrink-0" rounded="rounded-full" variant="emerald" />
        <div className="flex-1 space-y-1.5">
          <GlassSkeleton className="h-3 w-32" rounded="rounded-full" />
          <GlassSkeleton className="h-2 w-20" rounded="rounded-full" />
        </div>
        <GlassSkeleton className="w-6 h-6 shrink-0" rounded="rounded-full" />
      </div>

      {/* Post Text Description lines */}
      <div className="space-y-2 my-3">
        <GlassSkeleton className="h-2.5 w-full" rounded="rounded-full" />
        <GlassSkeleton className="h-2.5 w-5/6" rounded="rounded-full" />
        <GlassSkeleton className="h-2.5 w-2/3" rounded="rounded-full" />
      </div>

      {/* Main Media Block (Photo / Video Area) */}
      <div className="relative flex-1 w-full min-h-[190px] rounded-2xl glass-surface-emerald glass-shimmer overflow-hidden border border-brand-pale/60 dark:border-emerald-500/40 shadow-inner" />

      {/* Footer Actions: Like, Comment, Share Skeleton */}
      <div className="pt-3 border-t border-brand-pale/40 dark:border-emerald-900/50 flex items-center justify-around">
        <GlassSkeleton className="h-5 w-16" rounded="rounded-full" />
        <GlassSkeleton className="h-5 w-20" rounded="rounded-full" />
        <GlassSkeleton className="h-5 w-16" rounded="rounded-full" />
      </div>
    </div>
  );
}

/**
 * GlassEventsGridSkeleton
 * Grid of content-sized Facebook card tiles for SchoolEvents.jsx / EventsPage.jsx.
 */
export function GlassEventsGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center items-stretch py-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative w-full max-w-[360px] h-[480px] rounded-3xl p-4 flex flex-col justify-between glass-surface glass-swipe-diagonal border border-brand-pale/60 dark:border-emerald-500/25 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <GlassSkeleton className="w-10 h-10 shrink-0" rounded="rounded-full" variant="emerald" />
            <div className="flex-1 space-y-1.5">
              <GlassSkeleton className="h-3 w-32" rounded="rounded-full" />
              <GlassSkeleton className="h-2 w-20" rounded="rounded-full" />
            </div>
            <GlassSkeleton className="w-6 h-6 shrink-0" rounded="rounded-full" />
          </div>

          {/* Description */}
          <div className="space-y-2 my-3">
            <GlassSkeleton className="h-2.5 w-full" rounded="rounded-full" />
            <GlassSkeleton className="h-2.5 w-5/6" rounded="rounded-full" />
            <GlassSkeleton className="h-2.5 w-3/4" rounded="rounded-full" />
          </div>

          {/* Media image area */}
          <div className="flex-1 w-full min-h-[200px] rounded-2xl glass-surface-emerald glass-shimmer border border-brand-pale/50 dark:border-emerald-500/30" />

          {/* Actions */}
          <div className="pt-3 mt-3 border-t border-brand-pale/40 dark:border-emerald-900/50 flex items-center justify-around">
            <GlassSkeleton className="h-5 w-16" rounded="rounded-full" />
            <GlassSkeleton className="h-5 w-18" rounded="rounded-full" />
            <GlassSkeleton className="h-5 w-16" rounded="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * GlassGallerySkeleton
 * Sized to the 3D Cylindrical Gallery Carousel stage in Gallery.jsx.
 */
export function GlassGallerySkeleton() {
  return (
    <div className="py-8 sm:py-12 space-y-8">
      {/* Carousel 3D Stage Skeleton */}
      <div className="relative min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden">
        {/* Left Angled Preview Card */}
        <div className="hidden md:block absolute left-4 lg:left-12 w-64 lg:w-72 h-80 rounded-3xl glass-surface glass-shimmer opacity-40 scale-90 -rotate-6 border border-brand-pale/40 dark:border-emerald-500/20" />

        {/* Center Active Main Hero Card */}
        <div className="relative z-10 w-72 sm:w-84 md:w-96 h-80 sm:h-[400px] rounded-3xl p-3 glass-surface glass-swipe-diagonal shadow-2xl border-2 border-brand-soft/60 dark:border-emerald-400/40 flex flex-col justify-between">
          <div className="w-full h-full rounded-2xl glass-surface-emerald glass-shimmer" />
        </div>

        {/* Right Angled Preview Card */}
        <div className="hidden md:block absolute right-4 lg:right-12 w-64 lg:w-72 h-80 rounded-3xl glass-surface glass-shimmer opacity-40 scale-90 rotate-6 border border-brand-pale/40 dark:border-emerald-500/20" />
      </div>

      {/* Carousel Navigation Indicators */}
      <div className="flex items-center justify-center gap-2 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <GlassSkeleton
            key={i}
            className={i === 1 ? 'w-8 h-2.5' : 'w-2.5 h-2.5'}
            rounded="rounded-full"
            variant={i === 1 ? 'emerald' : 'light'}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * GlassTimelineSkeleton
 * Alternating vertical timeline layout matching HistoryTimeline.jsx.
 */
export function GlassTimelineSkeleton() {
  return (
    <div className="py-6 space-y-10 max-w-4xl mx-auto">
      {/* Language Switcher pill */}
      <div className="flex justify-center">
        <GlassSkeleton className="h-9 w-40" rounded="rounded-full" variant="emerald" />
      </div>

      {/* Timeline items */}
      <div className="relative border-l-2 border-brand-pale dark:border-emerald-900/60 ml-4 sm:ml-32 space-y-10 pl-6 sm:pl-10">
        {[1849, 1852, 1890, 1928].map((year, idx) => (
          <div key={year} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-[35px] sm:-left-[51px] top-1.5 w-6 h-6 rounded-full glass-surface-emerald glass-shimmer border-2 border-brand-forest dark:border-emerald-400" />

            {/* Date badge on left for desktop */}
            <div className="hidden sm:block absolute -left-36 top-1.5 w-20 text-right">
              <GlassSkeleton className="h-6 w-16 ml-auto" rounded="rounded-full" variant="emerald" />
            </div>

            {/* Content card tile */}
            <div className="rounded-3xl p-6 sm:p-7 glass-surface glass-swipe-diagonal border border-brand-pale/60 dark:border-emerald-500/20 space-y-4">
              <div className="sm:hidden">
                <GlassSkeleton className="h-5 w-16" rounded="rounded-full" variant="emerald" />
              </div>
              <GlassSkeleton className="h-7 w-3/4" rounded="rounded-xl" variant="emerald" />
              <div className="space-y-2">
                <GlassSkeleton className="h-3.5 w-full" rounded="rounded-md" />
                <GlassSkeleton className="h-3.5 w-5/6" rounded="rounded-md" />
                <GlassSkeleton className="h-3.5 w-4/6" rounded="rounded-md" />
              </div>
              {idx % 2 === 0 && (
                <div className="h-44 w-full rounded-2xl glass-surface-emerald glass-shimmer border border-brand-pale/40 dark:border-emerald-500/20" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GlassContactSkeleton
 * Sized to Contact.jsx with contact coordinates, inquiry form, and map block.
 */
export function GlassContactSkeleton() {
  return (
    <div className="py-6 space-y-8 max-w-6xl mx-auto">
      {/* 3 Top Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-2xl p-5 flex items-center gap-4 glass-surface glass-shimmer border border-brand-pale/60 dark:border-emerald-500/20"
          >
            <GlassSkeleton className="w-12 h-12 shrink-0" rounded="rounded-2xl" variant="emerald" />
            <div className="flex-1 space-y-2">
              <GlassSkeleton className="h-4 w-24" rounded="rounded-md" variant="emerald" />
              <GlassSkeleton className="h-3 w-36" rounded="rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Split: Form Tile + Map Tile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Form Tile */}
        <div className="rounded-3xl p-6 sm:p-8 glass-surface glass-swipe-diagonal border border-brand-pale/60 dark:border-emerald-500/20 space-y-5">
          <GlassSkeleton className="h-6 w-44" rounded="rounded-xl" variant="emerald" />
          <div className="space-y-4">
            <GlassSkeleton className="h-11 w-full" rounded="rounded-xl" />
            <GlassSkeleton className="h-11 w-full" rounded="rounded-xl" />
            <GlassSkeleton className="h-32 w-full" rounded="rounded-2xl" />
            <GlassSkeleton className="h-12 w-full" rounded="rounded-full" variant="emerald" />
          </div>
        </div>

        {/* Map Tile */}
        <div className="rounded-3xl p-4 glass-surface glass-shimmer border border-brand-pale/60 dark:border-emerald-500/20 flex flex-col justify-between min-h-[380px]">
          <div className="flex-1 w-full rounded-2xl glass-surface-emerald glass-shimmer border border-brand-pale/50 dark:border-emerald-500/30" />
          <div className="pt-4 flex items-center justify-between">
            <GlassSkeleton className="h-4 w-40" rounded="rounded-full" />
            <GlassSkeleton className="h-9 w-28" rounded="rounded-full" variant="emerald" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * GlassAnthemSkeleton
 * Sized to SchoolAnthem.jsx with audio player bar and lyrics stanzas.
 */
export function GlassAnthemSkeleton() {
  return (
    <div className="py-6 space-y-8 max-w-4xl mx-auto">
      {/* Audio Player Tile */}
      <div className="rounded-2xl p-4 sm:p-5 glass-surface glass-shimmer border border-brand-pale/60 dark:border-emerald-500/30 flex items-center gap-4">
        <GlassSkeleton className="w-12 h-12 shrink-0" rounded="rounded-full" variant="emerald" />
        <div className="flex-1 space-y-2">
          <GlassSkeleton className="h-3 w-40" rounded="rounded-full" variant="emerald" />
          <GlassSkeleton className="h-2 w-full" rounded="rounded-full" />
        </div>
        <GlassSkeleton className="h-4 w-12" rounded="rounded-full" />
      </div>

      {/* Lyrics Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((col) => (
          <div
            key={col}
            className="rounded-3xl p-6 sm:p-8 glass-surface glass-swipe-diagonal border border-brand-pale/60 dark:border-emerald-500/20 space-y-4"
          >
            <GlassSkeleton className="h-6 w-32 mx-auto" rounded="rounded-xl" variant="emerald" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5, 6].map((line) => (
                <GlassSkeleton key={line} className="h-4 w-5/6 mx-auto" rounded="rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GlassAdminSkeleton
 * Sized to AdminPage.jsx dashboard and login layout.
 */
export function GlassAdminSkeleton() {
  return (
    <div className="min-h-screen py-8 sm:py-12 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md rounded-3xl p-8 glass-surface glass-swipe-diagonal border border-brand-pale/70 dark:border-emerald-500/30 shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl glass-surface-emerald glass-shimmer border border-white/60 dark:border-emerald-400/40 shadow-xs" />
        <div className="text-center space-y-2">
          <GlassSkeleton className="h-7 w-44 mx-auto" rounded="rounded-xl" variant="emerald" />
          <GlassSkeleton className="h-3.5 w-60 mx-auto" rounded="rounded-full" />
        </div>
        <div className="space-y-4 pt-2">
          <GlassSkeleton className="h-12 w-full" rounded="rounded-xl" />
          <GlassSkeleton className="h-12 w-full" rounded="rounded-xl" />
          <GlassSkeleton className="h-12 w-full mt-4" rounded="rounded-full" variant="emerald" />
        </div>
      </div>
    </div>
  );
}

/**
 * GlassRouteLoader
 * Dynamic, route-aware loading stage.
 * Inspects location.pathname or the optional route prop and renders
 * loading tiles appropriately sized to the target content.
 */
export function GlassRouteLoader({ route }) {
  let location;
  try {
    location = useLocation();
  } catch {
    location = { pathname: '/' };
  }

  const currentPath = (route || location?.pathname || '/').toLowerCase();

  const renderContentTiles = () => {
    if (currentPath === '/' || currentPath === '' || currentPath.startsWith('/#')) {
      return (
        <div className="space-y-10">
          <GlassHeroSkeleton />
          <GlassPrinciplesSkeleton />
          <GlassPerformanceSkeleton />
        </div>
      );
    }

    if (currentPath.startsWith('/events')) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <GlassSkeleton className="h-7 w-20" rounded="rounded-full" variant="emerald" />
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <GlassSkeleton className="h-4 w-44" rounded="rounded-full" />
          </div>
          <div className="text-center max-w-xl mx-auto py-2">
            <GlassSkeleton className="h-10 w-72 mx-auto" rounded="rounded-2xl" variant="emerald" />
          </div>
          <GlassEventsGridSkeleton count={6} />
        </div>
      );
    }

    if (currentPath.startsWith('/gallery')) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <GlassSkeleton className="h-7 w-20" rounded="rounded-full" variant="emerald" />
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <GlassSkeleton className="h-4 w-36" rounded="rounded-full" />
          </div>
          <div className="text-center max-w-xl mx-auto py-2">
            <GlassSkeleton className="h-10 w-56 mx-auto" rounded="rounded-2xl" variant="emerald" />
          </div>
          <GlassGallerySkeleton />
        </div>
      );
    }

    if (currentPath.startsWith('/history')) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <GlassSkeleton className="h-7 w-20" rounded="rounded-full" variant="emerald" />
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <GlassSkeleton className="h-4 w-44" rounded="rounded-full" />
          </div>
          <GlassTimelineSkeleton />
        </div>
      );
    }

    if (currentPath.startsWith('/contact')) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <GlassSkeleton className="h-7 w-20" rounded="rounded-full" variant="emerald" />
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <GlassSkeleton className="h-4 w-40" rounded="rounded-full" />
          </div>
          <div className="text-center max-w-xl mx-auto py-2 space-y-2">
            <GlassSkeleton className="h-10 w-48 mx-auto" rounded="rounded-2xl" variant="emerald" />
            <GlassSkeleton className="h-4 w-72 mx-auto" rounded="rounded-full" />
          </div>
          <GlassContactSkeleton />
        </div>
      );
    }

    if (currentPath.startsWith('/anthem')) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <GlassSkeleton className="h-7 w-20" rounded="rounded-full" variant="emerald" />
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <GlassSkeleton className="h-4 w-36" rounded="rounded-full" />
          </div>
          <div className="text-center max-w-xl mx-auto py-2">
            <GlassSkeleton className="h-10 w-56 mx-auto" rounded="rounded-2xl" variant="emerald" />
          </div>
          <GlassAnthemSkeleton />
        </div>
      );
    }

    if (currentPath.startsWith('/admin')) {
      return <GlassAdminSkeleton />;
    }

    // Default Fallback
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <GlassSkeleton className="h-7 w-20" rounded="rounded-full" variant="emerald" />
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <GlassSkeleton className="h-4 w-32" rounded="rounded-full" />
        </div>
        <div className="text-center max-w-xl mx-auto py-3 space-y-2">
          <GlassSkeleton className="h-10 w-3/4 mx-auto" rounded="rounded-2xl" variant="emerald" />
          <GlassSkeleton className="h-4 w-1/2 mx-auto" rounded="rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((card) => (
            <div key={card} className="h-72 rounded-3xl glass-surface glass-shimmer p-5 flex flex-col gap-3">
              <div className="h-40 rounded-2xl glass-surface-emerald glass-shimmer" />
              <GlassSkeleton className="h-4 w-3/4 mt-2" rounded="rounded-full" />
              <GlassSkeleton className="h-3 w-1/2" rounded="rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[75vh] w-full flex flex-col relative overflow-hidden bg-brand-white dark:bg-[#0b120c] transition-colors duration-200">
      {/* Top glowing specular route bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-30 glass-route-bar" />

      {/* Main Container with content-sized loading wireframe */}
      <div className="max-w-9xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 flex flex-col">
        {renderContentTiles()}
      </div>
    </div>
  );
}
