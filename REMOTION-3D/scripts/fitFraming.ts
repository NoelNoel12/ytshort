// Search the smallest dolly-back k and lens shift s per scene so that every subtitle page clears the
// main action and labels never sit on it. Prints the best pair per scene; apply it with framed().
// Usage: tsx scripts/fitFraming.ts S2 S4
import { captionRect, placeCaptions, projectVolume } from "../src/lib/captionPlacement";
import { SCENES_04 } from "../src/scenes/short04/index";
import { TL } from "../src/scenes/short04/tl";
import { TEXT_OVERLAYS } from "../src/compositions/Short04";
import { framed } from "../src/world/CameraRig";
import type { SceneDef } from "../src/scenes/types";

import { theme } from "../src/theme";
// Clean-style label box: centred text at the top, one or two lines
const labelRect = (text: string) => {
  const size = theme.label.fontSize + 4;
  const usable = 1 - theme.safe.left - theme.safe.right;
  const w0 = (text.length * size * 0.56 + 24) / theme.width;
  const lines = w0 > usable ? 2 : 1;
  const w = Math.min(usable, lines === 2 ? w0 * 0.55 : w0);
  const mid = theme.safe.left + usable / 2;
  const y0 = theme.label.topPct - 0.01;
  return { x0: mid - w / 2, x1: mid + w / 2, y0, y1: y0 + (lines * size * 1.15 + 16) / theme.height };
};
const hit = (a: { x0: number; x1: number; y0: number; y1: number }, b: typeof a) => Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0);

const score = (si: number, def: SceneDef) => {
  const scenes = SCENES_04.map((d, k) => (k === si ? def : d));
  const pl = placeCaptions(TL, scenes, 1, TEXT_OVERLAYS);
  const s = TL.scenes[si];
  let bad = 0;
  let cap = 0;
  for (const page of TL.pages.filter((p) => p.scene === s.id)) {
    const rect = captionRect(page, pl.bottoms[page.i]);
    const pad = { x0: rect.x0 - 0.01, x1: rect.x1 + 0.01, y0: rect.y0 - 0.012, y1: rect.y1 + 0.012 };
    for (let f = page.showFrom; f < page.showTo; f++) {
      const ctx = { frame: f, from: s.fromFrame, to: s.toFrame, dur: s.toFrame - s.fromFrame };
      const shot = def.camera(ctx);
      for (const v of def.action?.(ctx) ?? []) {
        const r = projectVolume(shot, v);
        if (r && hit(pad, r)) { bad++; cap++; }
      }
    }
  }
  // Labels (top chips) must not sit on the action either
  for (const l of TL.labels.filter((l) => l.scene === s.id)) {
    const LABEL = labelRect(l.segments.map((g) => g.text).join(""));
    for (let f = l.fromFrame; f < l.toFrame; f++) {
      const ctx = { frame: f, from: s.fromFrame, to: s.toFrame, dur: s.toFrame - s.fromFrame };
      const shot = def.camera(ctx);
      for (const v of def.action?.(ctx) ?? []) {
        const r = projectVolume(shot, v);
        if (r && r.y1 > 0 && hit(LABEL, r)) bad++;
      }
    }
  }
  if (process.env.DETAIL) console.log(`    caption ${cap}, label ${bad - cap}`);
  return { cap, label: bad - cap };
};

for (const id of process.argv.slice(2)) {
  const si = TL.scenes.findIndex((s) => s.id === id);
  const base = SCENES_04[si];
  if (process.env.PAIR) {
    const [k, s2] = process.env.PAIR.split(",").map(Number);
    process.env.DETAIL = "1";
    score(si, { ...base, camera: framed(base.camera, k, s2) });
    continue;
  }
  const results: { k: number; s: number; cap: number; label: number }[] = [];
  for (let k = 1; k <= 2.001; k += 0.05) {
    for (let s = 0; s <= 0.2001; s += 0.01) {
      results.push({ k: +k.toFixed(2), s: +s.toFixed(2), ...score(si, { ...base, camera: framed(base.camera, k, s) }) });
    }
  }
  const now = results.find((r) => r.k === 1 && r.s === 0)!;
  const fmt = (r: (typeof results)[number]) => `k${r.k} s${r.s} (cap ${r.cap}, label ${r.label})`;
  // Subtitles first (the rule), labels second, then the smallest change
  const ranked = [...results].sort((a, b) => a.cap - b.cap || a.label - b.label || a.k - b.k || a.s - b.s);
  const capClean = results.filter((r) => r.cap === 0).sort((a, b) => a.k - b.k || a.s - b.s);
  // Pareto view: for each k the best caption-clean shift
  const front = [...new Set(results.map((r) => r.k))].map((k) => results.filter((r) => r.k === k && r.cap === 0).sort((a, b) => a.label - b.label || a.s - b.s)[0]).filter(Boolean);
  console.log(`  ${id} front: ${front.map((r) => `k${r.k}/s${r.s}/L${r.label}`).join(" ")}`);
  console.log(`${id}: now ${fmt(now)} | smallest caption-clean ${capClean[0] ? fmt(capClean[0]) : "none"} | ranked ${ranked.slice(0, 2).map(fmt).join(", ")}`);
}
