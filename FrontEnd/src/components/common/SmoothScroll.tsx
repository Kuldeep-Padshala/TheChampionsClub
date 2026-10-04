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
 * SmoothScroll — Hardware-synchronized 120fps luxury momentum scrolling.
 * Lenis handles scroll physics. Route changes reset scroll position immediately.
 */
export const SmoothScroll = () => {
  const { pathname, hash } = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis once for the app lifetime
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      smoothWheel: true,
      syncTouch: false,
      autoResize: true,
      stopInertiaOnNavigate: true,
      prevent: (node) =>
        node.hasAttribute?.('data-lenis-prevent') ||
        !!node.closest?.('[data-lenis-prevent]') ||
        !!node.closest?.('.lenis-prevent'),
    });

    lenisRef.current = lenis;
    (window as any).lenis = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      delete (window as any).lenis;
    };
  }, []);

  // Route change: immediately snap scroll to top before next paint
  useEffect(() => {
    const lenis = lenisRef.current || (window as any).lenis;
    let hashTimer: ReturnType<typeof setTimeout>;

    if (!hash) {
      // Instantly zero out both native position and Lenis tracked position
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
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
