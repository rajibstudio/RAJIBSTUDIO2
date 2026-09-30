"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getImageProps } from "next/image";
import { gsap } from "gsap";
import type { Photo } from "@/lib/gallery";
import { useLenis } from "./SmoothScroll";
import styles from "./lightbox.module.css";

type OpenFn = (photos: Photo[], index: number, origin?: HTMLElement | null) => void;
const Ctx = createContext<OpenFn>(() => {});
export const useLightbox = () => useContext(Ctx);

type State = { photos: Photo[]; index: number; origin: HTMLElement | null } | null;

function fit(w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = vw < 768 ? 0.94 : 0.84;
  const s = Math.min((vw * pad) / w, (vh * 0.8) / h);
  const width = w * s;
  const height = h * s;
  return { left: (vw - width) / 2, top: (vh - height) / 2 - (vw < 768 ? 20 : 10), width, height };
}

function sources(p: Photo) {
  const { props } = getImageProps({ src: p.src, width: p.width, height: p.height, alt: p.alt, sizes: "90vw", quality: 82 });
  return props;
}

/**
 * Full-screen lightbox with a FLIP transition from the clicked thumbnail,
 * keyboard (← → Esc), swipe and neighbour preloading.
 */
export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(null);
  const [mounted, setMounted] = useState(false);
  const lenis = useLenis();
  useEffect(() => setMounted(true), []);

  const open = useCallback<OpenFn>((photos, index, origin) => setState({ photos, index, origin: origin ?? null }), []);

  useEffect(() => {
    if (state) lenis?.stop();
    else lenis?.start();
    document.documentElement.style.overflow = state ? "hidden" : "";
  }, [state, lenis]);

  return (
    <Ctx.Provider value={open}>
      {children}
      {mounted && state && createPortal(<Viewer state={state} setState={setState} />, document.body)}
    </Ctx.Provider>
  );
}

function Viewer({ state, setState }: { state: NonNullable<State>; setState: (s: State) => void }) {
  const { photos, index, origin } = state;
  const photo = photos[index];
  const root = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const closing = useRef(false);
  const first = useRef(true);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // Opening FLIP (from the thumbnail) — and cross-fade on navigation
  useLayoutEffect(() => {
    const el = img.current;
    if (!el) return;
    const target = fit(photo.width, photo.height);
    gsap.set(el, { ...target });
    if (first.current) {
      first.current = false;
      gsap.fromTo(root.current, { backgroundColor: "rgba(7,5,6,0)" }, { backgroundColor: "rgba(7,5,6,0.96)", duration: 0.6, ease: "power2.out" });
      gsap.fromTo(root.current!.querySelectorAll("[data-chrome]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, delay: 0.35 });
      const r = origin?.getBoundingClientRect();
      if (r && r.width > 0) {
        const sx = r.width / target.width;
        const sy = r.height / target.height;
        const s = Math.max(sx, sy);
        gsap.fromTo(
          el,
          { x: r.left + r.width / 2 - (target.left + target.width / 2), y: r.top + r.height / 2 - (target.top + target.height / 2), scale: s, clipPath: clipFor(r, target, s) },
          { x: 0, y: 0, scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.95, ease: "expo.out" },
        );
      } else {
        gsap.fromTo(el, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "expo.out" });
      }
    } else {
      gsap.fromTo(el, { autoAlpha: 0, scale: 1.03, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out" });
    }
  }, [photo, origin]);

  // Preload neighbours
  useEffect(() => {
    [index - 1, index + 1].forEach((i) => {
      const p = photos[(i + photos.length) % photos.length];
      const s = sources(p);
      const im = new Image();
      if (s.srcSet) im.srcset = s.srcSet;
      im.sizes = "90vw";
      im.src = s.src;
    });
  }, [index, photos]);

  const go = useCallback((d: number) => setState({ photos, origin, index: (index + d + photos.length) % photos.length }), [index, photos, origin, setState]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = img.current;
    const r = origin?.getBoundingClientRect();
    // Fly back into the thumbnail only if we're still on the photo that was clicked and it's on screen
    const flyBack = !!(el && r && origin?.dataset.photo === photo.id && r.bottom > 0 && r.top < window.innerHeight);
    const tl = gsap.timeline({ onComplete: () => setState(null) });
    tl.to(root.current!.querySelectorAll("[data-chrome]"), { autoAlpha: 0, duration: 0.25 }, 0);
    tl.to(root.current, { backgroundColor: "rgba(7,5,6,0)", duration: 0.6, ease: "power2.inOut" }, 0.05);
    if (flyBack && el && r) {
      const target = fit(photo.width, photo.height);
      const s = Math.max(r.width / target.width, r.height / target.height);
      tl.to(el, { x: r.left + r.width / 2 - (target.left + target.width / 2), y: r.top + r.height / 2 - (target.top + target.height / 2), scale: s, clipPath: clipFor(r, target, s), duration: 0.75, ease: "expo.inOut" }, 0);
    } else if (el) {
      tl.to(el, { autoAlpha: 0, scale: 0.96, duration: 0.45, ease: "power2.in" }, 0);
    }
  }, [origin, photo, setState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const onResize = () => img.current && gsap.set(img.current, fit(photo.width, photo.height));
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [close, go, photo]);

  const src = sources(photo);

  return (
    <div
      ref={root}
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption || photo.alt}
      onClick={(e) => e.target === e.currentTarget && close()}
      onPointerDown={(e) => (touch.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const t = touch.current;
        touch.current = null;
        if (!t || e.pointerType === "mouse") return;
        const dx = e.clientX - t.x;
        const dy = e.clientY - t.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 90) close();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} className={styles.image} src={src.src} srcSet={src.srcSet} sizes="90vw" alt={photo.alt} draggable={false} />

      <div className={styles.top} data-chrome>
        <span className={styles.count}>
          {String(index + 1).padStart(2, "0")} <i /> {String(photos.length).padStart(2, "0")}
        </span>
        <button type="button" className={styles.close} onClick={close} aria-label="Close">
          <span />
          <span />
        </button>
      </div>
      <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={() => go(-1)} aria-label="Previous photograph" data-chrome>
        <svg viewBox="0 0 24 24">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={() => go(1)} aria-label="Next photograph" data-chrome>
        <svg viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div className={styles.caption} data-chrome>
        <p>{photo.caption}</p>
        <small>
          {photo.category} · Photo: {photo.credit.author} ({photo.credit.license})
        </small>
      </div>
    </div>
  );
}

function clipFor(r: DOMRect, target: { width: number; height: number }, s: number) {
  // Crop the (scaled) full image so it matches the thumbnail's cover-cropped aspect
  const w = target.width * s;
  const h = target.height * s;
  const ix = Math.max(0, ((w - r.width) / 2 / w) * 100);
  const iy = Math.max(0, ((h - r.height) / 2 / h) * 100);
  return `inset(${iy}% ${ix}% ${iy}% ${ix}%)`;
}
