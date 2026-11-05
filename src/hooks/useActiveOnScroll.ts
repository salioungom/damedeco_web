'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseActiveOnScrollOptions {
  count: number;
  rootMargin?: string;
}

interface UseActiveOnScrollReturn {
  getRef: (index: number) => (element: HTMLElement | null) => void;
  active: number;
}

/**
 * Hook pour détecter quel élément est actif au scroll sur les appareils tactiles.
 * Utilise IntersectionObserver avec une marge négative pour détecter l'élément
 * au centre de l'écran. Ne s'active que sur les appareils sans hover (tactile).
 */
export function useActiveOnScroll({
  count,
  rootMargin = '-45% 0px -45% 0px',
}: UseActiveOnScrollOptions): UseActiveOnScrollReturn {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // Initialiser le tableau
  useEffect(() => {
    refs.current = Array.from({ length: count }, () => null);
  }, [count]);

  const getRef = useCallback((index: number) => (element: HTMLElement | null) => {
    refs.current[index] = element;
  }, []);

  useEffect(() => {
    // Ne s'activer que sur les appareils sans hover (tactile) ou petits écrans
    if (typeof window === 'undefined' || !window.matchMedia('(hover: none), (max-width: 767px)').matches) {
      return;
    }

    const elements = refs.current.filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = refs.current.indexOf(entry.target as HTMLElement);
            if (index !== -1 && index !== active) {
              setActive(index);
            }
          }
        });
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [active]);

  return { getRef, active };
}
