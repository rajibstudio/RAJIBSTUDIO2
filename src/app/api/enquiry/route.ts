import { NextResponse } from "next/server";

/**
 * Booking enquiry endpoint.
 * Validates input server-side. Wire `deliver()` to your email/CRM provider
 * (e.g. Resend, SES, a Google Sheet webhook) via environment variables.
 */
type Enquiry = {
  name: string;
  partner?: string;
  phone: string;
  email: string;
  date: string;
  venue: string;
  package?: string;
  message?: string;
  company?: string; // honeypot
};

const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function deliver(e: Enquiry) {
  const hook = process.env.ENQUIRY_WEBHOOK_URL;
  if (hook) {
    const res = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return;
  }
  // No delivery configured (local/dev): log so nothing is silently lost.
  console.info("[enquiry]", JSON.stringify(e));
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const e: Enquiry = {
    name: clean(body.name, 120),
    partner: clean(body.partner, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 200),
    date: clean(body.date, 20),
    venue: clean(body.venue, 200),
    package: clean(body.package, 60),
    message: clean(body.message, 3000),
    company: clean(body.company, 100),
  };

  // Bots fill the hidden field — pretend success.
  if (e.company) return NextResponse.json({ ok: true });

  const errors: string[] = [];
  if (!e.name) errors.push("name");
  if (!/^[0-9 +()-]{8,}$/.test(e.phone)) errors.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)) errors.push("email");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) errors.push("date");
  if (!e.venue) errors.push("venue");
  if (errors.length) return NextResponse.json({ error: `Please check: ${errors.join(", ")}` }, { status: 422 });

  try {
    await deliver(e);
  } catch (err) {
    console.error("[enquiry] delivery failed", err);
    return NextResponse.json({ error: "We couldn't send that right now — please call or WhatsApp us." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
