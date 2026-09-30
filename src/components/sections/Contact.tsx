"use client";

import { useState } from "react";
import { BRAND, PACKAGES } from "@/lib/content";
import { Reveal } from "../ui/Reveal";
import styles from "./contact.module.css";

type Status = "idle" | "sending" | "sent" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [summary, setSummary] = useState<string>("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setSummary(`Namaskar ${data.name}! I'd like to book Rajib Studio for ${data.date} at ${data.venue}.`);
      setStatus("sent");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section id="contact" className={`section ${styles.contact}`}>
      <div className={`container ${styles.grid}`}>
        <Reveal className={styles.info}>
          <span className="eyebrow" data-reveal>
            Book Your Date
          </span>
          <h2 className="display" data-reveal>
            Let’s make your
            <br />
            <em>memories eternal.</em>
          </h2>
          <p className="bn" lang="bn" data-reveal>
            {BRAND.taglineBn}
          </p>
          <p className="lede" data-reveal>
            We take a limited number of weddings each season so every couple gets our full attention. Tell us about your day — we reply within 24 hours.
          </p>
          <dl className={styles.details} data-reveal>
            <div>
              <dt>Call</dt>
              <dd>
                <a href={BRAND.phoneHref}>{BRAND.phone}</a>
              </dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer">
                  Message us
                </a>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
              </dd>
            </div>
            <div>
              <dt>Studio</dt>
              <dd>{BRAND.reach}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal className={styles.formWrap} y={50}>
          {status === "sent" ? (
            <div className={styles.thanks} role="status">
              <h3>Thank you.</h3>
              <p>Your enquiry has reached the studio. We’ll check the calendar and write back within a day.</p>
              <a className="btn btn-gold" href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(summary)}`} target="_blank" rel="noreferrer">
                Continue on WhatsApp
              </a>
              <button type="button" className="btn btn-ghost" onClick={() => setStatus("idle")}>
                Send another
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSubmit} noValidate data-reveal>
              <div className={styles.row}>
                <Field label="Your name" name="name" required autoComplete="name" />
                <Field label="Partner’s name" name="partner" autoComplete="off" />
              </div>
              <div className={styles.row}>
                <Field label="Phone / WhatsApp" name="phone" type="tel" required autoComplete="tel" pattern="[0-9 +()-]{8,}" />
                <Field label="Email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className={styles.row}>
                <Field label="Wedding date" name="date" type="date" required min={today} />
                <Field label="Venue / city" name="venue" required />
              </div>
              <label className={styles.field}>
                <span>Collection</span>
                <select name="package" defaultValue="">
                  <option value="">Not sure yet</option>
                  {PACKAGES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} — {p.price}
                    </option>
                  ))}
                  <option value="Custom">Custom / destination</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Tell us about your wedding</span>
                <textarea name="message" rows={4} placeholder="Events, guest count, the moments that matter most…" />
              </label>
              {/* Honeypot */}
              <input type="text" name="company" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
              <div className={styles.actions}>
                <button type="submit" className="btn btn-gold" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Check availability"}
                </button>
                {status === "error" && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {props.required && <b aria-hidden="true"> *</b>}
      </span>
      <input {...props} />
    </label>
  );
}
