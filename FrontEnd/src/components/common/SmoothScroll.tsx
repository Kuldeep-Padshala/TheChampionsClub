import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Disable browser automatic scroll restoration to prevent jumpy page loads
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

/**
 * Global helper to smoothly scroll to any element or offset from anywhere in the app
 */
export const lenisScrollTo = (
  target: string | HTMLElement | number,
  options: { offset?: number; immediate?: boolean; duration?: number } = {}
) => {
  const lenis = (window as any).lenis;
  if (lenis) {
    lenis.scrollTo(target, options);
  } else if (typeof target === 'string') {
    const el = target.startsWith('#')
      ? document.getElementById(target.slice(1))
      : document.querySelector(target);
    el?.scrollIntoView({ behavior: options.immediate ? 'instant' : 'smooth' });
  } else if (typeof target === 'number') {
    window.scrollTo({
      top: target,
      behavior: options.immediate ? 'instant' : 'smooth',
    });
  }
};

/**
 * SmoothScroll — Hardware-synchronized 120fps luxury momentum scrolling
 * active across the ENTIRE website (/courts, /shop, /cafe, /memberships, etc.)
 *
 * Features:
 * 1. Synchronized Lenis instance on window with 120Hz VSync autoRaf.
 * 2. Instant scroll reset to (0,0) on route change with zero layout jumps.
 * 3. Reactive ResizeObserver: detects when courts, products, menu items, or plans
 *    finish asynchronous fetching and dynamically recalculates page limits.
 * 4. Staggered post-navigation measurements to synchronize perfectly with Framer Motion transitions.
 * 5. Hash anchor targeting (e.g. #slot-calendar) with buttery ease-out curve.
 */
export const SmoothScroll = () => {
  const { pathname, hash } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis once for the app lifetime
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.11, // Ultra-buttery momentum with zero lag during high-speed scrolling
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      smoothWheel: true,
      syncTouch: false, // Preserves hardware 120Hz touch physics on mobile/touchpads
      autoResize: true,
      stopInertiaOnNavigate: true,
      prevent: (node) =>
        node.hasAttribute?.('data-lenis-prevent') ||
        !!node.closest?.('[data-lenis-prevent]') ||
        !!node.closest?.('.lenis-prevent'),
    });

    lenisRef.current = lenis;
    (window as any).lenis = lenis;

    // Observe document.body mutations and resize events so async data
    // (court lists, products, menus, membership tiers) continuously syncs scroll limit
    let resizeRaf: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        lenis.resize();
      });
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }

    const onWindowResize = () => {
      lenis.resize();
    };

    window.addEventListener('resize', onWindowResize, { passive: true });

    return () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeObserver.disconnect();
      window.removeEventListener('resize', onWindowResize);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as any).lenis;
    };
  }, []);

  // Handle route navigation: instant scroll reset to top
  useEffect(() => {
    const lenis = lenisRef.current || (window as any).lenis;
    let hashTimer: ReturnType<typeof setTimeout>;

    if (!hash) {
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else {
      hashTimer = setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          if (lenis) {
            lenis.scrollTo(element, { offset: -90, duration: 0.8 });
          } else {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 50);
    }

    return () => {
      if (hashTimer) clearTimeout(hashTimer);
    };
  }, [pathname, hash]);

  return null;
};

export default SmoothScroll;
