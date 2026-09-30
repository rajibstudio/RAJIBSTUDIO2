# RAJIB STUDIO — স্মৃতিকে করি চিরস্থায়ী

Cinematic wedding photography & films website. Next.js 16 · React 19 · React Three Fiber · GSAP · Lenis.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## The hero

A procedurally built Bengali wedding (chhadnatala mandap, alpana floor, banana plants, marigold and rajnigandha, havan kund, diyas, fairy lights) with a bride, groom and a working photographer. Everything is generated in code, so the 3D scene ships no model or texture files.

- **8 shots** (`src/components/hero/shots.ts`): wide, behind-the-photographer, over-the-shoulder, couple portrait, bride, groom, 135mm bokeh, lens close-up. Scroll moves between them. Each shot holds before the next move starts, and moves follow a crane-style arc.
- **Director** (`three/Director.tsx`): a virtual cinema camera with hand-held drift, mouse parallax and a rack focus that lags slightly behind the move. It also drives the DOF focus distance and bokeh, and feeds the HUD's AF reticle, which tracks the subject on screen.
- **Photographer** (`three/Photographer.tsx`): IK legs and arms, a loop of compose → burst → review the LCD → raise the camera again, a weight shift, and a dip for lower angles.
- **Mirrorless camera** (`three/MirrorlessCamera.tsx`): a 9-blade aperture iris that stops down on every release and opens wide in the lens shot, a rotating focus ring, an AF-assist lamp, and a rear LCD that shows the frame just taken. The octabox (softbox flash) fires with each shutter.
- **Post-processing**: depth of field, bloom, subtle chromatic aberration, AgX tone mapping, vignette and grain.

### Performance tiers (`src/lib/device.ts`)

| Tier | Who | What |
|---|---|---|
| high | desktop, capable GPU | full scene, reflections, 2k shadows, DPR ≤ 1.75 |
| medium | tablets / modest laptops | fewer flowers and particles, no reflector, lighter DOF, DPR ≤ 1.25 |
| low | phones, low memory, software GL, reduced-motion, save-data | **no WebGL**: pre-rendered stills of the same shots, with a CSS push-in, focus pull and the same HUD |

- The WebGL bundle is code-split and loaded only for the high and medium tiers.
- Dense details (thousands of instanced flowers, particles) mount on idle, after the first frame.
- A poster (`shot-0.jpg`) shows instantly, then cross-fades to the live scene.
- `PerformanceMonitor` lowers quality at runtime if the frame rate drops.
- Rendering pauses whenever the hero is off-screen.

Debug URL flags: `?tier=high|medium|low` forces a tier, `?capture=N` renders shot N alone, and `?nofx` turns off post-processing.

Re-render the fallback stills after changing the scene: `node scripts/capture-stills.mjs` (see the header of that file).

## Structure

```
src/app                 layout (fonts), page, /credits, /api/enquiry
src/lib                 content.ts (all copy), gallery.ts (photo metadata), device.ts (tiers)
src/components/hero     Hero, ViewfinderHUD, HeroFallback, shots, shared hero state
src/components/three    Experience (Canvas), Director, Mandap, Flowers, Couple, Photographer,
                        MirrorlessCamera, Lighting, Atmosphere, PostFX, procedural textures/geometry
src/components/sections About, Stories, Portfolio, Films, Services, Packages, Testimonials, Social, Contact, Footer
src/components/ui       SmoothScroll (Lenis+GSAP), Lightbox (FLIP), Reveal, Nav
```

## Before launch — replace placeholders

- **Photographs** in `public/images/gallery` are openly licensed Wikimedia Commons placeholders (credited on `/credits`). Swap in the studio's own work and update `src/lib/gallery.ts` and `gallery-credits.json`.
- **Contact details, prices, testimonials, stats, social handles**: `src/lib/content.ts`.
- **Films**: add `videoSrc` (mp4) or `youtubeId` to a film in `content.ts`. Until then, a still-frame teaser reel plays.
- **Enquiries**: set `ENQUIRY_WEBHOOK_URL` (Zapier, Make, a Sheets script, a CRM, etc.). Without it, enquiries are only logged on the server.
- **Instagram**: the feed is curated and static. To make it live, fetch posts server-side from the Graph API.
- **Realism**: the bride, groom and photographer are stylised figures built from primitives. For truly photoreal people, commission rigged GLB characters (scanned or MetaHuman-style, Draco/KTX2-compressed) and load them with `useGLTF` in place of `Couple`/`Photographer`. The rig, shot list, lighting and camera system stay as they are.
