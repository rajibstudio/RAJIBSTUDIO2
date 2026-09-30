"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTier } from "@/lib/device";
import { BRAND } from "@/lib/content";
import { SHOTS } from "./shots";
import { emit, heroState, subscribe } from "./heroState";
import { ViewfinderHUD } from "./ViewfinderHUD";
import { HeroFallback } from "./HeroFallback";
import { useLenis } from "../ui/SmoothScroll";
import styles from "./hero.module.css";

// The whole WebGL bundle (three, r3f, postprocessing, scene) is code-split and only
// requested on capable devices, after first paint.
const Experience = dynamic(() => import("../three/Experience"), { ssr: false, loading: () => null });

const getShot = () => heroState.shot;
const getReady = () => heroState.sceneReady;

/**
 * If WebGL can't start on a device (blocked GPU, lost context, a failed chunk download),
 * the hero quietly switches to the pre-rendered version instead of showing an empty frame.
 */
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[hero] 3D scene unavailable — showing the pre-rendered version.", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Hero() {
  const tier = useTier();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const iris = useRef<SVGPolygonElement>(null);
  const [active, setActive] = useState(true);
  const [capture, setCapture] = useState<number | undefined>(undefined);
  const shot = useSyncExternalStore(subscribe, getShot, () => 0);
  const ready = useSyncExternalStore(subscribe, getReady, () => false);
  const lenis = useLenis();
  const [sceneFailed, setSceneFailed] = useState(false);
  const live = (tier === "high" || tier === "medium") && !sceneFailed;
  const mode = sceneFailed ? "low" : tier;

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("capture");
    if (c !== null) setCapture(Number(c));
  }, []);

  // Scroll → progress (GSAP ScrollTrigger over the pinned length)
  useEffect(() => {
    if (!section.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        heroState.progress = self.progress;
      },
    });
    // The hero's length depends on the tier, so every trigger below it must be re-measured.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      st.kill();
    };
  }, [mode]);

  // Pointer → parallax
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      heroState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      heroState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Pause WebGL when the hero is off-screen
  useEffect(() => {
    if (!section.current) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(section.current);
    return () => io.disconnect();
  }, []);

  // Progress-driven CSS vars + closing iris at the end of the hero
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const p = heroState.progress;
      stage.current?.style.setProperty("--p", p.toFixed(4));
      if (iris.current) {
        const k = Math.min(Math.max((p - 0.9) / 0.1, 0), 1);
        // Stop down to a small aperture (not black) so the final frame stays visible as the hero exits
        const r = 1.2 - k * 0.98;
        iris.current.setAttribute("transform", `translate(0.5 0.5) rotate(${k * 40}) scale(${r})`);
      }
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  // In fallback mode, the shot index is derived from scroll directly
  useEffect(() => {
    if (live) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const i = Math.round(heroState.progress * (SHOTS.length - 1));
      if (i !== heroState.shot) {
        heroState.shot = i;
        heroState.lastShutter = performance.now();
        emit();
      }
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [live]);

  const jumpTo = (i: number) => {
    const el = section.current;
    if (!el) return;
    const top = el.offsetTop + (i / (SHOTS.length - 1)) * (el.offsetHeight - window.innerHeight);
    if (lenis) lenis.scrollTo(top, { duration: 1.6 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  if (capture !== undefined) {
    return (
      <div className={styles.captureStage}>
        <Experience tier="high" active capture={capture} onReady={() => ((window as unknown as { __sceneReady: boolean }).__sceneReady = true)} />
      </div>
    );
  }

  return (
    <section ref={section} id="top" className={styles.hero} data-tier={mode ?? "pending"} aria-label="Rajib Studio — cinematic wedding photography">
      <div ref={stage} className={styles.stage}>
        {/* Poster: a pre-rendered frame of the scene, visible instantly while WebGL streams in */}
        <div className={styles.poster} data-hidden={live && ready}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SHOTS[0].still} alt="" fetchPriority="high" />
        </div>

        {live && (
          <SceneBoundary onError={() => setSceneFailed(true)}>
            <div className={styles.canvas} data-ready={ready}>
              <Experience tier={tier} active={active} />
            </div>
          </SceneBoundary>
        )}
        {mode === "low" && <HeroFallback />}

        <div className={styles.grade} />
        <ViewfinderHUD mode={live ? "live" : "still"} visible={tier !== null} />

        {live && !ready && (
          <div className={styles.loader} aria-live="polite">
            <span>Calibrating lens</span>
            <i />
          </div>
        )}

        {/* Title card */}
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Kolkata · Est. 2012 · Weddings worldwide</p>
          <h1 className={styles.brand}>
            <span>RAJIB</span>
            <span>STUDIO</span>
          </h1>
          <p className={styles.taglineBn} lang="bn">
            {BRAND.taglineBn}
          </p>
          <p className={styles.taglineEn}>{BRAND.taglineEn}</p>
          <div className={styles.ctas}>
            <a href="#stories" className="btn btn-gold">
              View Wedding Stories
            </a>
            <a href="#contact" className="btn btn-ghost">
              Book Your Date
            </a>
          </div>
        </div>

        {/* Shot caption (editorial slate) */}
        <div className={styles.slate} data-visible={shot > 0} key={shot}>
          <span className={styles.slateNo}>
            {String(shot + 1).padStart(2, "0")} / {String(SHOTS.length).padStart(2, "0")}
          </span>
          <h2>{SHOTS[shot].title}</h2>
          <p>{SHOTS[shot].caption}</p>
        </div>

        {/* Shot rail */}
        <nav className={styles.rail} aria-label="Camera angles">
          {SHOTS.map((s, i) => (
            <button key={s.id} type="button" onClick={() => jumpTo(i)} data-active={i === shot} aria-label={`Angle ${i + 1}: ${s.title}`}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <em>{s.title}</em>
            </button>
          ))}
        </nav>

        <a href="#about" className={styles.skip}>
          Skip the shoot
        </a>
        <div className={styles.scrollCue} aria-hidden="true">
          <span>Scroll to direct the shoot</span>
          <i />
        </div>

        <svg className={styles.iris} viewBox="0 0 1 1" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <mask id="iris-mask">
              <rect width="1" height="1" fill="white" />
              <polygon ref={iris} fill="black" points={irisPoints()} transform="translate(0.5 0.5) scale(1.2)" />
            </mask>
          </defs>
          <rect width="1" height="1" fill="#070506" mask="url(#iris-mask)" />
        </svg>
      </div>
    </section>
  );
}

function irisPoints(n = 9) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `${(Math.cos(a) * 0.5).toFixed(4)},${(Math.sin(a) * 0.5).toFixed(4)}`;
  }).join(" ");
}
