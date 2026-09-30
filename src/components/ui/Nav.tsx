"use client";

import { useEffect, useState } from "react";
import { NAV } from "@/lib/content";
import styles from "./nav.module.css";

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const onScroll = () => {
      const end = hero ? hero.offsetTop + hero.offsetHeight - window.innerHeight * 1.05 : window.innerHeight;
      setSolid(window.scrollY > end);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={styles.nav} data-solid={solid} data-open={open}>
      <a href="#top" className={styles.logo} aria-label="Rajib Studio — home">
        <span className={styles.mark} aria-hidden="true">
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
            {Array.from({ length: 7 }).map((_, i) => (
              <path key={i} d="M20 20 L20 6.5 A13.5 13.5 0 0 1 30.2 11.2 Z" fill="none" stroke="currentColor" strokeWidth="0.6" transform={`rotate(${(i * 360) / 7} 20 20)`} />
            ))}
          </svg>
        </span>
        <span className={styles.word}>
          RAJIB <em>STUDIO</em>
        </span>
      </a>

      <nav className={styles.links} aria-label="Primary">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
            {n.label}
          </a>
        ))}
      </nav>

      <a href="#contact" className={`btn btn-gold btn-sm ${styles.cta}`}>
        Book Your Date
      </a>

      <button className={styles.burger} type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <i />
        <i />
      </button>
    </header>
  );
}
