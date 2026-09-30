"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { TESTIMONIALS } from "@/lib/content";
import { photo } from "@/lib/gallery";
import styles from "./testimonials.module.css";

const BACKDROPS = ["g098", "g050", "g092"];

export function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!root.current) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView) return;
    const t = window.setTimeout(() => setI((v) => (v + 1) % TESTIMONIALS.length), 7000);
    return () => window.clearTimeout(t);
  }, [i, paused, inView]);

  return (
    <section ref={root} id="testimonials" className={styles.testimonials} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="Client testimonials">
      {BACKDROPS.map((id, k) => (
        <div key={id} className={styles.bg} data-on={k === i}>
          <Image src={photo(id).src} alt="" fill sizes="100vw" />
        </div>
      ))}
      <div className={`container ${styles.inner}`}>
        <span className="eyebrow">Kind Words</span>
        <div className={styles.quotes}>
          {TESTIMONIALS.map((t, k) => (
            <figure key={t.name} className={styles.quote} data-on={k === i} aria-hidden={k !== i}>
              <blockquote>
                <span className={styles.mark} aria-hidden="true">
                  “
                </span>
                {t.quote}
              </blockquote>
              <figcaption>
                <strong>{t.name}</strong>
                <span>{t.place}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className={styles.dots} role="tablist">
          {TESTIMONIALS.map((t, k) => (
            <button key={t.name} type="button" role="tab" aria-selected={k === i} aria-label={`Testimonial from ${t.name}`} data-on={k === i} onClick={() => setI(k)}>
              <i key={`${i}-${paused}-${inView}`} data-run={k === i && !paused && inView} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
