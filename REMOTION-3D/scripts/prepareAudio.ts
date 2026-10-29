// Copy the VO into public/ as 48 kHz WAV (the exact file used for render) and measure it.
// Never touches the source file in AUDIO.
// Usage: tsx scripts/prepareAudio.ts short-02
import fs from "node:fs";
import path from "node:path";
import { getVideo } from "../data/videos";
import { PUBLIC, arg, dataFile, detectSilences, ffprobeDuration, rootPath, run, writeJson } from "./paths";

const id = arg(0, "short-02")!;
const cfg = getVideo(id);
const src = rootPath(cfg.sourceAudio);
if (!fs.existsSync(src)) {
  console.error(`VO not found: ${src}\nStop: put the recorded VO there first (do not reuse another Short's audio).`);
  process.exit(1);
}
const before = fs.statSync(src);
const dst = path.join(PUBLIC, cfg.publicAudio);
fs.mkdirSync(path.dirname(dst), { recursive: true });
run("ffmpeg", ["-v", "error", "-y", "-i", src, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", dst]);

const srcDur = ffprobeDuration(src);
const dur = ffprobeDuration(dst);
const silences = detectSilences(dst);
const gaps = silences.filter((s) => s.start > 0.05 && s.end < dur - 0.05);
const after = fs.statSync(src);
if (after.size !== before.size || after.mtimeMs !== before.mtimeMs) throw new Error("Source VO changed during prepareAudio");

writeJson(dataFile(id, "audio"), {
  source: cfg.sourceAudio,
  sourceSize: before.size,
  sourceMtime: before.mtime.toISOString(),
  sourceDurationSec: srcDur,
  renderAudio: `public/${cfg.publicAudio}`,
  durationSec: dur,
  silences,
});
console.log(`prepareAudio ${id}: ${dur.toFixed(3)} s (source ${srcDur.toFixed(3)} s), ${gaps.length} inner pauses`);
const long = gaps.filter((g) => g.end - g.start >= 0.3).length;
console.log(`  pauses >= 0.3 s: ${long}, longest ${Math.max(...gaps.map((g) => g.end - g.start)).toFixed(2)} s`);
if (dur > cfg.maxVoSec) {
  console.error(`VO is ${dur.toFixed(2)} s, above the ${cfg.maxVoSec} s limit. Stop and ask before tightening pauses.`);
  process.exit(2);
}
console.log(`  under ${cfg.maxVoSec} s, pauses left untouched`);
