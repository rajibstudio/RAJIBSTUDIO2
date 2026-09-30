import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});
const bengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rajibstudio.in"),
  title: "RAJIB STUDIO — Cinematic Wedding Photography & Films | Kolkata",
  description:
    "স্মৃতিকে করি চিরস্থায়ী — Rajib Studio creates cinematic Bengali & Indian wedding photography, candid portraits and wedding films in Kolkata and destinations worldwide.",
  keywords: ["Bengali wedding photographer", "Kolkata wedding photography", "wedding films", "candid photography", "cinematography", "pre-wedding shoot"],
  openGraph: {
    title: "RAJIB STUDIO — Cinematic Wedding Photography & Films",
    description: "স্মৃতিকে করি চিরস্থায়ী — cinematic wedding photography & films.",
    images: ["/images/scene/shot-0.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${bengali.variable}`}>
      <body>{children}</body>
    </html>
  );
}
