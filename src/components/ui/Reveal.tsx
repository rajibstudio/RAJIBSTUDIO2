"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {
  children: React.ReactNode;
  as?: "div" | "ol" | "ul" | "section" | "header";
  className?: string;
  /** Selector for children to stagger; defaults to direct children. */
  stagger?: number;
  y?: number;
  delay?: number;
  id?: string;
};

/**
 * Scroll-triggered reveal: soft rise + un-blur, like a lens coming into focus.
 * Respects prefers-reduced-motion (content is simply shown).
 */
export function Reveal({ children, as = "div", className, stagger = 0.1, y = 36, delay = 0, id }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const items = el.querySelectorAll<HTMLElement>("[data-reveal]");
      const targets = items.length ? Array.from(items) : Array.from(el.children);
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y, filter: "blur(10px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.3,
          ease: "expo.out",
          stagger,
          delay,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
          clearProps: "filter",
        },
      );
    },
    { scope: ref },
  );
  const Tag = as as "div";
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className} id={id}>
      {children}
    </Tag>
  );
}
