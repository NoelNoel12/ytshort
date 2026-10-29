// Map script words onto whisper timings, then snap pause edges with silencedetect.
// Usage: tsx scripts/refineCaptions.ts short-02
import { getVideo } from "../data/videos";
import { captionWord, tokenize } from "../src/lib/text";
import type { ScriptData, TimedWord } from "../src/types";
import { alignScriptToWhisper, snapToSilences, stats, type WhisperWord } from "./lib/align";
import { arg, dataFile, readJson, writeJson, type Silence } from "./paths";

const id = arg(0, "short-02")!;
getVideo(id);
const script = readJson<ScriptData>(dataFile(id, "script"));
const whisper = readJson<{ words: WhisperWord[]; model: string }>(dataFile(id, "whisper"));
const audio = readJson<{ durationSec: number; silences: Silence[] }>(dataFile(id, "audio"));

// Script words with their scene
const sw: { text: string; scene: string }[] = [];
for (const s of script.scenes) for (const t of tokenize(s.vo)) sw.push({ text: t, scene: s.id });

const aligned = alignScriptToWhisper(
  sw.map((w) => w.text),
  whisper.words,
);
const unaligned = aligned.filter((a) => a.aligned === 0);
const { words: snapped, changes } = snapToSilences(aligned, audio.silences, 0.25);

// The last word must end where the voice stops
const lastSil = audio.silences.find((s) => s.start > snapped[snapped.length - 1].start);
if (lastSil && Math.abs(lastSil.start - snapped[snapped.length - 1].end) > 0.001) {
  changes.push({ i: snapped.length - 1, text: snapped[snapped.length - 1].text, field: "end", from: snapped[snapped.length - 1].end, to: lastSil.start });
  snapped[snapped.length - 1].end = lastSil.start;
}

const words: TimedWord[] = snapped.map((w, i) => ({
  i,
  text: sw[i].text,
  caption: captionWord(sw[i].text),
  norm: w.norm,
  scene: sw[i].scene,
  start: Math.round(w.start * 1000) / 1000,
  end: Math.round(w.end * 1000) / 1000,
  punct: (sw[i].text.match(/[,.;:!?]+$/) ?? [""])[0],
}));

writeJson(dataFile(id, "words"), { videoId: id, model: whisper.model, words, changes });

const startShifts = changes.filter((c) => c.field === "start").map((c) => (c.to - c.from) * 1000);
const endShifts = changes.filter((c) => c.field === "end").map((c) => (c.to - c.from) * 1000);
const fmt = (x: number) => (Number.isFinite(x) ? x.toFixed(0) : "-");
const abs = (xs: number[]) => stats(xs.map(Math.abs));
console.log(`refineCaptions ${id}: ${words.length} script words mapped onto ${whisper.words.length} whisper words`);
console.log(`  words with no aligned characters (interpolated): ${unaligned.length}${unaligned.length ? " -> " + unaligned.map((u) => u.text).join(", ") : ""}`);
console.log(`  start snapped to pause end:  ${startShifts.length} words, |shift| median ${fmt(abs(startShifts).median)} ms, max ${fmt(abs(startShifts).max)} ms, mean signed ${fmt(stats(startShifts).mean)} ms`);
console.log(`  end snapped to pause start:  ${endShifts.length} words, |shift| median ${fmt(abs(endShifts).median)} ms, max ${fmt(abs(endShifts).max)} ms, mean signed ${fmt(stats(endShifts).mean)} ms`);
