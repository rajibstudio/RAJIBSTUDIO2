"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { FILMS, type Film } from "@/lib/content";
import { photo } from "@/lib/gallery";
import { Reveal } from "../ui/Reveal";
import { useLenis } from "../ui/SmoothScroll";
import styles from "./films.module.css";

export function Films() {
  const [playing, setPlaying] = useState<Film | null>(null);
  return (
    <section id="films" className={`section ${styles.films}`}>
      <div className="container">
        <Reveal className={styles.head}>
          <span className="eyebrow" data-reveal>
            Wedding Films · Cinematography
          </span>
          <h2 className="display" data-reveal>
            Shot like cinema.
            <br />
            <em>Cut like memory.</em>
          </h2>
          <p className="lede" data-reveal>
            Multi-camera 4K capture on cinema primes, gimbals and drones, with the vows, the songs and the silences recorded in clean audio.
          </p>
        </Reveal>

        <div className={styles.grid}>
          {FILMS.map((f, i) => (
            <FilmCard key={f.id} film={f} featured={i === 0} onPlay={() => setPlaying(f)} />
          ))}
        </div>
      </div>
      {playing && <FilmModal film={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}

function FilmCard({ film, featured, onPlay }: { film: Film; featured: boolean; onPlay: () => void }) {
  const [frame, setFrame] = useState(0);
  const timer = useRef<number | null>(null);
  const frames = film.frames.map(photo);

  // On hover: flick through frames like a scrubbed timeline
  const start = () => {
    if (timer.current) return;
    timer.current = window.setInterval(() => setFrame((f) => (f + 1) % frames.length), 900);
  };
  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setFrame(0);
  };
  useEffect(() => stop, []);

  return (
    <Reveal className={styles.card} y={50}>
      <button type="button" className={styles.poster} data-featured={featured} onMouseEnter={start} onMouseLeave={stop} onFocus={start} onBlur={stop} onClick={onPlay} aria-label={`Play ${film.title}`}>
        {frames.map((p, i) => (
          <Image key={p.id} src={p.src} alt={i === 0 ? p.alt : ""} fill sizes={featured ? "(max-width: 900px) 100vw, 66vw" : "(max-width: 900px) 100vw, 33vw"} data-on={i === frame} className={styles.frame} />
        ))}
        <span className={styles.letterbox} />
        <span className={styles.play}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
        <span className={styles.runtime}>{film.runtime}</span>
      </button>
      <div className={styles.meta}>
        <span>{film.kind}</span>
        <h3>{film.title}</h3>
        <p>{film.couple}</p>
      </div>
    </Reveal>
  );
}

/** Plays real footage when provided, otherwise a cinematic still-frame teaser reel. */
function FilmModal({ film, onClose }: { film: Film; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const lenis = useLenis();
  const frames = film.frames.map(photo);
  const hasVideo = !!(film.videoSrc || film.youtubeId);
  const DURATION = 4200;

  useEffect(() => {
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    gsap.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasVideo || paused) return;
    const t = window.setTimeout(() => setI((v) => (v + 1) % frames.length), DURATION);
    return () => window.clearTimeout(t);
  }, [i, paused, hasVideo, frames.length]);

  const close = () => gsap.to(root.current, { autoAlpha: 0, duration: 0.4, onComplete: onClose });

  return createPortal(
    <div ref={root} className={styles.modal} role="dialog" aria-modal="true" aria-label={film.title}>
      <div className={styles.screen}>
        {film.youtubeId ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0`} title={film.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        ) : film.videoSrc ? (
          <video src={film.videoSrc} autoPlay controls playsInline />
        ) : (
          <>
            {frames.map((p, k) => (
              <div key={p.id} className={styles.reelFrame} data-on={k === i} data-paused={paused}>
                <Image src={p.src} alt={p.alt} fill sizes="100vw" priority={k === 0} />
              </div>
            ))}
            <p className={styles.line} key={i}>
              {film.lines[i % film.lines.length]}
            </p>
            <div className={styles.progress}>
              {frames.map((p, k) => (
                <span key={p.id} data-state={k < i ? "done" : k === i ? (paused ? "paused" : "on") : "off"} style={{ animationDuration: `${DURATION}ms` }} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className={styles.modalBar}>
        <div>
          <span>{film.kind}</span>
          <strong>{film.title}</strong>
          <em>{film.couple}</em>
        </div>
        {!hasVideo && (
          <button type="button" onClick={() => setPaused((p) => !p)}>
            {paused ? "Play" : "Pause"}
          </button>
        )}
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
