// Temporal flicker check: second-derivative energy |f[t-1] - 2 f[t] + f[t+1]| per block.
// Usage: tsx scripts/checkFlicker.ts short-02 [--frames 10] [--scale 1] [--scenes S1,S5] [--mode static|moving|actors]
//   static : camera and content frozen. Any pixel change at all is temporal noise (must be 0).
//   moving : content frozen, camera moves. Reversal energy finds shimmer and aliasing.
//   actors : camera locked, content animates. For visual review of characters (blinks are expected).
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import { getVideo } from "../data/videos";
import type { Timeline } from "../src/types";
import { OUT, PROJECT, arg, dataFile, opt, readJson, run, writeJson } from "./paths";

const id = arg(0, "short-02")!;
const cfg = getVideo(id);
const tl = readJson<Timeline>(dataFile(id, "timeline"));
const N = Number(opt("frames") ?? 10);
const scale = Number(opt("scale") ?? 1);
const only = opt("scenes")?.split(",");
const BLOCK = 32;
const RATIO = 6; // block flagged when its peak is RATIO x the scene median...
const ABS = 4; // ...and above this many grey levels (mean reversal per pixel)

const browserExecutable = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: (process.env.REMOTION_GL ?? "swangle") as "swangle" | "angle" };

// A quiet window per scene: frames around the midpoint, away from triggers when possible
const windowFor = (sid: string): [number, number] => {
  const sc = tl.scenes.find((s) => s.id === sid)!;
  const trig = tl.triggers.filter((t) => t.scene === sid).map((t) => t.frame);
  let best = Math.round((sc.fromFrame + sc.toFrame) / 2);
  let bestGap = -1;
  for (let s = sc.fromFrame + 10; s + N < sc.toFrame - 10; s += 3) {
    const gap = Math.min(...trig.map((t) => Math.min(Math.abs(t - s), Math.abs(t + 30 - s))));
    if (gap > bestGap) {
      bestGap = gap;
      best = s;
    }
  }
  return [best, best + N - 1];
};

const serveUrl = await bundle({ entryPoint: path.join(PROJECT, "src", "index.ts") });
const MODE = (opt("mode") ?? (process.argv.includes("--moving") ? "moving" : "static")) as "static" | "moving" | "actors";
const composition = await selectComposition({ serveUrl, id: cfg.compositionId, inputProps: { hideText: true, lockCamera: null, freezeAt: null }, browserExecutable, chromiumOptions });
const W = Math.round(composition.width * scale);
const H = Math.round(composition.height * scale);
const root = path.join(OUT, `flicker-${MODE}`);
fs.rmSync(root, { recursive: true, force: true });
const report: Record<string, unknown>[] = [];
let totalFlagged = 0;

for (const sc of tl.scenes) {
  if (only && !only.includes(sc.id)) continue;
  const [a, b] = windowFor(sc.id);
  const dir = path.join(root, sc.id);
  fs.mkdirSync(dir, { recursive: true });
  const inputProps = { hideText: true, lockCamera: MODE === "moving" ? null : a, freezeAt: MODE === "actors" ? null : a };
  await renderFrames({
    composition: { ...composition, props: inputProps },
    serveUrl,
    inputProps,
    frameRange: [a, b],
    outputDir: dir,
    imageFormat: "png",
    scale,
    browserExecutable,
    chromiumOptions,
    concurrency: 2,
    onStart: () => undefined,
    onFrameUpdate: () => undefined,
  });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  // Read frames as grey buffers (ffmpeg decodes each PNG)
  const frames = files.map((f) => greyFrame(path.join(dir, f)));
  const bw = Math.floor(W / BLOCK);
  const bh = Math.floor(H / BLOCK);
  // peakD2: raw |f[t-1] - 2 f[t] + f[t+1]| (moving edges raise it too)
  // peakRev: the part of it that comes from reversals (up then down), which is what flicker looks like
  const peakD2 = new Float32Array(bw * bh);
  const peakRev = new Float32Array(bw * bh);
  for (let t = 1; t < frames.length - 1; t++) {
    const p = frames[t - 1];
    const c = frames[t];
    const n = frames[t + 1];
    for (let by = 0; by < bh; by++) {
      for (let bx = 0; bx < bw; bx++) {
        let sum = 0;
        let rev = 0;
        for (let y = by * BLOCK; y < (by + 1) * BLOCK; y++) {
          const row = y * W;
          for (let x = bx * BLOCK; x < (bx + 1) * BLOCK; x++) {
            const i = row + x;
            const d1 = c[i] - p[i];
            const d2 = n[i] - c[i];
            sum += Math.abs(d2 - d1);
            if (d1 * d2 < 0) rev += Math.min(Math.abs(d1), Math.abs(d2));
          }
        }
        const k = by * bw + bx;
        const v = sum / (BLOCK * BLOCK);
        const r = rev / (BLOCK * BLOCK);
        if (v > peakD2[k]) peakD2[k] = v;
        if (r > peakRev[k]) peakRev[k] = r;
      }
    }
  }
  // Oscillation: pixels whose temporal difference flips sign 3+ times in the window.
  // A thin object passing by flips once; shimmer and z-fighting flip again and again.
  const osc = new Float32Array(bw * bh);
  const OSC_T = 6;
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let hits = 0;
      for (let y = by * BLOCK; y < (by + 1) * BLOCK; y++) {
        const row = y * W;
        for (let x = bx * BLOCK; x < (bx + 1) * BLOCK; x++) {
          const i = row + x;
          let flips = 0;
          let last = 0;
          for (let t = 1; t < frames.length; t++) {
            const d = frames[t][i] - frames[t - 1][i];
            if (Math.abs(d) <= OSC_T) continue;
            const sgn = d > 0 ? 1 : -1;
            if (last && sgn !== last) flips++;
            last = sgn;
          }
          if (flips >= 3) hits++;
        }
      }
      osc[by * bw + bx] = hits / (BLOCK * BLOCK);
    }
  }
  const med = (a: Float32Array) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const median = med(peakRev);
  const medianD2 = med(peakD2);
  const sorted = [...peakRev].sort((x, y) => x - y);
  const flagged: { bx: number; by: number; v: number }[] = [];
  // Flag: strong reversals that also oscillate (at least 2 percent of the block's pixels)
  peakRev.forEach((v, i) => {
    if (v > Math.max(ABS, median * RATIO) && osc[i] >= 0.02) flagged.push({ bx: i % bw, by: Math.floor(i / bw), v });
  });
  const oscMax = Math.max(...osc);
  flagged.sort((x, y) => y.v - x.v);
  totalFlagged += flagged.length;
  // 200 percent crops of the worst blocks over 3 consecutive frames, for a visual check
  const crops: string[] = [];
  for (const [k, fb] of flagged.slice(0, 4).entries()) {
    const cx = Math.max(0, fb.bx * BLOCK - 48);
    const cy = Math.max(0, fb.by * BLOCK - 48);
    const out = path.join(dir, `crop${k}.png`);
    const mid = files[Math.floor(files.length / 2)];
    run("ffmpeg", ["-v", "error", "-y", "-i", path.join(dir, mid), "-vf", `crop=128:128:${cx}:${cy},scale=256:256:flags=neighbor`, out]);
    crops.push(path.relative(PROJECT, out));
  }
  // 8 consecutive frames, ground area, 200 percent
  const strip = path.join(dir, "strip8.png");
  const eight = files.slice(0, 8).map((f) => path.join(dir, f));
  const inputs = eight.flatMap((f) => ["-i", f]);
  const crop = `crop=${Math.round(W * 0.3)}:${Math.round(H * 0.12)}:${Math.round(W * 0.35)}:${Math.round(H * 0.5)},scale=iw*2:ih*2:flags=neighbor`;
  run("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", eight.map((_, i) => `[${i}]${crop}[c${i}]`).join(";") + ";" + eight.map((_, i) => `[c${i}]`).join("") + `hstack=inputs=${eight.length}`, strip]);
  const worst = flagged[0]?.v ?? sorted[sorted.length - 1];
  // Static mode: count every changed pixel block (exact determinism)
  const changed = [...peakD2].filter((v) => v > 0.05).length;
  if (MODE === "static") totalFlagged += changed > 0 ? changed : 0;
  if (MODE === "static") console.log(`${sc.id} frames ${a}-${b} (static): changed blocks ${changed}, max d2 ${Math.max(...peakD2).toFixed(2)}`);
  else console.log(`${sc.id} frames ${a}-${b} (${MODE}): d2 median ${medianD2.toFixed(2)} max ${Math.max(...peakD2).toFixed(1)} | reversal median ${median.toFixed(2)} worst ${Math.max(...peakRev).toFixed(2)} | oscillating px max ${(oscMax * 100).toFixed(1)}% | flagged ${flagged.length}${flagged.length ? " at " + flagged.slice(0, 5).map((q) => `(${q.bx * BLOCK},${q.by * BLOCK})=${q.v.toFixed(1)}`).join(" ") : ""}`);
  report.push({ scene: sc.id, frames: [a, b], d2: { median: medianD2, max: Math.max(...peakD2) }, reversal: { median, worst }, oscillationMax: oscMax, flagged: flagged.slice(0, 20), crops, strip: path.relative(PROJECT, strip) });
}
writeJson(path.join(root, "report.json"), report);
if (MODE === "actors") console.log(`checkFlicker (actors): ${totalFlagged} blocks with reversals, review crops in ${path.relative(PROJECT, root)} (blinks and pecks are expected)`);
else console.log(totalFlagged ? `checkFlicker (${MODE}): FAILED, ${totalFlagged} blocks flagged, see ${path.relative(PROJECT, root)}` : `checkFlicker (${MODE}): PASSED (no block stands out)`);
process.exit(MODE !== "actors" && totalFlagged ? 1 : 0);

function greyFrame(file: string): Uint8Array {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${file}`);
  return new Uint8Array(r.stdout);
}
