/**
 * Re-renders the 8 hero shots to /public/images/scene/shot-N.jpg
 * (used as the instant poster and as the no-WebGL fallback on phones).
 *
 *   npm run build && npm start            # in one terminal
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/capture-stills.mjs        # in another
 *
 * Works on machines without a GPU (SwiftShader) — just slowly (~1–2 min per shot).
 * If a frame comes out mostly black (a rare software-renderer glitch), run it again.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const shots = (process.argv[2] ?? "0,1,2,3,4,5,6,7").split(",").map(Number);

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(`${BASE}/?capture=${s}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__sceneReady === true, null, { timeout: 180000 });
  const data = await page.evaluate(() => document.querySelector("canvas")?.toDataURL("image/jpeg", 0.82));
  if (!data) throw new Error(`No canvas for shot ${s}`);
  writeFileSync(`public/images/scene/shot-${s}.jpg`, Buffer.from(data.split(",")[1], "base64"));
  console.log(`shot ${s} ✓`);
  await page.close();
}
await browser.close();
