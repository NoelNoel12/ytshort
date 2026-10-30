// Final render(s) into FINAL OUTPUT without overwriting older results, then verifySync on the MP4.
// Usage: tsx scripts/renderAll.ts short-02     (one video)
//        tsx scripts/renderAll.ts --all        (every entry in data/videos.ts)
//        tsx scripts/renderAll.ts short-04 --audio-only  (VO + SFX mix only, out/<id>.mix.wav)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { VIDEOS, getVideo } from "../data/videos";
import { PROJECT, flag, opt, rootPath } from "./paths";

const browserExecutable = process.env.REMOTION_BROWSER ?? (process.platform === "linux" ? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell" : null);
const chromiumOptions = { gl: (process.env.REMOTION_GL ?? "swangle") as "swangle" | "angle" };
const concurrency = Number(process.env.REMOTION_CONCURRENCY ?? opt("concurrency") ?? 3);

// "(3D v1).mp4" -> first version number that does not exist yet, so old results are never replaced
const freeOutput = (configured: string): string => {
  const abs = rootPath(configured);
  if (!fs.existsSync(abs)) return abs;
  const m = abs.match(/^(.*\(3D v)(\d+)(\)\.mp4)$/);
  if (!m) throw new Error(`Output exists and has no version tag: ${abs}`);
  for (let n = Number(m[2]) + 1; n < 100; n++) {
    const cand = `${m[1]}${n}${m[3]}`;
    if (!fs.existsSync(cand)) return cand;
  }
  throw new Error("No free version number");
};

const ids = flag("all") ? Object.keys(VIDEOS) : [process.argv[2] ?? "short-02"];
// --audio-only: render just the VO + SFX mix to out/<id>.mix.wav (fast check of the sound design)
const audioOnly = flag("audio-only");
const serveUrl = await bundle({ entryPoint: path.join(PROJECT, "src", "index.ts") });
for (const id of ids) {
  const cfg = getVideo(id);
  const output = opt("out") ?? (audioOnly ? path.join(PROJECT, "out", `${id}.mix.wav`) : freeOutput(cfg.output));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const inputProps = audioOnly ? { audioOnly: true } : {};
  const composition = await selectComposition({ serveUrl, id: cfg.compositionId, inputProps, browserExecutable, chromiumOptions });
  const t0 = Date.now();
  let last = -1;
  if (audioOnly) {
    await renderMedia({ composition, serveUrl, codec: "wav", inputProps, outputLocation: output, browserExecutable, chromiumOptions, concurrency, timeoutInMilliseconds: 240000 });
    console.log(`${id}: audio mix ${output} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    continue;
  }
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 17,
    pixelFormat: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    imageFormat: "jpeg",
    jpegQuality: 92,
    concurrency,
    outputLocation: output,
    timeoutInMilliseconds: 240000,
    browserExecutable,
    chromiumOptions,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 100);
      if (p % 5 === 0 && p !== last) {
        last = p;
        const el = (Date.now() - t0) / 1000;
        console.log(`${id}: ${p}% after ${(el / 60).toFixed(1)} min`);
      }
    },
  });
  console.log(`${id}: rendered ${output} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  const v = spawnSync(process.execPath, ["--import", "tsx", "scripts/verifySync.ts", id, "--video", output], { stdio: "inherit" });
  if (v.status !== 0) process.exitCode = 1;
}
