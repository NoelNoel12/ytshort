// Sync checks for captions, labels and action triggers.
// Usage:
//   tsx scripts/verifySync.ts short-02                  (pre-render: pages vs silencedetect, triggers)
//   tsx scripts/verifySync.ts short-02 --video out.mp4  (also post-render: ffprobe + re-transcription)
//   add --stills to render 10 mid-word stills into out/sync-stills for a visual check
// With sound effects in the mix the VO offset is measured by cross-correlation against the VO file,
// pause snapping uses the VO's own pauses, and every SFX cue is checked for being audible.
import fs from "node:fs";
import path from "node:path";
import { getVideo } from "../data/videos";
import { CAPTION_RULES } from "../src/theme";
import { tokenize } from "../src/lib/text";
import type { ScriptData, Timeline } from "../src/types";
import { alignScriptToWhisper, snapToSilences, stats, type WhisperWord } from "./lib/align";
import { OUT, PROJECT, arg, dataFile, detectSilences, flag, opt, pcm, readJson, run, writeJson } from "./paths";
import { transcribe } from "./transcribe";

const SR = 8000;
const db = (x: number) => (20 * Math.log10(Math.max(1e-9, x))).toFixed(1);
type Cue = { at: number; name: string; volume: number; durationInFrames?: number };
const SFX: Record<string, () => Promise<Cue[]>> = {
  "short-04": async () => (await import("../src/scenes/short04/index")).SFX_04,
};

const id = arg(0, "short-02")!;
const cfg = getVideo(id);
const tl = readJson<Timeline>(dataFile(id, "timeline"));
const fps = tl.fps;
let failed = false;
const ms = (x: number) => `${(x * 1000).toFixed(0)}`;
const pad = (s: string | number, n: number) => String(s).padStart(n);

// ---------- 1. pages vs pause edges ----------
const sil = tl.silences;
const onsets = sil.map((s) => s.end).filter((t) => t < tl.audioDurationSec - 0.05);
const offsets = sil.map((s) => s.start).filter((t) => t > 0.05);
let atPause = 0;
let startViol = 0;
let endViol = 0;
let endChecked = 0;
const rows: string[] = [];
for (const p of tl.pages) {
  const shownAt = p.showFrom / fps;
  const hiddenAt = p.showTo / fps;
  // Only pauses that sit right before the first word / right after the last word of this page
  const first = tl.words[p.words[0].wi];
  const last = tl.words[p.words[p.words.length - 1].wi];
  const prevW = tl.words[first.i - 1];
  const nextW = tl.words[last.i + 1];
  const onset = onsets.find((t) => sil.some((s) => s.end === t && (!prevW || s.start >= prevW.end - 0.03) && t <= first.end && t >= first.start - 0.3));
  const offset = offsets.find((t) => sil.some((s) => s.start === t && (!nextW || s.end <= nextW.start + 0.03) && t >= last.start && t <= last.end + 0.3));
  let note = "";
  if (onset !== undefined || p.i === 0) {
    atPause++;
    const ref = onset ?? 0;
    const d = shownAt - ref;
    const ok = d >= -0.08 && d <= 0.04;
    if (!ok) startViol++;
    note += `start ${d >= 0 ? "+" : ""}${ms(d)} ms ${ok ? "ok" : "VIOLATION"}`;
  }
  const next = tl.pages[p.i + 1];
  if (offset !== undefined && (!next || next.showFrom > p.showTo)) {
    endChecked++;
    const d = hiddenAt - offset;
    const ok = d <= 0.25 && d >= 0;
    if (!ok) endViol++;
    note += `${note ? ", " : ""}end +${ms(d)} ms ${ok ? "ok" : "VIOLATION"}`;
  }
  rows.push(`${pad(p.i, 3)} ${p.scene} ${pad(shownAt.toFixed(3), 7)}-${pad(hiddenAt.toFixed(3), 7)}  ${p.words.map((w) => w.text).join(" ").padEnd(26)} ${note}`);
}
// Caption must be on screen whenever a word is sounding
let uncovered = 0;
for (const w of tl.words) {
  for (let f = Math.ceil(w.start * fps); f < Math.floor(w.end * fps); f++) {
    if (!tl.pages.some((p) => f >= p.showFrom && f < p.showTo)) uncovered++;
  }
}
const pct = (atPause ? (startViol / atPause) * 100 : 0) + (endChecked ? (endViol / endChecked) * 100 : 0);
console.log("== 1. Caption pages vs silencedetect");
if (flag("table")) for (const r of rows) console.log("  " + r);
console.log(`  pages ${tl.pages.length}, starting after a pause ${atPause}, start violations ${startViol} (${((startViol / Math.max(1, atPause)) * 100).toFixed(1)} %)`);
console.log(`  pages ending into a pause ${endChecked}, end violations ${endViol} (${((endViol / Math.max(1, endChecked)) * 100).toFixed(1)} %)`);
console.log(`  frames with a sounding word but no caption: ${uncovered}`);
const p1 = pct <= 5 && uncovered === 0;
console.log(`  RESULT ${p1 ? "PASS" : "FAIL"} (limit 5 % violations, 0 uncovered frames)`);
failed ||= !p1;

// ---------- 4. action triggers ----------
console.log("== 4. Action triggers (word start vs action frame)");
const sceneSrc = fs
  .readdirSync(path.join(PROJECT, "src", "scenes", cfg.sceneDir), { recursive: true })
  .filter((f) => String(f).endsWith(".tsx"))
  .map((f) => fs.readFileSync(path.join(PROJECT, "src", "scenes", cfg.sceneDir, String(f)), "utf8"))
  .join("\n");
let trigBad = 0;
for (const t of tl.triggers) {
  const w = t.wordIndex >= 0 ? tl.words[t.wordIndex] : null;
  const d = w ? t.frame / fps - w.start : NaN;
  const used = new RegExp(`cue\\(\\s*["']${t.scene}["']\\s*,\\s*${t.action}\\s*\\)`).test(sceneSrc);
  const ok = !!w && Math.abs(d) <= 0.1 && used;
  if (!ok) trigBad++;
  console.log(`  ${t.scene} [${t.trigger}]`.padEnd(42) + ` word ${w ? w.start.toFixed(3) : "  n/a "} s  action frame ${pad(t.frame, 4)} (${(t.frame / fps).toFixed(3)} s)  diff ${w ? ms(d) : "n/a"} ms  ${used ? "used in scene" : "NOT USED"}  ${ok ? "ok" : "FAIL"}`);
}
console.log(`  RESULT ${trigBad ? "FAIL" : "PASS"} (${tl.triggers.length - trigBad}/${tl.triggers.length} within 100 ms and wired)`);
failed ||= trigBad > 0;

// ---------- 2. post-render ----------
const video = opt("video");
if (video) {
  console.log("== 2. Post-render check: " + path.basename(video));
  const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,start_time,duration:format=duration", "-of", "json", video]).stdout);
  const v = probe.streams.find((s: { codec_type: string }) => s.codec_type === "video");
  const a = probe.streams.find((s: { codec_type: string }) => s.codec_type === "audio");
  const startOk = Number(v.start_time) === 0 && Number(a.start_time) === 0;
  const durDiff = Math.abs(Number(v.duration) - Number(a.duration));
  console.log(`  video start ${v.start_time} dur ${v.duration} | audio start ${a.start_time} dur ${a.duration} | format ${probe.format.duration}`);
  console.log(`  start_time both 0: ${startOk ? "yes" : "NO"}, duration diff ${ms(durDiff)} ms (limit 50)`);
  const tmp = path.join(OUT, `${id}.postrender.wav`);
  run("ffmpeg", ["-v", "error", "-y", "-i", video, "-vn", "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", tmp]);
  // VO offset inside the mix: best lag of the VO file against the rendered audio (within 50 ms)
  const mix = pcm(tmp);
  const vo = pcm(path.join(PROJECT, "public", cfg.publicAudio));
  let bestLag = 0;
  let bestC = -Infinity;
  for (let lag = -SR / 20; lag <= SR / 20; lag++) {
    let c = 0;
    for (let n = Math.max(0, lag); n < Math.min(mix.length, vo.length + lag); n++) c += mix[n] * vo[n - lag];
    if (c > bestC) [bestC, bestLag] = [c, lag];
  }
  let vv = 0;
  for (let n = 0; n < vo.length; n++) vv += vo[n] * vo[n];
  const gain = bestC / vv;
  const offset = bestLag / SR;
  const offsetOk = Math.abs(offset) <= 0.01;
  console.log(`  VO offset in the mix ${ms(offset)} ms (limit 10), VO gain ${gain.toFixed(3)}: ${offsetOk ? "ok" : "NO"}`);
  let peak = 0;
  for (const x of mix) peak = Math.max(peak, Math.abs(x));
  console.log(`  mix peak ${db(peak)} dBFS (clips at 0)`);
  // Sound effects: what is left after removing the VO, at each cue versus the quiet floor
  const cues = SFX[id] ? await SFX[id]() : [];
  let sfxOk = true;
  if (cues.length) {
    const res = new Float32Array(mix.length);
    for (let n = 0; n < mix.length; n++) res[n] = mix[n] - gain * (vo[n - bestLag] ?? 0);
    const rms = (a: number, b: number) => {
      let s = 0;
      let k = 0;
      for (let n = Math.max(0, Math.round(a * SR)); n < Math.min(res.length, Math.round(b * SR)); n++, k++) s += res[n] * res[n];
      return Math.sqrt(s / Math.max(1, k));
    };
    const busy = (t: number) => cues.some((c) => t >= c.at / fps - 0.05 && t <= c.at / fps + Math.max(1.2, (c.durationInFrames ?? 0) / fps));
    const quiet: number[] = [];
    for (let t = 0; t < mix.length / SR - 0.1; t += 0.1) if (!busy(t)) quiet.push(rms(t, t + 0.1));
    quiet.sort((a, b) => a - b);
    const floor = quiet.length ? quiet[Math.floor(quiet.length / 2)] : 1e-6;
    const levels = cues.map((c) => ({ c, l: rms(c.at / fps, c.at / fps + 0.25) }));
    const heard = levels.filter((x) => x.l >= floor * 4); // 12 dB over the floor
    console.log(`  SFX: ${cues.length} cues, ${heard.length} audible (12 dB over the residual floor ${db(floor)} dBFS), loudest ${db(Math.max(...levels.map((x) => x.l)))} dBFS RMS`);
    for (const x of levels.filter((x) => x.l < floor * 4)) console.log(`    quiet cue ${x.c.name} at frame ${x.c.at}: ${db(x.l)} dBFS`);
    sfxOk = heard.length === cues.length;
  }
  const tjson = path.join(OUT, `${id}.postrender.whisper.json`);
  const sec = transcribe(tmp, tjson);
  const ww = readJson<{ words: WhisperWord[] }>(tjson).words;
  const script = readJson<ScriptData>(dataFile(id, "script"));
  const sw = script.scenes.flatMap((s) => tokenize(s.vo));
  const raw = alignScriptToWhisper(sw, ww);
  // With SFX in the pauses silencedetect on the mix is unreliable, so snap to the VO's own pauses
  const pauses = cues.length ? tl.silences.map((s) => ({ start: s.start + offset, end: s.end + offset })) : detectSilences(tmp);
  const snapped = snapToSilences(raw, pauses, 0.25).words;
  const diffsRaw = raw.map((w, i) => Math.abs(w.start - tl.words[i].start));
  const diffs = snapped.map((w, i) => Math.abs(w.start - tl.words[i].start));
  const capStart = tl.words.map((w) => {
    // When the word turns yellow on screen
    return Math.ceil((w.start - CAPTION_RULES.preRollSec) * fps) / fps;
  });
  const diffsShown = snapped.map((w, i) => Math.abs(w.start - capStart[i]));
  const sR = stats(diffsRaw);
  const sS = stats(diffs);
  const sV = stats(diffsShown);
  console.log(`  re-transcribed ${ww.length} words in ${sec.toFixed(0)} s`);
  console.log(`  |word start diff| raw whisper:         median ${ms(sR.median)} ms, p95 ${ms(sR.p95)} ms, max ${ms(sR.max)} ms`);
  console.log(`  |word start diff| whisper + snapping:  median ${ms(sS.median)} ms, p95 ${ms(sS.p95)} ms, max ${ms(sS.max)} ms`);
  console.log(`  |word start diff| vs on-screen frame:  median ${ms(sV.median)} ms, p95 ${ms(sV.p95)} ms, max ${ms(sV.max)} ms`);
  const p2 = startOk && offsetOk && sfxOk && durDiff <= 0.05 && sS.median < 0.08 && sS.p95 < 0.2 && sV.median < 0.08 && sV.p95 < 0.2;
  console.log(`  RESULT ${p2 ? "PASS" : "FAIL"} (median < 80 ms, p95 < 200 ms, start 0, duration within 50 ms, VO offset within 10 ms, every SFX audible)`);
  failed ||= !p2;
  writeJson(path.join(OUT, `${id}.postrender.sync.json`), { probe, offsetSec: offset, voGain: gain, peak, stats: { raw: sR, snapped: sS, shown: sV } });
}

// ---------- 3. stills at mid-word frames ----------
if (flag("stills")) {
  console.log("== 3. Visual check stills (mid-word frames)");
  const { bundle } = await import("@remotion/bundler");
  const { selectComposition, renderStill } = await import("@remotion/renderer");
  const { random } = await import("remotion");
  const serveUrl = await bundle({ entryPoint: path.join(PROJECT, "src", "index.ts") });
  const browserExecutable = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
  const chromiumOptions = { gl: (process.env.REMOTION_GL ?? "swangle") as "swangle" | "angle" };
  const comp = await selectComposition({ serveUrl, id: cfg.compositionId, browserExecutable, chromiumOptions });
  const dir = path.join(OUT, "sync-stills");
  fs.mkdirSync(dir, { recursive: true });
  const picks = new Set<number>();
  let k = 0;
  while (picks.size < 10) picks.add(Math.floor(random(`sync-${k++}`) * tl.words.length));
  for (const wi of [...picks].sort((a, b) => a - b)) {
    const w = tl.words[wi];
    const frame = Math.round(((w.start + w.end) / 2) * fps);
    const file = path.join(dir, `f${String(frame).padStart(4, "0")}_${w.caption}.jpg`);
    await renderStill({ composition: comp, serveUrl, output: file, frame, imageFormat: "jpeg", scale: 0.5, browserExecutable, chromiumOptions });
    console.log(`  frame ${frame} (${(frame / fps).toFixed(2)} s) expects "${w.caption}" -> ${path.relative(PROJECT, file)}`);
  }
}

console.log(failed ? "verifySync: FAILED" : "verifySync: PASSED");
process.exit(failed ? 1 : 0);
