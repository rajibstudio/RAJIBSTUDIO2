import Link from "next/link";
import { BRAND, NAV, PREVIEW } from "@/lib/content";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <p className={styles.word} aria-label={BRAND.name}>
            RAJIB <em>STUDIO</em>
          </p>
          <p className={`bn ${styles.bn}`} lang="bn">
            {BRAND.taglineBn}
          </p>
        </div>
        <div className={styles.cols}>
          <nav aria-label="Footer">
            {NAV.map((n) =>
              n.href.startsWith("/") ? (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ) : (
                <a key={n.href} href={n.href}>
                  {n.label}
                </a>
              ),
            )}
          </nav>
          <div className={styles.social}>
            <a href={BRAND.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={BRAND.youtube} target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a href={BRAND.facebook} target="_blank" rel="noreferrer">
              Facebook
            </a>
          </div>
          <div className={styles.contact}>
            {/* Plain text while the contact details are placeholders (see PREVIEW in content.ts) */}
            {PREVIEW ? <span>{BRAND.phone}</span> : <a href={BRAND.phoneHref}>{BRAND.phone}</a>}
            {PREVIEW ? <span>{BRAND.email}</span> : <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>}
            <span>{BRAND.reach}</span>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Rajib Studio. All rights reserved.</span>
          <Link href="/credits">Image credits</Link>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
