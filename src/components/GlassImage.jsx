import React, { useState, useEffect, useRef } from 'react';

/**
 * GlassImage Component
 * Drop-in replacement for standard <img> tags.
 * Displays a premium frosted glass loading placeholder with animated light shimmer
 * until the image finishes loading, then smoothly cross-fades the image in.
 */
export default function GlassImage({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  variant = 'light', // 'light' | 'dark' | 'emerald' | 'none'
  showIcon = true,
  fallbackSrc = '/assets/hero.jpg',
  aspectRatio,
  loading = 'lazy',
  style = {},
  imgStyle = {},
  onClick,
  onLoad: externalOnLoad,
  onError: externalOnError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  // Check if image is already cached by browser
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);

    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (externalOnLoad) externalOnLoad(e);
  };

  const handleError = (e) => {
    if (!isError && fallbackSrc && src !== fallbackSrc) {
      setIsError(true);
      // Attempt fallback image if provided
      if (imgRef.current) {
        imgRef.current.src = fallbackSrc;
      }
    } else {
      setIsError(true);
      setIsLoaded(true);
    }
    if (externalOnError) externalOnError(e);
  };

  const getPlaceholderSurface = () => {
    if (variant === 'dark') return 'glass-surface-dark glass-shimmer-dark';
    if (variant === 'emerald') return 'glass-surface-emerald glass-shimmer';
    if (variant === 'none') return 'bg-slate-200/50 glass-shimmer';
    return 'glass-surface glass-shimmer';
  };

  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: aspectRatio || undefined,
        ...style
      }}
      className={`relative overflow-hidden ${containerClassName}`}
    >
      {/* Frosted Glass Loading Placeholder with Instagram Swipe Wave */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-700 ease-out pointer-events-none ${getPlaceholderSurface()} ${
          isLoaded ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      />

      {/* Actual Image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        style={imgStyle}
        className={`${className} transition-opacity duration-700 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}
