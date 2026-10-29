// Render a list of stills with a single bundle (fast visual checks).
// Usage: tsx scripts/stills.ts <CompositionId> <frames: 0,30,90 | S1 | all-scenes> [--out dir] [--scale 0.5] [--sheet]
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { OUT, PROJECT, opt, flag, run } from "./paths";
import type { Timeline } from "../src/types";

const comp = process.argv[2] ?? "Short02";
const spec = process.argv[3] ?? "0";
const outDir = opt("out") ?? path.join(OUT, "stills", comp);
const scale = Number(opt("scale") ?? 0.5);

const tl = JSON.parse(fs.readFileSync(path.join(PROJECT, "data", "short-02.timeline.json"), "utf8")) as Timeline;
const framesFor = (s: string): number[] => {
  if (/^S\d+$/.test(s)) {
    // Start, middle and end of one scene plus each action trigger
    const sc = tl.scenes.find((x) => x.id === s)!;
    const trig = tl.triggers.filter((t) => t.scene === s).map((t) => t.frame + 6);
    return [sc.fromFrame + 2, ...trig, Math.round((sc.fromFrame + sc.toFrame) / 2), sc.toFrame - 3].sort((a, b) => a - b);
  }
  if (s === "all-scenes") return tl.scenes.flatMap((sc) => [sc.fromFrame + 3, Math.round((sc.fromFrame + sc.toFrame) / 2), sc.toFrame - 4]);
  return s.split(",").map(Number);
};
const frames = [...new Set(spec.split("+").flatMap(framesFor))];

const browserExecutable = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: (process.env.REMOTION_GL ?? "swangle") as "swangle" | "angle" };

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.join(PROJECT, "src", "index.ts") });
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable, chromiumOptions });
fs.mkdirSync(outDir, { recursive: true });
const files: string[] = [];
for (const frame of frames) {
  const file = path.join(outDir, `f${String(frame).padStart(4, "0")}.jpg`);
  const s0 = Date.now();
  await renderStill({ composition, serveUrl, output: file, frame, imageFormat: "jpeg", jpegQuality: 88, scale, browserExecutable, chromiumOptions });
  files.push(file);
  console.log(`frame ${frame} -> ${path.relative(PROJECT, file)} (${((Date.now() - s0) / 1000).toFixed(1)} s)`);
}
if (flag("sheet") && files.length > 1) {
  const cols = Math.min(5, files.length);
  const sheet = path.join(outDir, "sheet.jpg");
  const inputs = files.flatMap((f) => ["-i", f]);
  const n = files.length;
  const layout = files.map((_, i) => `${(i % cols) === 0 ? "0" : Array.from({ length: i % cols }, (_, k) => `w${k}`).join("+")}_${Math.floor(i / cols) === 0 ? "0" : Array.from({ length: Math.floor(i / cols) }, (_, k) => `h${k * cols}`).join("+")}`).join("|");
  run("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", `xstack=inputs=${n}:layout=${layout}:fill=black`, "-q:v", "3", sheet]);
  console.log(`sheet -> ${path.relative(PROJECT, sheet)}`);
}
console.log(`stills: ${frames.length} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
