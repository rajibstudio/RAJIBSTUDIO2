"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Ctx = createContext<Lenis | null>(null);
export const useLenis = () => useContext(Ctx);

/**
 * Inertial smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger,
 * the hero camera and every reveal share a single, synchronised clock.
 * Disabled for reduced-motion users and on touch devices (native momentum is better there).
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    const l = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: false });
    l.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(l);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      setLenis(null);
    };
  }, []);

  // In-page anchor links glide instead of jumping
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!;
      const el = id === "#" || id === "#top" ? document.body : document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el as HTMLElement, { duration: 1.8, offset: 0 });
      else (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", id);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  return <Ctx.Provider value={lenis}>{children}</Ctx.Provider>;
}
