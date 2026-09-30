"use client";

import { useState } from "react";
import { BRAND, PACKAGES, PREVIEW } from "@/lib/content";
import { Reveal } from "../ui/Reveal";
import styles from "./contact.module.css";

/**
 * Optional form backend for the static site (e.g. a Formspree or Web3Forms endpoint),
 * set at build time. Without it, enquiries are handed to WhatsApp with every detail pre-filled.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT;

type Status = "idle" | "sending" | "sent" | "error";
type Data = Record<string, string>;

function compose(d: Data) {
  const date = d.date ? new Date(`${d.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
  const lines = [
    "Namaskar Rajib Studio! I'd like to check your availability.",
    "",
    `Name: ${d.name}${d.partner ? ` & ${d.partner}` : ""}`,
    `Wedding date: ${date}`,
    `Venue / city: ${d.venue}`,
    d.package ? `Collection: ${d.package}` : null,
    `Phone: ${d.phone}`,
    `Email: ${d.email}`,
    d.message ? `\n${d.message}` : null,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

const whatsappLink = (text: string) => `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
const emailLink = (text: string) => `mailto:${BRAND.email}?subject=${encodeURIComponent("Wedding enquiry")}&body=${encodeURIComponent(text)}`;

/** A link when the contact details are real; plain text while the site is in preview. */
function ContactLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  if (PREVIEW) return <span>{children}</span>;
  return external ? (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <a href={href}>{children}</a>
  );
}

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [via, setVia] = useState<"whatsapp" | "form">("whatsapp");
  const [message, setMessage] = useState("");
  const [previewHit, setPreviewHit] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries()) as Data;
    if (data.company) return; // honeypot: bots fill the hidden field
    if (PREVIEW) {
      setPreviewHit(true);
      return;
    }
    const text = compose(data);
    setMessage(text);

    if (!ENDPOINT) {
      // Opened synchronously inside the submit handler, so pop-up blockers allow it.
      window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
      setVia("whatsapp");
      setStatus("sent");
      form.reset();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(`Form service responded ${res.status}`);
      setVia("form");
      setStatus("sent");
      form.reset();
    } catch {
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
                <ContactLink href={BRAND.phoneHref}>{BRAND.phone}</ContactLink>
              </dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <ContactLink href={`https://wa.me/${BRAND.whatsapp}`} external>
                  {PREVIEW ? BRAND.phone : "Message us"}
                </ContactLink>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <ContactLink href={`mailto:${BRAND.email}`}>{BRAND.email}</ContactLink>
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
              {via === "whatsapp" ? (
                <p>WhatsApp is opening with your details filled in — just press send. Prefer email? Use the button below.</p>
              ) : (
                <p>Your enquiry has reached the studio. We’ll check the calendar and write back within a day.</p>
              )}
              <a className="btn btn-gold" href={whatsappLink(message)} target="_blank" rel="noreferrer">
                {via === "whatsapp" ? "Open WhatsApp again" : "Continue on WhatsApp"}
              </a>
              {via === "whatsapp" && (
                <a className="btn btn-ghost" href={emailLink(message)}>
                  Send by email instead
                </a>
              )}
              <button type="button" className={styles.again} onClick={() => setStatus("idle")}>
                Send another enquiry
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSubmit} noValidate data-reveal>
              <div className={styles.row}>
                <Field label="Your name" name="name" required autoComplete="name" />
                <Field label="Partner’s name" name="partner" autoComplete="off" />
              </div>
              <div className={styles.row}>
                <Field label="Phone / WhatsApp" name="phone" type="tel" required autoComplete="tel" pattern="[\d\s+\(\)\-]{8,}" />
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
                  {status === "sending" ? "Sending…" : ENDPOINT ? "Check availability" : "Send on WhatsApp"}
                </button>
                {status === "error" && (
                  <p className={styles.error} role="alert">
                    We couldn’t send that right now.{" "}
                    <a href={whatsappLink(message)} target="_blank" rel="noreferrer">
                      Send it on WhatsApp
                    </a>{" "}
                    instead.
                  </p>
                )}
              </div>
              {PREVIEW && (
                <p className={styles.preview} data-hit={previewHit} role={previewHit ? "status" : undefined}>
                  Preview site — online booking opens soon, so enquiries aren’t being received yet.
                </p>
              )}
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
