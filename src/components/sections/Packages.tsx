import { PACKAGES } from "@/lib/content";
import { Reveal } from "../ui/Reveal";
import styles from "./packages.module.css";

export function Packages() {
  return (
    <section id="packages" className={`section ${styles.packages}`}>
      <div className="container">
        <Reveal className={styles.head}>
          <span className="eyebrow" data-reveal>
            Premium Wedding Packages
          </span>
          <h2 className="display" data-reveal>
            Crafted collections, <em>tailored to you.</em>
          </h2>
          <p className="lede" data-reveal>
            Every wedding is quoted personally. These collections are a starting point — we will shape the coverage around your rituals, venues and family.
          </p>
        </Reveal>
        <Reveal className={styles.grid} stagger={0.12} y={60}>
          {PACKAGES.map((p) => (
            <article key={p.name} className={styles.card} data-featured={p.featured} data-reveal>
              {p.featured && <span className={styles.badge}>Most loved</span>}
              <header>
                <span className={styles.tag}>{p.tagline}</span>
                <h3>{p.name}</h3>
              </header>
              <div className={styles.price}>
                <small>{p.note}</small>
                <strong>{p.price}</strong>
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href="#contact" className={`btn ${p.featured ? "btn-gold" : "btn-ghost"}`}>
                Enquire for your date
              </a>
            </article>
          ))}
        </Reveal>
        <p className={styles.note}>Travel & stay outside Kolkata billed at actuals · Custom multi-day and destination quotes available.</p>
      </div>
    </section>
  );
}
