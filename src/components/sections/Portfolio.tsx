"use client";

import Image from "next/image";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATEGORIES, PHOTOS, type Category } from "@/lib/gallery";
import { useLightbox } from "../ui/Lightbox";
import { Reveal } from "../ui/Reveal";
import styles from "./portfolio.module.css";

gsap.registerPlugin(Flip, ScrollTrigger);

export function Portfolio() {
  const [filter, setFilter] = useState<"All" | Category>("All");
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const open = useLightbox();
  const list = useMemo(() => (filter === "All" ? PHOTOS : PHOTOS.filter((p) => p.category === filter)), [filter]);

  const choose = (c: "All" | Category) => {
    if (c === filter) return;
    if (grid.current) flipState.current = Flip.getState(grid.current.querySelectorAll("[data-item]"));
    setFilter(c);
  };

  useLayoutEffect(() => {
    if (!flipState.current || !grid.current) return;
    Flip.from(flipState.current, {
      targets: grid.current.querySelectorAll("[data-item]"),
      duration: 0.9,
      ease: "expo.inOut",
      absolute: true,
      stagger: 0.015,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.7, delay: 0.3 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.94, duration: 0.4 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
    flipState.current = null;
  }, [filter]);

  return (
    <section id="portfolio" className={`section ${styles.portfolio}`}>
      <div className="container">
        <Reveal className={styles.head}>
          <span className="eyebrow" data-reveal>
            Photography Portfolio
          </span>
          <h2 className="display" data-reveal>
            Light, ritual <em>&amp; the unrepeatable.</em>
          </h2>
          <div className={styles.filters} role="tablist" aria-label="Filter photographs" data-reveal>
            {CATEGORIES.map((c) => (
              <button key={c} type="button" role="tab" aria-selected={filter === c} data-active={filter === c} onClick={() => choose(c)}>
                {c}
                <sup>{c === "All" ? PHOTOS.length : PHOTOS.filter((p) => p.category === c).length}</sup>
              </button>
            ))}
          </div>
        </Reveal>

        <div ref={grid} className={styles.grid}>
          {list.map((p, i) => (
            <button
              key={p.id}
              type="button"
              data-item
              data-photo={p.id}
              className={styles.item}
              style={{ aspectRatio: `${p.width} / ${p.height}` }}
              onClick={(e) => open(list, i, e.currentTarget)}
              aria-label={`Open photograph: ${p.caption}`}
            >
              <Image src={p.src} alt={p.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw" />
              <span className={styles.cap}>
                <em>{p.category}</em>
                {p.caption}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
