'use client';

import { createElement, type Children, type HTMLAttributes, type ReactNode, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';

type HtmlTag = keyof HTMLElementTagNameMap;

interface RevealProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: HtmlTag;
  children: ReactNode;
  delay?: number;
  y?: number;
  stagger?: number;
}

export default function Reveal({
  as = 'div',
  children,
  delay = 0,
  y = 40,
  stagger,
  ...elementProps
}: RevealProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const element = scope.current;
      if (!element) return;

      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const isContents = window.getComputedStyle(element).display === 'contents';
        const targets = stagger !== undefined || isContents
          ? Array.from(element.children)
          : [element];
        if (targets.length === 0) return;

        gsap.fromTo(
          targets,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            delay,
            stagger,
            scrollTrigger: {
              trigger: isContents ? targets[0] : element,
              start: 'top 80%',
              once: true,
            },
          },
        );
      });

      return () => media.revert();
    },
    { scope, dependencies: [delay, y, stagger], revertOnUpdate: true },
  );

  return createElement(as, { ...elementProps, ref: scope }, children);
}
