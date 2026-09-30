import credits from "./gallery-credits.json";

/**
 * Image library.
 *
 * NOTE: The photographs in /assets/gallery are openly licensed placeholders
 * sourced from Wikimedia Commons (see /credits). Replace them with Rajib Studio's
 * own work before going live — swap the files and keep this metadata in sync.
 * Everything else (layout, lightbox, stories) reads from here.
 *
 * `src` below is the key the image loader understands ("/images/gallery/<name>.jpg");
 * the files actually served are the WebP sizes made by scripts/optimize-images.mjs.
 */
export type Category = "Rituals" | "Portraits" | "Candid" | "Couples" | "Details";

export type Photo = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  category: Category;
  credit: { author: string; license: string; source: string; title: string };
};

type Meta = { alt: string; caption: string; category: Category };

const META: Record<string, Meta> = {
  "g000.jpg": { alt: "Bengali bride hiding her face behind betel leaves during Shubho Drishti", caption: "Shubho Drishti — the first glance", category: "Rituals" },
  "g001.jpg": { alt: "Groom in a white topor smiling as the bride is carried in", caption: "The moment before the reveal", category: "Rituals" },
  "g003.jpg": { alt: "Bride in yellow with floral jewellery", caption: "Gaye Holud, in marigold light", category: "Portraits" },
  "g004.jpg": { alt: "Groom applying sindoor to the bride under a red veil", caption: "Sindoor Daan", category: "Rituals" },
  "g006.jpg": { alt: "Bengali bride in a sola mukut with lowered gaze", caption: "Kone Dekha — a quiet portrait", category: "Portraits" },
  "g007.jpg": { alt: "Bride with flower garlands as family lifts her veil", caption: "Under the veil", category: "Rituals" },
  "g010.jpg": { alt: "Bride covering her face with hennaed hands", caption: "Before the ceremony", category: "Portraits" },
  "g011.jpg": { alt: "Bride's hands wearing shankha and pola bangles", caption: "Shankha, pola, and gold", category: "Details" },
  "g019.jpg": { alt: "Bengali bride with chandan art and nath", caption: "Chandan & nath", category: "Portraits" },
  "g021.jpg": { alt: "Portrait of a Bengali bride looking towards the light", caption: "Window light", category: "Portraits" },
  "g032.jpg": { alt: "Close portrait of a Bengali bride in red and gold", caption: "Red, gold, forever", category: "Portraits" },
  "g039.jpg": { alt: "Bride laughing in her mukut and garlands", caption: "Unscripted laughter", category: "Candid" },
  "g040.jpg": { alt: "Bengali bride framed by an ornate gold chair", caption: "The throne of the evening", category: "Portraits" },
  "g041.jpg": { alt: "Close-up of hennaed hands with rings and bangles", caption: "Heirlooms", category: "Details" },
  "g042.jpg": { alt: "Profile portrait of a Bengali bride with maang tikka", caption: "Profile in gold", category: "Portraits" },
  "g044.jpg": { alt: "Smiling Bengali bride with chandan decoration", caption: "A smile for the ages", category: "Portraits" },
  "g047.jpg": { alt: "Black and white portrait of a bride", caption: "Monochrome vows", category: "Portraits" },
  "g048.jpg": { alt: "Bride seated by the sacred fire during the ceremony", caption: "Yagna — the sacred fire", category: "Rituals" },
  "g049.jpg": { alt: "Bride in a red saree against a dark background", caption: "Crimson", category: "Portraits" },
  "g050.jpg": { alt: "Bride smiling with garlands and mukut", caption: "Joy, framed", category: "Candid" },
  "g051.jpg": { alt: "Bride with sindoor-dusted face smiling", caption: "After the sindoor", category: "Rituals" },
  "g054.jpg": { alt: "Bride during wedding rituals in Kolkata", caption: "Rituals of Kolkata", category: "Candid" },
  "g057.jpg": { alt: "Bride glancing aside during rituals", caption: "A stolen glance", category: "Candid" },
  "g076.jpg": { alt: "Hands and feet in a turmeric ritual", caption: "Turmeric blessings", category: "Details" },
  "g078.jpg": { alt: "Couple in yellow at a haldi celebration with sparkles", caption: "Haldi, golden hour", category: "Couples" },
  "g081.jpg": { alt: "Couple embracing, groom in a pink turban", caption: "Forehead to forehead", category: "Couples" },
  "g082.jpg": { alt: "Couple's hands with gold embroidery", caption: "Hand in hand", category: "Details" },
  "g089.jpg": { alt: "Kangna ceremony with hands in a bowl of milk", caption: "Kangna games", category: "Details" },
  "g092.jpg": { alt: "Newly wed couple smiling together", caption: "Just married", category: "Couples" },
  "g098.jpg": { alt: "Couple seated at the wedding mandap in warm light", caption: "Saat paak, seven promises", category: "Couples" },
  "g217.jpg": { alt: "Bride having turmeric applied during haldi", caption: "Gaye Holud", category: "Candid" },
  "g225.jpg": { alt: "Bride's hand covered in intricate mehendi", caption: "Mehendi", category: "Details" },
  "g227.jpg": { alt: "Mehendi-clad hands of a Bengali bride", caption: "The art of waiting", category: "Details" },
  "g229.jpg": { alt: "Mehendi being applied to the bride's hand", caption: "Lines of love", category: "Details" },
};

export const PHOTOS: Photo[] = credits.map((c) => {
  const meta = META[c.file] ?? { alt: "Wedding photograph", caption: "", category: "Candid" as Category };
  return {
    id: c.file.replace(".jpg", ""),
    src: `/images/gallery/${c.file}`,
    width: c.width,
    height: c.height,
    ...meta,
    credit: { author: c.author, license: c.license, source: c.source, title: c.title },
  };
});

export const photo = (id: string): Photo => {
  const p = PHOTOS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown photo ${id}`);
  return p;
};

export const CATEGORIES: ("All" | Category)[] = ["All", "Rituals", "Portraits", "Candid", "Couples", "Details"];
