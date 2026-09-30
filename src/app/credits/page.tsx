import type { Metadata } from "next";
import Link from "next/link";
import { PHOTOS } from "@/lib/gallery";

export const metadata: Metadata = { title: "Image credits — Rajib Studio" };

export default function Credits() {
  return (
    <main className="container" style={{ padding: "8rem var(--gutter) 6rem", maxWidth: 960 }}>
      <Link href="/" className="eyebrow">
        Back to the studio
      </Link>
      <h1 className="display" style={{ margin: "2rem 0 1rem" }}>
        Image credits
      </h1>
      <p className="lede" style={{ marginBottom: "3rem" }}>
        Placeholder photography is used under open licences from Wikimedia Commons until the studio’s own portfolio is loaded. Thank you to every photographer below.
      </p>
      <ol style={{ display: "grid", gap: "1rem", paddingLeft: "1.2rem", color: "var(--ivory-dim)" }}>
        {PHOTOS.map((p) => (
          <li key={p.id}>
            <a href={p.credit.source} target="_blank" rel="noreferrer" style={{ color: "var(--ivory)" }}>
              {p.credit.title}
            </a>{" "}
            — {p.credit.author || "Unknown"}, {p.credit.license}
          </li>
        ))}
      </ol>
      <p style={{ marginTop: "3rem", fontSize: "0.85rem", color: "var(--ivory-faint)" }}>
        CC BY-SA images are shared under the same licence. The 3D hero scene is procedurally generated in code.
      </p>
    </main>
  );
}
