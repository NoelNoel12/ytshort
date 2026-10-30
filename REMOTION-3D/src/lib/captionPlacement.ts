// Subtitles must never cover the main action. Each scene declares its main action as world-space
// spheres per frame. For every caption page we project those spheres with the scene camera over the
// page's lifetime and pick the first band (default, low, high) that stays clear of them.
import * as THREE from "three";
import { theme } from "../theme";
import type { CaptionPage, Timeline } from "../types";
import type { ActionVol, SceneDef } from "../scenes/types";
import type { CamShot } from "../world/CameraRig";

export type Rect = { x0: number; x1: number; y0: number; y1: number }; // fractions, y from the top

const ASPECT = theme.width / theme.height;
const cam = new THREE.PerspectiveCamera(40, ASPECT, 0.1, 1200);
const v = new THREE.Vector3();

// Screen rectangle covered by a sphere (centre projection plus projected radius)
export const projectSphere = (shot: CamShot, c: [number, number, number], r: number): Rect | null => {
  cam.fov = shot.fov;
  cam.aspect = ASPECT;
  cam.position.set(...shot.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(...shot.target);
  if (shot.roll) cam.rotateZ(shot.roll);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  v.set(...c);
  const dist = v.distanceTo(cam.position);
  v.project(cam);
  if (v.z > 1 || dist < 0.01) return null; // behind the camera
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(shot.fov / 2));
  const ry = r / (dist * tanHalf) / 2;
  const rx = ry / ASPECT;
  const cx = (v.x + 1) / 2;
  const cy = (1 - v.y) / 2 - (shot.shiftY ?? 0);
  return { x0: cx - rx, x1: cx + rx, y0: cy - ry, y1: cy + ry };
};

// Screen rectangle of a world box: the bounds of its projected corners
const projectBox = (shot: CamShot, [lo, hi]: [[number, number, number], [number, number, number]]): Rect | null => {
  let out: Rect | null = null;
  for (let k = 0; k < 8; k++) {
    const p: [number, number, number] = [k & 1 ? hi[0] : lo[0], k & 2 ? hi[1] : lo[1], k & 4 ? hi[2] : lo[2]];
    const r = projectSphere(shot, p, 0);
    if (!r) continue;
    out = out ? { x0: Math.min(out.x0, r.x0), x1: Math.max(out.x1, r.x1), y0: Math.min(out.y0, r.y0), y1: Math.max(out.y1, r.y1) } : r;
  }
  return out;
};

export const projectVolume = (shot: CamShot, v: ActionVol): Rect | null => ("box" in v ? projectBox(shot, v.box) : projectSphere(shot, v.c, v.r));

const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

// Rough text box of a page: width from character count, one line or two balanced lines
export const captionRect = (page: CaptionPage, bottom: number): Rect => {
  const c = theme.caption;
  const words = page.words.map((w) => w.text);
  const usable = theme.width * (1 - theme.safe.left - theme.safe.right);
  const lineW = (ws: string[]) => ws.join(" ").length * c.fontSize * 0.58 + 2 * c.stroke;
  let lines = 1;
  let wPx = lineW(words);
  if (wPx > usable) {
    // text-wrap: balance picks the split with the shortest longest line
    lines = 2;
    wPx = Math.min(...words.slice(1).map((_, k) => Math.max(lineW(words.slice(0, k + 1)), lineW(words.slice(k + 1)))));
    wPx = Math.min(usable, wPx * 1.06);
  }
  const w = wPx / theme.width;
  const h = (lines * c.fontSize * 1.12 + c.stroke) / theme.height;
  const mid = theme.safe.left + (1 - theme.safe.left - theme.safe.right) / 2;
  return { x0: mid - w / 2, x1: mid + w / 2, y0: bottom - h, y1: bottom };
};

export type Placement = { bottoms: number[]; report: { page: number; scene: string; text: string; chosen: number; overlapDefault: number; overlapChosen: number }[] };

// Screen areas taken by other text at a frame (title card in S1, end card at the end)
export type Overlay = (frame: number) => Rect[];

export const placeCaptions = (tl: Timeline, scenes: SceneDef[], step = 2, overlays: Overlay = () => []): Placement => {
  const c = theme.caption;
  const bands = [c.bottomPct, ...c.altBottoms];
  const bottoms: number[] = [];
  const report: Placement["report"] = [];
  for (const page of tl.pages) {
    const si = tl.scenes.findIndex((s) => s.id === page.scene);
    const def = scenes[si];
    const s = tl.scenes[si];
    const scores = bands.map(() => 0);
    if (def?.action) {
      for (let f = page.showFrom; f < page.showTo; f += step) {
        const ctx = { frame: f, from: s.fromFrame, to: s.toFrame, dur: s.toFrame - s.fromFrame };
        const shot = def.camera(ctx);
        const vols = def.action(ctx);
        bands.forEach((b, k) => {
          const rect = captionRect(page, b);
          // Pad the caption box a little so it never kisses the action
          const pad = { x0: rect.x0 - 0.01, x1: rect.x1 + 0.01, y0: rect.y0 - 0.012, y1: rect.y1 + 0.012 };
          for (const vol of vols) {
            const r = projectVolume(shot, vol);
            if (r) scores[k] += overlap(pad, r);
          }
          // Other text counts double: subtitles must never sit on the title or the end card
          for (const o of overlays(f)) scores[k] += 2 * overlap(pad, o);
        });
      }
    }
    // First band with no overlap at all, otherwise the least covered one
    let chosen = scores.findIndex((x) => x === 0);
    if (chosen < 0) chosen = scores.indexOf(Math.min(...scores));
    bottoms.push(bands[chosen]);
    report.push({ page: page.i, scene: page.scene, text: page.words.map((w) => w.text).join(" "), chosen: bands[chosen], overlapDefault: scores[0], overlapChosen: scores[chosen] });
  }
  return { bottoms, report };
};

