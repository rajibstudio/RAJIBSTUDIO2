/**
 * Where the site is hosted. On GitHub Pages the site lives under /<repo-name>,
 * so the deploy workflow sets both values. Locally they fall back to the root.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rajibstudio.github.io/RAJIBSTUDIO2").replace(/\/$/, "");

/** Prefix a /public path with the base path (plain <img>, textures and fetches don't get it automatically). */
export const asset = (path: string) => `${BASE_PATH}${path}`;
