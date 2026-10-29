// Measure steady-state render speed for a frame range with optional perf flags.
// Usage: tsx scripts/bench.ts <from> <to> [--scale 0.5] [--perf noShadows,noKampung] [--concurrency 1]
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import { OUT, PROJECT, opt } from "./paths";

const from = Number(process.argv[2] ?? 0);
const to = Number(process.argv[3] ?? 29);
const scale = Number(opt("scale") ?? 0.5);
const concurrency = Number(opt("concurrency") ?? 1);
const perf = Object.fromEntries((opt("perf") ?? "").split(",").filter(Boolean).map((k) => [k, true]));
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: (process.env.REMOTION_GL ?? "swangle") as "swangle" };
const serveUrl = await bundle({ entryPoint: path.join(PROJECT, "src", "index.ts") });
const inputProps = { hideText: false, lockCamera: null, perf, dpr: Number(opt("dpr") ?? 1) };
const composition = await selectComposition({ serveUrl, id: "Short02", inputProps, browserExecutable, chromiumOptions });
const dir = path.join(OUT, "bench");
fs.rmSync(dir, { recursive: true, force: true });
const stamps: number[] = [];
const t0 = Date.now();
await renderFrames({
  composition: { ...composition, props: inputProps },
  serveUrl,
  inputProps,
  frameRange: [from, to],
  outputDir: dir,
  imageFormat: "jpeg",
  scale,
  concurrency,
  browserExecutable,
  chromiumOptions,
  onStart: () => undefined,
  onFrameUpdate: () => stamps.push(Date.now()),
  onBrowserLog: (l) => { if (!/Clock/.test(l.text)) console.log("[browser]", l.text.slice(0, 300)); },
});
const n = stamps.length;
const steady = (stamps[n - 1] - stamps[Math.min(4, n - 1)]) / Math.max(1, n - 5);
console.log(`bench ${from}-${to} dpr ${inputProps.dpr} scale ${scale} conc ${concurrency} perf ${JSON.stringify(perf)}: total ${((Date.now() - t0) / 1000).toFixed(1)} s, first frame ${((stamps[0] - t0) / 1000).toFixed(1)} s, steady ${(steady / 1000).toFixed(2)} s/frame`);
