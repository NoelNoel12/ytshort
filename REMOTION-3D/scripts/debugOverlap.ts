// Debug helper: per band, which action volumes hit a caption page and where they sit on screen.
// Usage: tsx scripts/debugOverlap.ts 1 5 19
import { captionRect, placeCaptions, projectVolume } from "../src/lib/captionPlacement";
import { SCENES_04 } from "../src/scenes/short04/index";
import { TL } from "../src/scenes/short04/tl";
import { TEXT_OVERLAYS } from "../src/compositions/Short04";
import { theme } from "../src/theme";

const want = process.argv.slice(2).map(Number);
const placement = placeCaptions(TL, SCENES_04, 1, TEXT_OVERLAYS);
const bands = [theme.caption.bottomPct, ...theme.caption.altBottoms];
for (const page of TL.pages.filter((p) => want.includes(p.i))) {
  const si = TL.scenes.findIndex((s) => s.id === page.scene);
  const def = SCENES_04[si];
  const s = TL.scenes[si];
  console.log(`page ${page.i} ${page.scene} "${page.words.map((w) => w.text).join(" ")}" f ${page.showFrom}-${page.showTo} chosen ${placement.bottoms[page.i]}`);
  for (const b of bands) {
    const rect = captionRect(page, b);
    const hits: string[] = [];
    for (let f = page.showFrom; f < page.showTo; f++) {
      const ctx = { frame: f, from: s.fromFrame, to: s.toFrame, dur: s.toFrame - s.fromFrame };
      const shot = def.camera(ctx);
      (def.action?.(ctx) ?? []).forEach((v, k) => {
        const r = projectVolume(shot, v);
        if (r && Math.min(rect.x1, r.x1) > Math.max(rect.x0, r.x0) && Math.min(rect.y1, r.y1) > Math.max(rect.y0, r.y0)) hits.push(`f${f}v${k}[${r.y0.toFixed(2)}-${r.y1.toFixed(2)} x${r.x0.toFixed(2)}-${r.x1.toFixed(2)}]`);
      });
    }
    console.log(`  band ${b} rect y ${rect.y0.toFixed(3)}-${rect.y1.toFixed(3)} x ${rect.x0.toFixed(2)}-${rect.x1.toFixed(2)}: ${hits.length} ${hits.slice(0, 6).join(" ")}`);
  }
}
