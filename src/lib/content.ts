/**
 * All site copy lives here so the studio can edit words without touching layout.
 * Contact details, prices and testimonials are placeholders — replace before launch.
 */

/**
 * Preview mode: keep this `true` while the phone, WhatsApp and email below are placeholders.
 * While it's on, the booking form doesn't send anything, the call/email links are plain text
 * (so visitors never message a stranger's number), and search engines are asked not to index the site.
 * Set it to `false` once the real details are in.
 */
export const PREVIEW = true;

export const BRAND = {
  name: "RAJIB STUDIO",
  taglineBn: "স্মৃতিকে করি চিরস্থায়ী",
  taglineEn: "Cinematic Wedding Photography & Films",
  city: "Kolkata",
  reach: "Kolkata · Across India · Destination",
  phone: "+91 90000 00000",
  phoneHref: "tel:+919000000000",
  whatsapp: "919000000000",
  email: "hello@rajibstudio.in",
  instagram: "https://instagram.com/rajibstudio",
  instagramHandle: "@rajibstudio",
  youtube: "https://youtube.com/@rajibstudio",
  facebook: "https://facebook.com/rajibstudio",
};

export const NAV = [
  { href: "#about", label: "Studio" },
  { href: "#stories", label: "Stories" },
  { href: "/biye-bari/", label: "3D Tour" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#films", label: "Films" },
  { href: "#packages", label: "Packages" },
  { href: "#contact", label: "Contact" },
];

export const ABOUT = {
  eyebrow: "The Studio",
  title: ["We don’t stage weddings.", "We witness them."],
  body: [
    "Rajib Studio is a Kolkata-based team of photographers and filmmakers who treat every wedding like a feature film — lit with intention, framed with restraint, and edited with feeling.",
    "From the hush of Shubho Drishti to the last laughter of Bashor Raat, we move quietly through your day, so that years from now you can live it again, exactly as it felt.",
  ],
  quoteBn: "প্রতিটি মুহূর্ত, চিরকালের জন্য।",
  quoteEn: "Every moment, for always.",
  stats: [
    { value: 650, suffix: "+", label: "Weddings documented" },
    { value: 14, suffix: "", label: "Years behind the lens" },
    { value: 38, suffix: "", label: "Cities & destinations" },
  ],
};

export type Story = {
  slug: string;
  couple: string;
  place: string;
  date: string;
  excerpt: string;
  cover: string;
  frames: string[];
};

export const STORIES: Story[] = [
  {
    slug: "ananya-arjun",
    couple: "Ananya & Arjun",
    place: "Rajbari, North Kolkata",
    date: "February 2026",
    excerpt: "A 200-year-old courtyard, a thousand diyas, and a Shubho Drishti that made the whole family cry.",
    cover: "g000",
    frames: ["g000", "g001", "g048", "g004"],
  },
  {
    slug: "srijita-debarghya",
    couple: "Srijita & Debarghya",
    place: "Shantiniketan",
    date: "December 2025",
    excerpt: "Tagore songs at dawn, turmeric at noon, and a mandap under the old chhatim trees.",
    cover: "g050",
    frames: ["g050", "g039", "g217", "g011"],
  },
  {
    slug: "moumita-rahul",
    couple: "Moumita & Rahul",
    place: "Heritage Villa, Chandannagar",
    date: "November 2025",
    excerpt: "Riverside lamps, a candlelit Mala Badal, and a groom who couldn’t stop smiling.",
    cover: "g098",
    frames: ["g098", "g092", "g081", "g082"],
  },
  {
    slug: "trisha-aniket",
    couple: "Trisha & Aniket",
    place: "Udaipur (Destination)",
    date: "March 2026",
    excerpt: "A Bengali wedding by the lake — sola mukut meets Mewar gold.",
    cover: "g006",
    frames: ["g006", "g007", "g051", "g042"],
  },
];

export type Film = {
  id: string;
  title: string;
  couple: string;
  runtime: string;
  kind: string;
  /** Poster + teaser frames (photo ids). */
  frames: string[];
  /** Optional real footage: an mp4 URL or a YouTube id. When absent, a still-frame teaser reel plays. */
  videoSrc?: string;
  youtubeId?: string;
  lines: string[];
};

export const FILMS: Film[] = [
  {
    id: "rajbari",
    title: "The Rajbari Vows",
    couple: "Ananya & Arjun",
    runtime: "4:12",
    kind: "Wedding Film",
    frames: ["g000", "g001", "g048", "g004", "g051"],
    lines: ["The house had waited two hundred years.", "For one glance.", "For one promise."],
  },
  {
    id: "holud",
    title: "Golden Hour, Gaye Holud",
    couple: "Srijita & Debarghya",
    runtime: "2:48",
    kind: "Highlight Teaser",
    frames: ["g217", "g078", "g003", "g039"],
    lines: ["Turmeric, laughter,", "and the song her mother sang."],
  },
  {
    id: "river",
    title: "Lamps on the River",
    couple: "Moumita & Rahul",
    runtime: "6:30",
    kind: "Feature Film",
    frames: ["g098", "g092", "g081", "g049"],
    lines: ["Seven circles.", "Seven promises.", "One lifetime."],
  },
];

export const SERVICES = [
  { title: "Wedding Photography", text: "Complete editorial coverage of every ritual, from Aiburobhat to Bou Bhaat.", img: "g006" },
  { title: "Candid Photography", text: "Unposed, unseen moments — the glances and laughter between the rituals.", img: "g039" },
  { title: "Traditional Photography", text: "Timeless family portraits and ritual documentation, beautifully lit.", img: "g040" },
  { title: "Cinematography", text: "Multi-camera cinema capture with prime lenses, gimbals and pro audio.", img: "g048" },
  { title: "Pre-Wedding Photography", text: "Concept-driven shoots across heritage Kolkata and dream destinations.", img: "g081" },
  { title: "Wedding Films", text: "Story-first teasers, highlight films and full-length documentaries.", img: "g098" },
  { title: "Drone Cinematography", text: "Licensed aerial cinematography for venues, baraat and grand exits.", img: "g092" },
  { title: "Album Design & Printing", text: "Hand-bound heirloom albums on archival fine-art paper.", img: "g041" },
];

export const PACKAGES = [
  {
    name: "Heritage",
    tagline: "Intimate ceremonies",
    price: "₹ 85,000",
    note: "starting from",
    features: [
      "1 lead photographer + 1 candid",
      "Wedding day coverage (up to 10 hrs)",
      "400+ hand-edited photographs",
      "Cinematic highlight teaser (1–2 min)",
      "Private online gallery",
    ],
    featured: false,
  },
  {
    name: "Signature",
    tagline: "Our most loved",
    price: "₹ 1,65,000",
    note: "starting from",
    features: [
      "2 photographers + 2 cinematographers",
      "Gaye Holud, Wedding & Reception",
      "800+ hand-edited photographs",
      "Highlight film (4–6 min) + teaser",
      "Drone coverage (where permitted)",
      "30-page heirloom album",
    ],
    featured: true,
  },
  {
    name: "Royal Cinema",
    tagline: "The full feature",
    price: "₹ 2,95,000",
    note: "starting from",
    features: [
      "Full creative team, all events",
      "Pre-wedding concept shoot",
      "Feature documentary (20–30 min)",
      "Same-day edit for the reception",
      "Two 40-page fine-art albums",
      "Destination travel planning",
    ],
    featured: false,
  },
];

export const TESTIMONIALS = [
  {
    quote: "We didn’t notice them for a single moment — and yet they were everywhere. Our film made three generations of the family cry.",
    name: "Ananya & Arjun",
    place: "Kolkata",
  },
  {
    quote: "Rajib da understood the rituals better than we did. Every photograph feels like a painting from my grandmother’s house.",
    name: "Srijita & Debarghya",
    place: "Shantiniketan",
  },
  {
    quote: "The album arrived and my father held it for an hour without speaking. That’s the only review that matters.",
    name: "Moumita & Rahul",
    place: "Chandannagar",
  },
];

export const SOCIAL_FEED = ["g019", "g011", "g078", "g044", "g225", "g057", "g092", "g047", "g089", "g021", "g082", "g054"];
