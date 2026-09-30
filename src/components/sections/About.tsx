"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ABOUT } from "@/lib/content";
import { photo } from "@/lib/gallery";
import { Reveal } from "../ui/Reveal";
import styles from "./about.module.css";

export function About() {
  const root = useRef<HTMLElement>(null);
  const main = photo("g006");
  const detail = photo("g011");

  useGSAP(
    () => {
      // Parallax between the two photographs
      gsap.to("[data-par='slow']", { yPercent: -8, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.to("[data-par='fast']", { yPercent: -28, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      // Counters
      root.current?.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 2.4,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("en-IN")),
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="about" className={`section ${styles.about}`}>
      <div className={`container ${styles.grid}`}>
        <Reveal className={styles.text}>
          <span className="eyebrow" data-reveal>
            {ABOUT.eyebrow}
          </span>
          <h2 className="display" data-reveal>
            {ABOUT.title[0]}
            <br />
            <em>{ABOUT.title[1]}</em>
          </h2>
          {ABOUT.body.map((p) => (
            <p key={p} className="lede" data-reveal>
              {p}
            </p>
          ))}
          <div className={styles.stats} data-reveal>
            {ABOUT.stats.map((s) => (
              <div key={s.label}>
                <strong>
                  <span data-count={s.value}>0</span>
                  {s.suffix}
                </strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <p className={styles.signature} data-reveal>
            — Rajib, <span>founder &amp; lead photographer</span>
          </p>
        </Reveal>

        <div className={styles.visual}>
          <figure className={styles.main} data-par="slow">
            <Image src={main.src} alt={main.alt} width={main.width} height={main.height} sizes="(max-width: 900px) 90vw, 40vw" />
          </figure>
          <figure className={styles.detail} data-par="fast">
            <Image src={detail.src} alt={detail.alt} width={detail.width} height={detail.height} sizes="(max-width: 900px) 50vw, 22vw" />
          </figure>
          <blockquote className={styles.quote}>
            <p className="bn" lang="bn">
              {ABOUT.quoteBn}
            </p>
            <span>{ABOUT.quoteEn}</span>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
