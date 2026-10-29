// Full data pipeline for one video: audio, transcription, script, caption timing, scenes, finance check.
// Usage: tsx scripts/data.ts short-02 [--skip-transcribe]
import { spawnSync } from "node:child_process";
import { arg, flag } from "./paths";

const id = arg(0, "short-02")!;
const steps: [string, string[]][] = [
  ["prepareAudio", [id]],
  ...(flag("skip-transcribe") ? [] : [["transcribe", [id]] as [string, string[]]]),
  ["parseScript", [id]],
  ["refineCaptions", [id]],
  ["alignScenes", [id]],
  ["checkFinance", [id]],
];
for (const [name, args] of steps) {
  const r = spawnSync(process.execPath, ["--import", "tsx", `scripts/${name}.ts`, ...args], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`data: step ${name} failed`);
    process.exit(r.status ?? 1);
  }
}
console.log(`data ${id}: done`);
