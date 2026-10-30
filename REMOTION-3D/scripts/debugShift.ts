// Debug helper: for every page that still touches the action, how far the action must move up
// to clear the low bands, and how much headroom the action has above it.
import { captionRect, placeCaptions, projectVolume } from "../src/lib/captionPlacement";
import { SCENES_04 } from "../src/scenes/short04/index";
import { TL } from "../src/scenes/short04/tl";
import { TEXT_OVERLAYS } from "../src/compositions/Short04";

const placement = placeCaptions(TL, SCENES_04, 1, TEXT_OVERLAYS);
for (const page of TL.pages) {
  const si = TL.scenes.findIndex((s) => s.id === page.scene);
  const def = SCENES_04[si];
  const s = TL.scenes[si];
  const parts: string[] = [];
  let anyHit = false;
  for (const b of [0.715, 0.81]) {
    const rect = captionRect(page, b);
    let need = -1;
    let head = 1;
    let worst = -1;
    for (let f = page.showFrom; f < page.showTo; f++) {
      const ctx = { frame: f, from: s.fromFrame, to: s.toFrame, dur: s.toFrame - s.fromFrame };
      const shot = def.camera(ctx);
      for (const v of def.action?.(ctx) ?? []) {
        const r = projectVolume(shot, v);
        if (!r) continue;
        head = Math.min(head, r.y0);
        if (Math.min(rect.x1 + 0.01, r.x1) > Math.max(rect.x0 - 0.01, r.x0) && r.y1 > rect.y0 - 0.012 && r.y0 < rect.y1 + 0.012) {
          const n = r.y1 - (rect.y0 - 0.012);
          if (n > need) { need = n; worst = f; }
        }
      }
    }
    if (b === placement.bottoms[page.i] && need > 0) anyHit = true;
    parts.push(`band ${b}: need ${need.toFixed(3)} at f${worst}, headroom ${head.toFixed(3)}`);
  }
  const chosen = placement.bottoms[page.i];
  if (anyHit || placement.report[page.i].overlapChosen > 0) console.log(`page ${page.i} ${page.scene} f${page.showFrom}-${page.showTo} chosen ${chosen} | ${parts.join(" | ")}`);
}
