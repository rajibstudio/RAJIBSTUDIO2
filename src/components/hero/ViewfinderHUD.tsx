"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { SHOTS, focalLength } from "./shots";
import { heroState, subscribe } from "./heroState";
import styles from "./hero.module.css";

const getShot = () => heroState.shot;
const getShutter = () => heroState.lastShutter;

function pad(n: number, l = 2) {
  return String(Math.floor(n)).padStart(l, "0");
}

/**
 * Cinema-camera viewfinder overlay: frame lines, REC + timecode, exposure readout,
 * a tracking AF reticle that locks onto the subject, and a frame counter that ticks
 * with every shutter release of the photographer in the scene.
 */
export function ViewfinderHUD({ mode, visible }: { mode: "live" | "still"; visible: boolean }) {
  const shotIndex = useSyncExternalStore(subscribe, getShot, () => 0);
  const shutterAt = useSyncExternalStore(subscribe, getShutter, () => 0);
  const shot = SHOTS[shotIndex];
  const reticle = useRef<HTMLDivElement>(null);
  const tc = useRef<HTMLSpanElement>(null);
  const dist = useRef<HTMLSpanElement>(null);
  const frames = useRef(2380);
  const framesEl = useRef<HTMLSpanElement>(null);
  const flash = useRef<HTMLDivElement>(null);

  // Per-frame DOM updates without React re-renders
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const pos = { x: 0.5, y: 0.45 };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = reticle.current;
      if (el) {
        const target = mode === "live" ? heroState.focus : { x: SHOTS[heroState.shot].stillFocus[0], y: SHOTS[heroState.shot].stillFocus[1], visible: true };
        pos.x += (target.x - pos.x) * 0.12;
        pos.y += (target.y - pos.y) * 0.12;
        const lock = mode === "live" ? heroState.focusLock : 1;
        el.style.transform = `translate3d(${pos.x * 100}vw, ${pos.y * 100}svh, 0) translate(-50%, -50%) scale(${1.25 - lock * 0.25})`;
        el.dataset.locked = lock > 0.92 ? "true" : "false";
        el.style.opacity = target.visible ? "1" : "0";
      }
      const secs = (performance.now() - start) / 1000 + 12 * 60 + 4;
      if (tc.current) tc.current.textContent = `${pad(secs / 3600)}:${pad((secs / 60) % 60)}:${pad(secs % 60)}:${pad((secs * 24) % 24)}`;
      if (dist.current) dist.current.textContent = mode === "live" ? `${heroState.focusDistance.toFixed(heroState.focusDistance < 1 ? 2 : 1)}m` : "—";
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // Shutter: tick the frame counter + a whisper of flash
  useEffect(() => {
    if (!shutterAt) return;
    frames.current += 1;
    if (framesEl.current) framesEl.current.textContent = String(frames.current).padStart(4, "0");
    const f = flash.current;
    if (f) {
      f.classList.remove(styles.flashOn);
      void f.offsetWidth;
      f.classList.add(styles.flashOn);
    }
  }, [shutterAt]);

  return (
    <div className={styles.hud} data-visible={visible} aria-hidden="true">
      <div ref={flash} className={styles.flash} />
      <div className={styles.frameLines}>
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className={styles.hudTopLeft}>
        <span className={styles.rec}>
          <b /> REC
        </span>
        <span ref={tc} className={styles.mono}>
          00:12:04:00
        </span>
        <span className={styles.dim}>4K · 24p · 180°</span>
      </div>
      <div className={styles.hudTopRight}>
        <span className={styles.dim}>CAM A</span>
        <span className={styles.mono}>
          STILLS <span ref={framesEl}>2380</span>
        </span>
        <span className={styles.battery}>
          <i />
        </span>
      </div>
      <div className={styles.hudBottom}>
        <span>
          <em>ISO</em> {shot.iso}
        </span>
        <span>
          <em>SHUTTER</em> {shot.shutter}
        </span>
        <span>
          <em>IRIS</em> {shot.aperture}
        </span>
        <span>
          <em>LENS</em> {focalLength(shot.fov)}mm
        </span>
        <span>
          <em>WB</em> 3200K
        </span>
        <span>
          <em>FOCUS</em> <span ref={dist}>—</span>
        </span>
      </div>
      <div ref={reticle} className={styles.reticle} data-locked="false">
        <i />
        <i />
        <i />
        <i />
        <span>AF-C</span>
      </div>
      <div className={styles.centerCross} />
    </div>
  );
}
