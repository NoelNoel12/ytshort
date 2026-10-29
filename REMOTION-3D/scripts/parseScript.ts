// Parse a Noel Menjawab script (.md) into data/<id>.script.json
// Usage: tsx scripts/parseScript.ts short-02 [--strict]
import fs from "node:fs";
import { getVideo } from "../data/videos";
import { normTokens, tokenize } from "../src/lib/text";
import type { ActionSpec, ScreenChip, SceneSpec, ScriptData, TextSegment } from "../src/types";
import { arg, dataFile, flag, rootPath, writeJson } from "./paths";

const REQUIRED = ["Durasi", "VO", "Teks layar", "Aksi", "Visual"] as const;

const parseChip = (raw: string): ScreenChip => {
  const segments: TextSegment[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const stars: string[] = [];
  while ((m = re.exec(raw))) {
    if (m.index > last) segments.push({ text: raw.slice(last, m.index), highlight: false });
    segments.push({ text: m[1], highlight: true });
    stars.push(m[1]);
    last = m.index + m[0].length;
  }
  if (last < raw.length) segments.push({ text: raw.slice(last), highlight: false });
  const clean = segments.map((s) => ({ ...s, text: s.text.replace(/\s+/g, " ") })).filter((s) => s.text.length);
  // Trim outer spaces only
  if (clean.length) {
    clean[0].text = clean[0].text.replace(/^\s+/, "");
    clean[clean.length - 1].text = clean[clean.length - 1].text.replace(/\s+$/, "");
  }
  return { raw: raw.trim(), plain: clean.map((s) => s.text).join(""), star: stars.join(" "), segments: clean };
};

// Phrase occurs in text (normalized tokens, case and punctuation insensitive)
export const containsPhrase = (text: string, phrase: string): boolean => {
  const t = normTokens(text);
  const p = normTokens(phrase);
  for (let i = 0; i + p.length <= t.length; i++) {
    if (p.every((w, k) => t[i + k] === w)) return true;
  }
  return false;
};

const tableRows = (block: string): string[][] =>
  block
    .split("\n")
    .filter((l) => l.trim().startsWith("|") && !/^\|\s*-+/.test(l.trim()))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim()),
    );

export const parseScript = (id: string, strict = false): { data: ScriptData; errors: string[]; warnings: string[] } => {
  const cfg = getVideo(id);
  const md = fs.readFileSync(rootPath(cfg.script), "utf8").replace(/\r\n/g, "\n");
  const errors: string[] = [];
  const warnings: string[] = [];

  // Header metadata table (before the first "##")
  const meta: Record<string, string> = {};
  const head = md.split(/\n## /)[0];
  for (const [k, v] of tableRows(head).slice(1)) if (k && v) meta[k] = v;

  // Cast table
  const cast: { name: string; role: string }[] = [];
  const castBlock = md.match(/## Pemeran\n([\s\S]*?)\n## /);
  if (castBlock) for (const [name, role] of tableRows(castBlock[1]).slice(1)) cast.push({ name, role });

  const sceneRe = /^### (S\d+):\s*(.+)$/gm;
  const heads = [...md.matchAll(sceneRe)];
  if (!heads.length) errors.push("No scenes found (expected headings like '### S1: Title').");

  const scenes: SceneSpec[] = heads.map((h, idx) => {
    const sid = h[1];
    const bodyEnd = idx + 1 < heads.length ? heads[idx + 1].index! : md.indexOf("\n## ", h.index! + 1);
    const body = md.slice(h.index! + h[0].length, bodyEnd > 0 ? bodyEnd : undefined);

    // Split body into labeled blocks: **Label:** content
    const blocks: Record<string, string> = {};
    const labelRe = /^\*\*([^*]+?):\*\*[ \t]*(.*)$/gm;
    const labels = [...body.matchAll(labelRe)];
    labels.forEach((l, k) => {
      const start = l.index! + l[0].length;
      const end = k + 1 < labels.length ? labels[k + 1].index! : body.length;
      blocks[l[1].trim()] = (l[2] + "\n" + body.slice(start, end)).trim();
    });
    for (const r of REQUIRED) {
      if (!(r in blocks) || !blocks[r].trim()) errors.push(`${sid}: missing label "**${r}:**"`);
    }

    const vo = (blocks["VO"] ?? "").replace(/\s+/g, " ").trim();
    const durMatch = (blocks["Durasi"] ?? "").match(/([\d.,]+)/);
    const screenText = (blocks["Teks layar"] ?? "")
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(parseChip);

    const actions: ActionSpec[] = [];
    for (const line of (blocks["Aksi"] ?? "").split("\n")) {
      const m = line.match(/^\s*[-*]\s*\[([^\]]+)\]\s*(.*)$/);
      if (m) actions.push({ trigger: m[1].trim(), description: m[2].trim() });
      else if (line.trim()) warnings.push(`${sid}: ignored Aksi line "${line.trim()}"`);
    }
    if (!actions.length) errors.push(`${sid}: Aksi has no "- [trigger] description" lines`);
    for (const a of actions) {
      if (!containsPhrase(vo, a.trigger)) {
        const msg = `${sid}: trigger "[${a.trigger}]" not found in VO of this scene`;
        if (strict) errors.push(msg);
        else warnings.push(msg + " (align will fall back to a proportional position)");
      }
    }

    const type = cfg.sceneTypeMap[sid];
    if (!type) errors.push(`${sid}: no entry in sceneTypeMap for video ${id}`);

    return {
      id: sid,
      index: idx,
      title: h[2].trim(),
      type,
      durationHintSec: durMatch ? Number(durMatch[1].replace(",", ".")) : null,
      vo,
      screenText,
      actions,
      visual: (blocks["Visual"] ?? "").replace(/\s+/g, " ").trim(),
    };
  });

  const voText = scenes.map((s) => s.vo).join(" ");
  const voWordCount = tokenize(voText).length;
  const declared = Number((meta["Jumlah kata VO"] ?? "").match(/\d+/)?.[0]);
  if (declared && declared !== voWordCount) warnings.push(`Word count ${voWordCount} differs from header (${declared})`);

  return {
    data: { videoId: id, source: cfg.script, meta, cast, scenes, voText, voWordCount },
    errors,
    warnings,
  };
};

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("parseScript.ts")) {
  const id = arg(0, "short-02")!;
  const { data, errors, warnings } = parseScript(id, flag("strict"));
  for (const w of warnings) console.warn("WARN  " + w);
  if (errors.length) {
    for (const e of errors) console.error("ERROR " + e);
    process.exit(1);
  }
  writeJson(dataFile(id, "script"), data);
  console.log(`parseScript ${id}: ${data.scenes.length} scenes, ${data.voWordCount} VO words, ${data.scenes.reduce((a, s) => a + s.actions.length, 0)} actions -> data/${id}.script.json`);
}
