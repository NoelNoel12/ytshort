// Rule check: subtitles never cover the main action, and never sit on the title card or end card.
// Projects each scene's action spheres with its camera at every frame of every caption page.
// Usage: tsx scripts/checkTextOverlap.ts short-04
import { getVideo } from "../data/videos";
import { arg } from "./paths";
import { captionRect, placeCaptions, projectVolume } from "../src/lib/captionPlacement";
import type { SceneDef } from "../src/scenes/types";
import type { Timeline } from "../src/types";

const id = arg(0, "short-04")!;
getVideo(id);
const mods: Record<string, () => Promise<{ scenes: SceneDef[]; tl: Timeline; overlays: (f: number) => { x0: number; x1: number; y0: number; y1: number }[] }>> = {
  "short-04": async () => {
    const s = await import("../src/scenes/short04/index");
    const t = await import("../src/scenes/short04/tl");
    const c = await import("../src/compositions/Short04");
    return { scenes: s.SCENES_04, tl: t.TL, overlays: c.TEXT_OVERLAYS };
  },
};
const { scenes, tl, overlays } = await mods[id]();
const placement = placeCaptions(tl, scenes, 1, overlays);
let bad = 0;
let moved = 0;
const rows: string[] = [];
for (const page of tl.pages) {
  const b = placement.bottoms[page.i];
  if (Math.abs(b - 0.715) > 1e-6) moved++;
  const si = tl.scenes.findIndex((s) => s.id === page.scene);
  const def = scenes[si];
  const s = tl.scenes[si];
  const rect = captionRect(page, b);
  let hitAction = 0;
  let hitText = 0;
  for (let f = page.showFrom; f < page.showTo; f++) {
    const ctx = { frame: f, from: s.fromFrame, to: s.toFrame, dur: s.toFrame - s.fromFrame };
    const shot = def.camera(ctx);
    for (const v of def.action?.(ctx) ?? []) {
      const r = projectVolume(shot, v);
      if (r && Math.min(rect.x1, r.x1) > Math.max(rect.x0, r.x0) && Math.min(rect.y1, r.y1) > Math.max(rect.y0, r.y0)) hitAction++;
    }
    for (const o of overlays(f)) if (Math.min(rect.x1, o.x1) > Math.max(rect.x0, o.x0) && Math.min(rect.y1, o.y1) > Math.max(rect.y0, o.y0)) hitText++;
  }
  if (hitAction || hitText) {
    bad++;
    rows.push(`  page ${page.i} ${page.scene} "${page.words.map((w) => w.text).join(" ")}" at ${b}: action hits ${hitAction} frames, text hits ${hitText}`);
  }
}
for (const r of rows) console.log(r);
const bands = new Map<number, number>();
for (const b of placement.bottoms) bands.set(b, (bands.get(b) ?? 0) + 1);
console.log(`  pages per band (bottom edge): ${[...bands].sort((a, b) => b[0] - a[0]).map(([b, n]) => `${b} x ${n}`).join(", ")}`);
console.log(`checkTextOverlap ${id}: ${tl.pages.length} pages, ${moved} moved off the default band, ${bad} still touching the action or other text`);
process.exit(bad ? 1 : 0);
