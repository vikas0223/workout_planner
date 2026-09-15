/**
 * Landing Page Smooth Scroll Provider (Lenis + GSAP ScrollTrigger Integration)
 *
 * Provides synchronized smooth scrolling for the marketing landing page:
 * - Integrates Lenis with GSAP ScrollTrigger via ticker RAF
 * - Synchronizes ScrollTrigger scroll calculations
 * - Smoothly handles internal anchor navigation (#features, #how-it-works, #progress)
 * - Respects prefers-reduced-motion
 */

'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function LandingSmoothScroll() {
  useEffect(() => {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Instantiate Lenis
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    // Synchronize ScrollTrigger with Lenis scroll events
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Hook Lenis into GSAP's unified ticker for 60/120fps synchronization
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Smooth anchor navigation handler
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement as HTMLElement, {
            offset: -84,
            duration: 1.1,
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    // Ensure initial scroll position and ScrollTrigger bounds are aligned
    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, []);

  return null;
}
