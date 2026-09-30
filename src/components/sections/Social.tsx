"use client";

import Image from "next/image";
import { BRAND, SOCIAL_FEED } from "@/lib/content";
import { photo } from "@/lib/gallery";
import { useLightbox } from "../ui/Lightbox";
import { Reveal } from "../ui/Reveal";
import styles from "./social.module.css";

/**
 * Social gallery. Static curated feed for now; to go live, replace SOCIAL_FEED with
 * posts fetched server-side from the Instagram Graph API (keeps tokens off the client).
 */
export function Social() {
  const open = useLightbox();
  const feed = SOCIAL_FEED.map(photo);
  return (
    <section id="social" className={`section ${styles.social}`}>
      <div className="container">
        <Reveal className={styles.head}>
          <div data-reveal>
            <span className="eyebrow">On Instagram</span>
            <h2 className="display">
              <a href={BRAND.instagram} target="_blank" rel="noreferrer">
                {BRAND.instagramHandle}
              </a>
            </h2>
          </div>
          <a data-reveal href={BRAND.instagram} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Follow the journal
          </a>
        </Reveal>
        <Reveal className={styles.grid} stagger={0.04} y={24}>
          {feed.map((p, i) => (
            <button key={p.id} type="button" data-reveal data-photo={p.id} className={styles.tile} onClick={(e) => open(feed, i, e.currentTarget)} aria-label={`Open: ${p.caption}`}>
              <Image src={p.src} alt={p.alt} fill sizes="(max-width: 700px) 33vw, 16vw" />
              <span className={styles.overlay} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" />
                </svg>
              </span>
            </button>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
