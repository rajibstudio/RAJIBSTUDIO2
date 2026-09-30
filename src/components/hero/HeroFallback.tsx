"use client";

import { useSyncExternalStore } from "react";
import { SHOTS } from "./shots";
import { heroState, subscribe } from "./heroState";
import styles from "./hero.module.css";

const getShot = () => heroState.shot;

/**
 * Lightweight hero for phones / low-power devices: no WebGL at all.
 * Pre-rendered frames of the same 3D shoot cross-fade with a slow push-in and a
 * CSS focus-pull on every cut, driven by the same scroll progress + HUD.
 */
export function HeroFallback() {
  const shot = useSyncExternalStore(subscribe, getShot, () => 0);
  return (
    <div className={styles.fallback}>
      {SHOTS.map((s, i) => (
        <div key={s.id} className={styles.still} data-active={i === shot} data-past={i < shot}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.still} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" fetchPriority={i === 0 ? "high" : "low"} />
        </div>
      ))}
    </div>
  );
}
