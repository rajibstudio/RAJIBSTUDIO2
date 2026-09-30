"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { SERVICES } from "@/lib/content";
import { photo } from "@/lib/gallery";
import { Reveal } from "../ui/Reveal";
import styles from "./services.module.css";

/** Services index. On desktop a framed photograph follows the cursor across the list. */
export function Services() {
  const root = useRef<HTMLElement>(null);
  const float = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const mover = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);

  useGSAP(
    () => {
      if (!float.current) return;
      mover.current = {
        x: gsap.quickTo(float.current, "x", { duration: 0.7, ease: "power3.out" }),
        y: gsap.quickTo(float.current, "y", { duration: 0.7, ease: "power3.out" }),
      };
    },
    { scope: root },
  );

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !root.current) return;
    const r = root.current.getBoundingClientRect();
    mover.current?.x(e.clientX - r.left);
    mover.current?.y(e.clientY - r.top);
  };

  return (
    <section ref={root} id="services" className={`section ${styles.services}`} onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
      <div className="container">
        <Reveal className={styles.head}>
          <span className="eyebrow" data-reveal>
            Services
          </span>
          <h2 className="display" data-reveal>
            One team, <em>every frame</em> of your wedding.
          </h2>
        </Reveal>
        <Reveal as="ol" className={styles.list} stagger={0.06}>
          {SERVICES.map((s, i) => (
            <li key={s.title} data-reveal data-active={active === i} onPointerEnter={() => setActive(i)}>
              <span className={styles.no}>{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
              <div className={styles.thumb}>
                <Image src={photo(s.img).src} alt="" fill sizes="30vw" />
              </div>
            </li>
          ))}
        </Reveal>
      </div>
      <div ref={float} className={styles.float} data-visible={active !== null} aria-hidden="true">
        {SERVICES.map((s, i) => (
          <Image key={s.title} src={photo(s.img).src} alt="" fill sizes="320px" data-on={active === i} />
        ))}
      </div>
    </section>
  );
}
