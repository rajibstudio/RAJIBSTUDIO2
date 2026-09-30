"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { detectTier, type Tier } from "@/lib/device";
import { COURT, GATE_Z, INNER, LANE_X, LANE_Z, OUTER, STAGE, STOPS, TABLE, ZONES } from "./layout";
import { flyTo, jumpTo, setMode, startGuided, subscribe, tour, type Mode } from "./tourState";
import styles from "./tour.module.css";

// The whole 3D world is a separate bundle, fetched only when this page opens.
const TourCanvas = dynamic(() => import("./TourCanvas"), { ssr: false, loading: () => null });

const getMode = () => tour.mode;
const getZone = () => tour.zone;
const getGuided = () => tour.guided.index;
const getReady = () => tour.ready;
const serverMode = (): Mode => "loading";

type Env = { tier: Tier; touch: boolean; webgl: boolean; capture?: number };

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Tour() {
  const [env, setEnv] = useState<Env | null>(null);
  const mode = useSyncExternalStore(subscribe, getMode, serverMode);
  const zone = useSyncExternalStore(subscribe, getZone, () => "lane");
  const guided = useSyncExternalStore(subscribe, getGuided, () => 0);
  const ready = useSyncExternalStore(subscribe, getReady, () => false);
  const wrap = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [hint, setHint] = useState(true);

  // Environment + a fresh state every time the page opens
  useEffect(() => {
    Object.assign(tour, { mode: "loading", ready: false, jump: null, flight: null, fade: 0, zone: "lane" });
    tour.keys.clear();
    const q = new URLSearchParams(window.location.search);
    const forced = q.get("tier");
    const tier: Tier = forced === "high" || forced === "medium" || forced === "low" ? forced : detectTier();
    tour.calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = q.get("capture");
    setEnv({ tier, touch: window.matchMedia("(pointer: coarse)").matches, webgl: hasWebGL(), capture: c !== null ? Number(c) : undefined });
    const html = document.documentElement;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
      document.body.style.overflow = "";
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, []);

  const lock = useCallback(() => {
    if (!env || env.touch) return;
    const c = wrap.current?.querySelector("canvas") as (HTMLCanvasElement & { requestPointerLock: () => Promise<void> | void }) | null;
    try {
      const r = c?.requestPointerLock();
      if (r && typeof (r as Promise<void>).catch === "function") (r as Promise<void>).catch(() => {});
    } catch {
      /* drag-to-look still works */
    }
  }, [env]);

  const explore = useCallback(() => {
    if (!tour.ready) return;
    if (tour.mode === "intro") flyTo(0);
    setMode("explore");
    lock();
  }, [lock]);

  const guide = useCallback(() => {
    if (!tour.ready) return;
    startGuided(tour.mode === "intro");
  }, []);

  const go = useCallback(
    (i: number) => {
      setMode("explore");
      jumpTo(i, "explore");
      lock();
    },
    [lock],
  );

  const takePhoto = useCallback(() => {
    tour.photo = true;
    const f = flash.current;
    if (f) {
      f.classList.remove(styles.flashOn);
      void f.offsetWidth;
      f.classList.add(styles.flashOn);
    }
  }, []);

  // Photos: download automatically and show a small print
  useEffect(() => {
    tour.onPhoto = (url) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `rajib-studio-biye-bari-${Date.now()}.jpg`;
      a.click();
      setPhoto((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    };
    return () => {
      tour.onPhoto = null;
    };
  }, []);
  useEffect(() => {
    if (!photo) return;
    const id = window.setTimeout(() => setPhoto(null), 6000);
    return () => window.clearTimeout(id);
  }, [photo]);

  // Keyboard
  useEffect(() => {
    const MOVE = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (MOVE.includes(e.code) || e.code === "Space") e.preventDefault();
      tour.keys.add(e.code);
      if (tour.mode === "intro" && e.code === "Enter") return explore();
      if (e.code === "Escape" && (tour.mode === "explore" || tour.mode === "guided") && !document.pointerLockElement) return setMode("paused");
      if (tour.mode !== "explore" && tour.mode !== "guided") return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= STOPS.length) return go(n - 1);
      if (e.code === "KeyP") return takePhoto();
      if (e.code === "KeyM") return setShowMap((v) => !v);
      if (tour.mode === "guided" && MOVE.includes(e.code)) setMode("explore");
    };
    const up = (e: KeyboardEvent) => tour.keys.delete(e.code);
    const blur = () => tour.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [explore, go, takePhoto]);

  // Mouse look: pointer lock when available, drag-to-look otherwise
  useEffect(() => {
    let dragging = false;
    const move = (e: MouseEvent) => {
      if (tour.mode !== "explore") return;
      if (document.pointerLockElement || dragging) {
        tour.look.x += e.movementX;
        tour.look.y += e.movementY;
      }
    };
    const down = (e: MouseEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).tagName !== "CANVAS") return;
      dragging = true;
      if (tour.mode === "explore" && !document.pointerLockElement) lock();
    };
    const up = () => {
      dragging = false;
    };
    const lockChange = () => {
      if (!document.pointerLockElement && tour.mode === "explore" && env && !env.touch) setMode("paused");
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.addEventListener("pointerlockchange", lockChange);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.removeEventListener("pointerlockchange", lockChange);
    };
  }, [env, lock]);

  // Teleport fade
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (fade.current) fade.current.style.opacity = String(tour.fade);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  // The controls hint fades once someone starts exploring
  useEffect(() => {
    if (mode !== "explore") return;
    setHint(true);
    const id = window.setTimeout(() => setHint(false), 9000);
    return () => window.clearTimeout(id);
  }, [mode]);

  if (!env) return <main className={styles.page} />;

  if (env.capture !== undefined)
    return (
      <main className={styles.page}>
        <div className={styles.canvas}>
          <TourCanvas tier="high" capture={env.capture} />
        </div>
      </main>
    );

  if (!env.webgl)
    return (
      <main className={`${styles.page} ${styles.noGl}`}>
        <span className="eyebrow">Biye Bari 3D</span>
        <h1 className="display">
          This device can’t open <em>the 3D walkthrough.</em>
        </h1>
        <p className="lede">It needs WebGL, which is switched off or unavailable in this browser. Try Chrome, Safari or Edge on a phone or computer.</p>
        <Link href="/" className="btn btn-gold">
          Back to Rajib Studio
        </Link>
      </main>
    );

  const zoneInfo = ZONES.find((z) => z.id === zone);
  const stop = STOPS[guided];
  const playing = mode === "explore" || mode === "guided";

  return (
    <main className={styles.page} data-mode={mode}>
      <div ref={wrap} className={styles.canvas}>
        <TourCanvas tier={env.tier} />
      </div>
      <div ref={fade} className={styles.fade} />
      <div ref={flash} className={styles.flash} />
      {mode === "explore" && !env.touch && <div className={styles.crosshair} />}

      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="Back to Rajib Studio">
          RAJIB <em>STUDIO</em>
          <span>Biye Bari 3D</span>
        </Link>
        {playing && (
          <div className={styles.tools}>
            <button type="button" onClick={() => setShowMap((v) => !v)} aria-pressed={showMap}>
              Map
            </button>
            <button type="button" onClick={takePhoto}>
              Photo
            </button>
            {mode === "explore" ? (
              <button type="button" onClick={guide}>
                Guided tour
              </button>
            ) : (
              <button type="button" onClick={() => setMode("explore")}>
                Explore freely
              </button>
            )}
            {env.touch && (
              <button type="button" onClick={() => setMode("paused")}>
                Menu
              </button>
            )}
          </div>
        )}
      </header>

      {playing && showMap && <Minimap onPick={go} />}

      {mode === "explore" && zoneInfo && (
        <div className={styles.zone} key={zone}>
          <span lang="bn">{zoneInfo.bn}</span>
          <strong>{zoneInfo.name}</strong>
          <p>{zoneInfo.text}</p>
        </div>
      )}

      {mode === "guided" && stop && (
        <div className={styles.caption} key={stop.id}>
          <span className={styles.step}>
            {String(guided + 1).padStart(2, "0")} / {String(STOPS.length).padStart(2, "0")}
          </span>
          <h2>
            {stop.title} <em lang="bn">{stop.bn}</em>
          </h2>
          <p>{stop.text}</p>
        </div>
      )}

      {mode === "explore" && (
        <p className={styles.hint} data-visible={hint}>
          {env.touch ? "Left thumb: walk · Right thumb: look around · Menu: jump to a place" : "W A S D: walk · Mouse: look · Shift: run · 1–8: jump to a place · P: photo · M: map · Esc: menu"}
        </p>
      )}

      {env.touch && mode === "explore" && <TouchControls />}

      {(mode === "loading" || mode === "intro") && (
        <section className={styles.intro}>
          <span className="eyebrow">Interactive 3D · Rajib Studio</span>
          <h1>
            Biye Bari <em lang="bn">বিয়েবাড়িতে স্বাগতম</em>
          </h1>
          <p>
            Walk into a Bengali wedding night: the lit-up house, the Shubho Bibaho gate, the chhadnatala with the priest, the couple and our photographer, the reception stage,
            the feast and the tattwa gifts.
          </p>
          <div className={styles.actions}>
            <button type="button" className="btn btn-gold" onClick={explore} disabled={!ready}>
              {ready ? "Enter & explore" : "Lighting the lamps…"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={guide} disabled={!ready}>
              Guided tour
            </button>
          </div>
          <ul className={styles.keys}>
            {env.touch ? (
              <>
                <li>
                  <b>Left thumb</b> walk
                </li>
                <li>
                  <b>Right thumb</b> look around
                </li>
              </>
            ) : (
              <>
                <li>
                  <b>W A S D</b> walk
                </li>
                <li>
                  <b>Mouse</b> look
                </li>
                <li>
                  <b>Shift</b> run
                </li>
                <li>
                  <b>1–8</b> jump to a place
                </li>
                <li>
                  <b>P</b> take a photo
                </li>
              </>
            )}
          </ul>
          {env.tier === "low" && <p className={styles.note}>Running in a lighter mode for this device. It looks best on a computer.</p>}
        </section>
      )}

      {mode === "paused" && (
        <section className={styles.pause}>
          <h2>Paused</h2>
          <button type="button" className="btn btn-gold" onClick={() => (setMode("explore"), lock())}>
            Continue walking
          </button>
          <p className={styles.jumpTitle}>Jump to</p>
          <ol className={styles.stops}>
            {STOPS.map((s, i) => (
              <li key={s.id}>
                <button type="button" onClick={() => go(i)}>
                  <span>{i + 1}</span>
                  {s.title}
                  <em lang="bn">{s.bn}</em>
                </button>
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={guide}>
              Guided tour
            </button>
            <Link href="/" className="btn btn-ghost btn-sm">
              Leave the biye bari
            </Link>
          </div>
        </section>
      )}

      {photo && (
        <figure className={styles.photo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Your photo from the biye bari" />
          <figcaption>
            Saved to your downloads ·{" "}
            <a href={photo} download="rajib-studio-biye-bari.jpg">
              save again
            </a>
          </figcaption>
        </figure>
      )}
    </main>
  );
}

/* ----------------------------------- minimap ----------------------------------- */

function Minimap({ onPick }: { onPick: (i: number) => void }) {
  const me = useRef<SVGGElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      me.current?.setAttribute("transform", `translate(${tour.pos.x.toFixed(2)} ${tour.pos.z.toFixed(2)}) rotate(${((-tour.yaw * 180) / Math.PI).toFixed(1)})`);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <svg className={styles.map} viewBox="-15 -15 30 39" aria-label="Map of the biye bari">
      <rect x={-LANE_X} y={OUTER} width={2 * LANE_X} height={LANE_Z - OUTER} className={styles.mLane} />
      <rect x={-OUTER} y={-OUTER} width={2 * OUTER} height={2 * OUTER} className={styles.mHouse} />
      <rect x={-COURT} y={-COURT} width={2 * COURT} height={2 * COURT} className={styles.mCourt} />
      <rect x={-1.8} y={-1.8} width={3.6} height={3.6} className={styles.mMandap} />
      <rect x={STAGE.x0} y={STAGE.z0} width={STAGE.x1 - STAGE.x0} height={STAGE.z1 - STAGE.z0} className={styles.mThing} />
      <rect x={TABLE.x - 0.45} y={TABLE.z0} width={0.9} height={TABLE.z1 - TABLE.z0} className={styles.mThing} />
      <rect x={-13.1} y={-3.5} width={1} height={7} className={styles.mThing} />
      <rect x={-1.5} y={INNER - 0.1} width={3} height={0.6} className={styles.mDoor} />
      <line x1={-2.3} x2={2.3} y1={GATE_Z} y2={GATE_Z} className={styles.mGate} />
      {STOPS.map((s, i) => (
        <g key={s.id} className={styles.mStop} transform={`translate(${s.x} ${s.z})`} onClick={() => onPick(i)} role="button" aria-label={`Jump to ${s.title}`}>
          <circle r={1.05} />
          <text dy={0.42}>{i + 1}</text>
        </g>
      ))}
      <g ref={me} className={styles.mMe}>
        <path d="M0 -1.6 L1.1 1.1 L0 0.5 L-1.1 1.1 Z" />
      </g>
    </svg>
  );
}

/* ------------------------------- touch controls ------------------------------- */

function TouchControls() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const stick = useRef<{ id: number; x: number; y: number } | null>(null);
  const look = useRef<{ id: number; x: number; y: number } | null>(null);
  const R = 56;

  useEffect(
    () => () => {
      tour.stick.x = tour.stick.y = 0;
      tour.stick.run = false;
    },
    [],
  );

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (e.clientX < window.innerWidth * 0.45 && !stick.current) {
      stick.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      if (base.current) {
        base.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        base.current.dataset.on = "true";
      }
    } else if (!look.current) look.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = stick.current;
    if (s && s.id === e.pointerId) {
      let dx = e.clientX - s.x;
      let dy = e.clientY - s.y;
      const d = Math.hypot(dx, dy);
      if (d > R) {
        dx = (dx / d) * R;
        dy = (dy / d) * R;
      }
      tour.stick.x = dx / R;
      tour.stick.y = -dy / R;
      tour.stick.run = d > R * 0.95;
      if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
      return;
    }
    const l = look.current;
    if (l && l.id === e.pointerId) {
      tour.look.x += (e.clientX - l.x) * 1.6;
      tour.look.y += (e.clientY - l.y) * 1.6;
      l.x = e.clientX;
      l.y = e.clientY;
    }
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stick.current?.id === e.pointerId) {
      stick.current = null;
      tour.stick.x = tour.stick.y = 0;
      tour.stick.run = false;
      if (knob.current) knob.current.style.transform = "";
      if (base.current) base.current.dataset.on = "false";
    }
    if (look.current?.id === e.pointerId) look.current = null;
  };

  return (
    <div className={styles.touch} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <div ref={base} className={styles.stick} data-on="false">
        <div ref={knob} />
      </div>
    </div>
  );
}
