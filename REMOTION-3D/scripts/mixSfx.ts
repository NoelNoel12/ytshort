// Sound-effect mix: per cue gain so effects never mask the voice-over.
// Over speech an effect sits about 10 dB under the VO in the same window (never louder than -24 dBFS),
// in pauses it may reach -18 dBFS. Gains only turn effects down, never up.
// Usage: tsx scripts/mixSfx.ts short-04   -> data/short-04.sfxmix.json
import path from "node:path";
import { getVideo } from "../data/videos";
import { PROJECT, arg, dataFile, pcm, writeJson } from "./paths";
import type { SfxCue } from "../src/sfx/types";

const SR = 8000;
const WIN = 0.3; // seconds analysed from each cue start
const SPEECH = -35; // VO window above this counts as speech (dBFS RMS)
const id = arg(0, "short-04")!;
const cfg = getVideo(id);
const cues: Record<string, () => Promise<SfxCue[]>> = {
  "short-04": async () => (await import("../src/scenes/short04/index")).SFX_04,
};
const list = await cues[id]();
const vo = pcm(path.join(PROJECT, "public", cfg.publicAudio), SR);
const rms = (a: Float32Array, from: number, n: number) => {
  let s = 0;
  for (let k = from; k < Math.min(a.length, from + n); k++) s += a[k] * a[k];
  return Math.sqrt(s / Math.max(1, n));
};
const dB = (x: number) => 20 * Math.log10(Math.max(1e-9, x));
const lin = (d: number) => 10 ** (d / 20);
const fileRms = new Map<string, number>();
const out: { key: string; gain: number; level: number; vo: number }[] = [];
for (const c of list) if (!fileRms.has(c.name)) fileRms.set(c.name, rms(pcm(path.join(PROJECT, "public", "sfx", `${c.name}.wav`), SR), 0, WIN * SR));
const power = (c: SfxCue) => (fileRms.get(c.name)! * c.volume) ** 2;
for (const c of list) {
  // Effects that start close together add up, so a burst is judged as one sound
  const near = list.filter((o) => Math.abs(o.at - c.at) < WIN * cfg.fps);
  const level = dB(Math.sqrt(near.reduce((s, o) => s + power(o), 0)));
  const voDb = dB(rms(vo, Math.round((c.at / cfg.fps) * SR), WIN * SR));
  const target = voDb > SPEECH ? Math.min(-24, voDb - 10) : -18;
  const gain = Math.min(1, lin(target - level));
  out.push({ key: `${c.name}@${c.at}`, gain: +gain.toFixed(3), level: +level.toFixed(1), vo: +voDb.toFixed(1) });
}
writeJson(dataFile(id, "sfxmix"), out);
const turned = out.filter((o) => o.gain < 0.999);
console.log(`mixSfx ${id}: ${out.length} cues, ${turned.length} turned down (min gain ${Math.min(...out.map((o) => o.gain)).toFixed(2)})`);
