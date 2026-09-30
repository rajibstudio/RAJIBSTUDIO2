import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", textAlign: "center", padding: "6rem var(--gutter)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.6rem" }}>
        <span className="eyebrow">404 · Frame not found</span>
        <h1 className="display">
          This moment <em>wasn’t captured.</em>
        </h1>
        <p className="lede">The page you’re looking for has moved or never existed.</p>
        <Link href="/" className="btn btn-gold">
          Back to the studio
        </Link>
      </div>
    </main>
  );
}
