"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { STORIES } from "@/lib/content";
import { photo } from "@/lib/gallery";
import { useLightbox } from "../ui/Lightbox";
import styles from "./stories.module.css";

/** Featured wedding stories — a pinned, horizontally-scrolling film strip on desktop, swipeable on touch. */
export function Stories() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const open = useLightbox();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        // Inner image parallax, tied to the horizontal move
        el.querySelectorAll<HTMLElement>("[data-inner]").forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -8 },
            { xPercent: 8, ease: "none", scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: "left right", end: "right left", scrub: true } },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="stories" className={styles.stories}>
      <div ref={track} className={styles.track}>
        <header className={styles.intro}>
          <span className="eyebrow">Featured Wedding Stories</span>
          <h2 className="display">
            Every wedding
            <br />
            is a <em>feature film.</em>
          </h2>
          <p className="lede">Four recent chapters from our journal — rajbari courtyards, riverside lamps and Shantiniketan dawns.</p>
          <span className={styles.hint} aria-hidden="true">
            Scroll <i />
          </span>
        </header>

        {STORIES.map((s, i) => {
          const cover = photo(s.cover);
          const frames = s.frames.map(photo);
          return (
            <article key={s.slug} className={styles.card} data-wide={i % 2 === 0}>
              <button
                type="button"
                className={styles.media}
                data-photo={cover.id}
                onClick={(e) => open(frames, 0, e.currentTarget)}
                aria-label={`Open the ${s.couple} story`}
              >
                <div data-inner className={styles.inner}>
                  <Image src={cover.src} alt={cover.alt} fill sizes="(max-width: 1024px) 85vw, 45vw" />
                </div>
                <span className={styles.view}>View story · {s.frames.length} frames</span>
              </button>
              <div className={styles.meta}>
                <span className={styles.no}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{s.couple}</h3>
                  <p className={styles.place}>
                    {s.place} — {s.date}
                  </p>
                  <p className={styles.excerpt}>{s.excerpt}</p>
                </div>
              </div>
            </article>
          );
        })}
        <div className={styles.end}>
          <a href="#portfolio" className="btn btn-ghost">
            Explore the portfolio
          </a>
        </div>
      </div>
    </section>
  );
}
