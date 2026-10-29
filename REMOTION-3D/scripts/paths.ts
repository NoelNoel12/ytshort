import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

export const PROJECT = path.resolve(import.meta.dirname, "..");
export const ROOT = path.resolve(PROJECT, "..");
export const DATA = path.join(PROJECT, "data");
export const PUBLIC = path.join(PROJECT, "public");
export const OUT = path.join(PROJECT, "out");

export const rootPath = (p: string) => path.join(ROOT, p);
export const dataFile = (id: string, kind: string) => path.join(DATA, `${id}.${kind}.json`);

export const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, "utf8")) as T;
export const writeJson = (file: string, data: unknown) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 1) + "\n", "utf8");
};

export const WHISPER_PY =
  process.env.WHISPER_PY ??
  path.join(PROJECT, "tools", process.platform === "win32" ? "venv/Scripts/python.exe" : "venv/bin/python");
export const WHISPER_MODEL = process.env.WHISPER_MODEL ?? path.join(PROJECT, "tools", "whisper-small-ct2");

export const run = (cmd: string, args: string[], opts: { quiet?: boolean } = {}) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed:\n${r.stderr?.slice(-2000)}`);
  }
  if (!opts.quiet && r.stdout) process.stdout.write("");
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
};

export const ffprobeDuration = (file: string): number => {
  const { stdout } = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Number(stdout.trim());
};

export type Silence = { start: number; end: number };

// ffmpeg silencedetect; returns silent intervals in seconds
export const detectSilences = (file: string, noiseDb = -35, minDur = 0.15): Silence[] => {
  const { stderr } = run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", `silencedetect=noise=${noiseDb}dB:d=${minDur}`, "-f", "null", "-"]);
  const out: Silence[] = [];
  let cur: number | null = null;
  for (const m of stderr.matchAll(/silence_(start|end): (-?[\d.]+)/g)) {
    const t = Math.max(0, Number(m[2]));
    if (m[1] === "start") cur = t;
    else {
      out.push({ start: cur ?? 0, end: t });
      cur = null;
    }
  }
  if (cur !== null) out.push({ start: cur, end: ffprobeDuration(file) });
  return out;
};

export const arg = (i: number, fallback?: string) => process.argv[2 + i] ?? fallback;
export const flag = (name: string) => process.argv.includes(`--${name}`);
export const opt = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
