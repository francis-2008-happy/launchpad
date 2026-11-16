// Fades its content in the first time it scrolls into view (issue #29).
// It only sets data-visible on the wrapper; the animation itself is CSS in
// globals.css. Match rings and skill bars inside also "fill up" at that moment.
//
// When the visitor prefers reduced motion, or JavaScript is off, the CSS never
// hides anything, so the content simply shows without animating.
"use client";

import { useEffect, useRef } from "react";

export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Very old browsers: just show it.
    if (!("IntersectionObserver" in window)) {
      element.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.dataset.visible = "true";
          observer.disconnect(); // animate only once
        }
      },
      // Start when about 15% of the section is on screen.
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
