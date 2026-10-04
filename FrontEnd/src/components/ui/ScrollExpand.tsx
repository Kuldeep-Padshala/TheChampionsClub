import React, { useEffect, useRef } from 'react';

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  useWindowScroll?: boolean;
  scrollDistance?: number;
  holdDistance?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * ScrollExpand — 120fps GPU-Accelerated Scroll Expansion with Viewport Culling.
 * - Viewport culling: completely idle when off-screen, zero GPU overhead during fast scroll
 * - Pure CSS clip-path & 3D transforms (0ms layout reflow)
 * - Zero competing CSS transitions
 */
export const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = '',
  children,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef<number>(-1);

  useEffect(() => {
    let rafId: number | null = null;
    let isTicking = false;

    const update = () => {
      if (!containerRef.current || !frameRef.current) {
        isTicking = false;
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Viewport Culling: Skip all style calculations when completely off-screen
      if (rect.bottom < -100) {
        if (lastProgressRef.current !== 1) {
          lastProgressRef.current = 1;
          frameRef.current.style.clipPath = 'inset(0% 0% 0% 0% round 0px)';
          if (mediaRef.current) mediaRef.current.style.transform = 'scale3d(1, 1, 1)';
        }
        isTicking = false;
        return;
      }

      if (rect.top > windowH + 100) {
        if (lastProgressRef.current !== 0) {
          lastProgressRef.current = 0;
          frameRef.current.style.clipPath = 'inset(5% 8.5% 5% 8.5% round 32px)';
          if (mediaRef.current) mediaRef.current.style.transform = 'scale3d(1.18, 1.18, 1)';
        }
        isTicking = false;
        return;
      }

      // In viewport: compute progress
      const start = windowH * 0.85;
      const end = windowH * 0.22;
      const rawProgress = clamp((start - rect.top) / (start - end), 0, 1);
      const progress = smoothstep(0, 1, rawProgress);

      // Delta threshold: avoid redundant DOM writes if progress hasn't materially changed
      if (Math.abs(lastProgressRef.current - progress) < 0.002) {
        isTicking = false;
        return;
      }
      lastProgressRef.current = progress;

      // Inset percentages
      const insetX = (1 - progress) * 8.5;
      const insetY = (1 - progress) * 5.0;
      const radius = (1 - progress) * 32;

      // Pure GPU clip-path without layout reflow
      frameRef.current.style.clipPath = `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${radius}px)`;

      if (mediaRef.current) {
        const zoom = 1.18 - 0.18 * progress;
        mediaRef.current.style.transform = `scale3d(${zoom}, ${zoom}, 1)`;
      }

      if (titleRef.current) {
        const titleOut = smoothstep(0.35, 0.85, rawProgress);
        titleRef.current.style.opacity = `${1 - titleOut}`;
        titleRef.current.style.transform = `translate3d(0, ${-25 * titleOut}px, 0)`;
      }

      if (overlayRef.current) {
        const overlayIn = smoothstep(0.65, 0.98, rawProgress);
        overlayRef.current.style.opacity = `${overlayIn}`;
        overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - overlayIn)}px, 0)`;
      }

      isTicking = false;
    };

    const onScrollOrResize = () => {
      if (!isTicking) {
        isTicking = true;
        rafId = requestAnimationFrame(update);
      }
    };

    // Initial paint
    update();

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden ${className}`.trim()}
      style={style}
    >
      <div
        ref={frameRef}
        className="absolute inset-0 w-full h-full overflow-hidden shadow-2xl pointer-events-auto"
        style={{
          clipPath: 'inset(5% 8.5% 5% 8.5% round 32px)',
          willChange: 'clip-path',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {mediaType === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{
              willChange: 'transform',
              transform: 'scale3d(1.18, 1.18, 1)',
              backfaceVisibility: 'hidden',
            }}
          />
        ) : (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={src}
            alt={alt}
            draggable={false}
            className="w-full h-full object-cover"
            style={{
              willChange: 'transform',
              transform: 'scale3d(1.18, 1.18, 1)',
              backfaceVisibility: 'hidden',
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

        {title && (
          <div
            ref={titleRef}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none select-none"
            style={{
              willChange: 'opacity, transform',
              transform: 'translateZ(0)',
            }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-lg">
              {title}
            </h2>
            {scrollHint && (
              <span className="mt-3 text-xs sm:text-sm uppercase tracking-widest text-white/70 font-medium">
                {scrollHint} ↓
              </span>
            )}
          </div>
        )}

        {children && (
          <div
            ref={overlayRef}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-0 pointer-events-none select-none"
            style={{
              willChange: 'opacity, transform',
              transform: 'translate3d(0, 18px, 0)',
            }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrollExpand;
