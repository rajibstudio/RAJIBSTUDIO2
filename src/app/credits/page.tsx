import type { Metadata } from "next";
import Link from "next/link";
import { PHOTOS } from "@/lib/gallery";

export const metadata: Metadata = { title: "Image credits — Rajib Studio" };

const LICENSES: Record<string, string> = {
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  CC0: "https://creativecommons.org/publicdomain/zero/1.0/",
};

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
        {PHOTOS.map((p) => {
          const licenseUrl = LICENSES[p.credit.license];
          return (
            <li key={p.id}>
              <a href={p.credit.source} target="_blank" rel="noreferrer" style={{ color: "var(--ivory)" }}>
                {p.credit.title}
              </a>{" "}
              — {p.credit.author || "Unknown"},{" "}
              {licenseUrl ? (
                <a href={licenseUrl} target="_blank" rel="noreferrer license" style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>
                  {p.credit.license}
                </a>
              ) : (
                p.credit.license
              )}
            </li>
          );
        })}
      </ol>
      <p style={{ marginTop: "3rem", fontSize: "0.85rem", color: "var(--ivory-faint)" }}>
        Photographs have been resized, re-encoded and cropped for the web. Adapted CC BY-SA images are shared under the same licence. The 3D hero scene is
        procedurally generated in code.
      </p>
    </main>
  );
}
