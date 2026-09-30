import Link from "next/link";
import { asset } from "@/lib/site";
import { Reveal } from "../ui/Reveal";
import styles from "./tourTeaser.module.css";

/** Homepage invitation into the interactive 3D biye bari (/biye-bari/). */
export function TourTeaser() {
  return (
    <section id="biye-bari" className={`section ${styles.teaser}`}>
      <div className={`container ${styles.grid}`}>
        <Reveal className={styles.text}>
          <span className="eyebrow" data-reveal>
            Interactive 3D · Biye Bari
          </span>
          <h2 className="display" data-reveal>
            Walk into <em>the wedding.</em>
          </h2>
          <p className={`bn ${styles.bn}`} lang="bn" data-reveal>
            বিয়েবাড়িতে স্বাগতম
          </p>
          <p className="lede" data-reveal>
            Explore a Bengali wedding house the way you would a game. Walk the lit-up lane, step through the Shubho Bibaho gate, and stand beside the chhadnatala while our
            photographer works. Then visit the reception stage, the feast and the tattwa gifts.
          </p>
          <ul className={styles.points} data-reveal>
            <li>Walk freely, or take the guided tour</li>
            <li>Mouse &amp; keyboard on a computer, touch on a phone</li>
            <li>Take a photo inside the 3D world</li>
          </ul>
          <div data-reveal>
            <Link href="/biye-bari/" className="btn btn-gold">
              Enter the 3D Biye Bari
            </Link>
          </div>
        </Reveal>
        <Link href="/biye-bari/" className={styles.preview} aria-label="Enter the 3D Biye Bari">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/images/tour/preview.jpg")} alt="The 3D biye bari at night: a house covered in golden string lights behind a Shubho Bibaho gate" loading="lazy" />
          <span className={styles.badge}>
            <i /> Live 3D
          </span>
          <span className={styles.play} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </Link>
      </div>
    </section>
  );
}
