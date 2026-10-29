// Word-level transcription of the render audio with faster-whisper (tools/transcribe.py).
// Usage: tsx scripts/transcribe.ts short-02 [--audio file.wav] [--out file.json]
import path from "node:path";
import fs from "node:fs";
import { getVideo } from "../data/videos";
import { PUBLIC, WHISPER_MODEL, WHISPER_PY, PROJECT, arg, dataFile, opt, run } from "./paths";

export const transcribe = (audio: string, out: string) => {
  if (!fs.existsSync(WHISPER_PY)) throw new Error(`Python venv not found at ${WHISPER_PY}. See README (Whisper setup).`);
  if (!fs.existsSync(WHISPER_MODEL)) throw new Error(`Whisper model not found at ${WHISPER_MODEL}.`);
  const t0 = Date.now();
  run(WHISPER_PY, ["-I", path.join(PROJECT, "tools", "transcribe.py"), audio, out, "--model", WHISPER_MODEL]);
  return (Date.now() - t0) / 1000;
};

if (process.argv[1]?.endsWith("transcribe.ts")) {
  const id = arg(0, "short-02")!;
  const cfg = getVideo(id);
  const audio = opt("audio") ?? path.join(PUBLIC, cfg.publicAudio);
  const out = opt("out") ?? dataFile(id, "whisper");
  const sec = transcribe(audio, out);
  const d = JSON.parse(fs.readFileSync(out, "utf8"));
  console.log(`transcribe ${id}: ${d.words.length} words in ${sec.toFixed(1)} s (${path.basename(WHISPER_MODEL)}) -> ${path.relative(PROJECT, out)}`);
}
