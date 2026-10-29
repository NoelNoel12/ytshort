// Build data/<id>.timeline.json: scene ranges, caption pages, labels, action triggers.
// Usage: tsx scripts/alignScenes.ts short-02
import { getVideo } from "../data/videos";
import { CAPTION_RULES } from "../src/theme";
import { fuzzyEq, normTokens } from "../src/lib/text";
import type { CaptionPage, LabelCue, ScriptData, SceneTiming, Timeline, TimedWord, TriggerCue } from "../src/types";
import { arg, dataFile, readJson, writeJson, type Silence } from "./paths";

const id = arg(0, "short-02")!;
const cfg = getVideo(id);
const fps = cfg.fps;
const script = readJson<ScriptData>(dataFile(id, "script"));
const { words } = readJson<{ words: TimedWord[] }>(dataFile(id, "words"));
const audio = readJson<{ durationSec: number; silences: Silence[] }>(dataFile(id, "audio"));

const durationInFrames = Math.ceil((audio.durationSec + cfg.tailSec) * fps);
// Frame at which something keyed to time t appears (pre-roll between 2 and 35 ms)
const appearFrame = (t: number) => Math.max(0, Math.ceil((t - CAPTION_RULES.preRollSec) * fps));

// ---------- scenes ----------
const scenes: SceneTiming[] = script.scenes.map((s) => {
  const ws = words.filter((w) => w.scene === s.id);
  return { id: s.id, type: s.type, start: 0, end: 0, fromFrame: 0, toFrame: 0, firstWord: ws[0].i, lastWord: ws[ws.length - 1].i };
});
scenes.forEach((sc, k) => {
  if (k === 0) sc.fromFrame = 0;
  else {
    const e = words[scenes[k - 1].lastWord].end;
    const s = words[sc.firstWord].start;
    sc.fromFrame = Math.round((s - Math.min(0.2, (s - e) / 2)) * fps);
  }
});
scenes.forEach((sc, k) => {
  sc.toFrame = k + 1 < scenes.length ? scenes[k + 1].fromFrame : durationInFrames;
  sc.start = sc.fromFrame / fps;
  sc.end = sc.toFrame / fps;
});

// ---------- caption pages ----------
const pageLen = (ws: TimedWord[]) => ws.map((w) => w.caption).join(" ").length;
const phrases: TimedWord[][] = [];
let cur: TimedWord[] = [];
words.forEach((w, k) => {
  cur.push(w);
  const next = words[k + 1];
  const brk = !next || next.scene !== w.scene || /[,.;:!?]$/.test(w.text) || next.start - w.end > CAPTION_RULES.pauseBreakSec;
  if (brk) {
    phrases.push(cur);
    cur = [];
  }
});
// Spoken numbers must stay on one page ("dua belas persen")
const NUM = new Set(["satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas", "belas", "puluh", "ratus", "seratus", "ribu", "juta", "persen", "kali", "lipat"]);
const isNum = (w: TimedWord) => NUM.has(w.norm);
// Split each phrase into pages with a small DP: fewest pages, no orphans, balanced length, numbers kept whole
const splitPhrase = (ws: TimedWord[]): TimedWord[][] => {
  const n = ws.length;
  const best: { cost: number; cut: number }[] = Array.from({ length: n + 1 }, () => ({ cost: Infinity, cut: -1 }));
  best[0] = { cost: 0, cut: -1 };
  for (let j = 1; j <= n; j++) {
    for (let i = Math.max(0, j - CAPTION_RULES.maxWords); i < j; i++) {
      const page = ws.slice(i, j);
      const len = pageLen(page);
      if (len > CAPTION_RULES.maxChars && page.length > 1) continue;
      const orphan = page.length === 1 && n > 1 ? 1.6 : 0;
      const splitsNumber = j < n && isNum(ws[j - 1]) && isNum(ws[j]) ? 12 : 0;
      const cost = best[i].cost + 1 + orphan + splitsNumber + Math.abs(len - 16) / 40;
      if (cost < best[j].cost) best[j] = { cost, cut: i };
    }
  }
  const out: TimedWord[][] = [];
  for (let j = n; j > 0; j = best[j].cut) out.unshift(ws.slice(best[j].cut, j));
  return out;
};
const rawPages = phrases.flatMap(splitPhrase);
const pages: CaptionPage[] = rawPages.map((ws, i) => ({
  i,
  scene: ws[0].scene,
  words: ws.map((w) => ({ text: w.caption, start: w.start, end: w.end, wi: w.i })),
  start: ws[0].start,
  end: ws[ws.length - 1].end,
  showFrom: appearFrame(ws[0].start),
  showTo: 0,
}));
pages.forEach((p, k) => {
  const hide = Math.floor((p.end + CAPTION_RULES.holdSec) * fps);
  p.showTo = Math.max(p.showFrom + 1, k + 1 < pages.length ? Math.min(hide, pages[k + 1].showFrom) : Math.min(hide, durationInFrames));
});

// ---------- phrase search inside a scene ----------
type Match = { index: number; score: number; exact: boolean };
const sceneWords = (sid: string) => words.filter((w) => w.scene === sid);
const findPhrase = (sid: string, phrase: string, fromIdx: number, exactOnly: boolean): Match | null => {
  const ws = sceneWords(sid).filter((w) => w.i >= fromIdx);
  const toks = ws.map((w) => normTokens(w.text).join(" "));
  const q = normTokens(phrase);
  // Exact token sequence first (words may hold more than one token, e.g. none here, but keep it general)
  const flat: { t: string; wi: number }[] = [];
  ws.forEach((w, k) => normTokens(w.text).forEach((t) => flat.push({ t, wi: k })));
  for (let p = 0; p + q.length <= flat.length; p++) {
    if (q.every((t, k) => flat[p + k].t === t)) return { index: ws[flat[p].wi].i, score: q.length, exact: true };
  }
  if (exactOnly) return null;
  let best: Match | null = null;
  for (let p = 0; p < ws.length; p++) {
    let j = 0;
    let score = 0;
    let first = -1;
    for (let k = p; k < Math.min(ws.length, p + q.length + 2) && j < q.length; k++) {
      if (fuzzyEq(q[j], toks[k])) {
        if (first < 0) first = k;
        score++;
        j++;
      } else if (j + 1 < q.length && fuzzyEq(q[j + 1], toks[k])) {
        if (first < 0) first = k;
        score++;
        j += 2;
      }
    }
    if (score > 0 && first === p && (!best || score > best.score)) best = { index: ws[first].i, score, exact: false };
  }
  return best;
};

// ---------- labels ----------
const report: string[] = [];
const labels: LabelCue[] = [];
script.scenes.forEach((s, si) => {
  const sc = scenes[si];
  let chips = s.screenText.map((c, k) => ({ c, k }));
  if (s.type === "hook") chips = []; // S1 text is the title card
  if (s.type === "cta") chips = chips.filter(({ c }) => !/noel menjawab/i.test(c.plain)); // end card
  let cursor = sc.firstWord;
  const cues: LabelCue[] = [];
  chips.forEach(({ c, k }, n) => {
    const override = cfg.labelAnchors?.[`${s.id}-${k}`];
    const tries = override ? [override] : [c.star || c.plain, c.plain];
    let m: Match | null = null;
    let anchor = tries[0];
    for (const t of tries) {
      m = findPhrase(s.id, t, cursor, false);
      anchor = t;
      if (m && (m.exact || m.score >= Math.ceil(normTokens(t).length / 2))) break;
    }
    let time: number;
    if (m) {
      time = words[m.index].start;
      cursor = m.index + 1;
    } else {
      time = sc.start + ((n + 1) / (chips.length + 1)) * (sc.end - sc.start);
      report.push(`label ${s.id}-${k} "${c.plain}": anchor not found, proportional at ${time.toFixed(2)} s`);
    }
    cues.push({ scene: s.id, chip: k, segments: c.segments, anchor: m ? words[m.index].caption + ` (${anchor})` : anchor, anchorFound: !!m, time, fromFrame: appearFrame(time), toFrame: 0 });
  });
  cues.forEach((q, n) => {
    const maxEnd = q.fromFrame + Math.round(CAPTION_RULES.labelMaxSec * fps);
    const nextFrom = n + 1 < cues.length ? cues[n + 1].fromFrame : Infinity;
    q.toFrame = Math.min(maxEnd, nextFrom, sc.toFrame);
  });
  labels.push(...cues);
});

// ---------- action triggers ----------
const triggers: TriggerCue[] = [];
script.scenes.forEach((s, si) => {
  const sc = scenes[si];
  let cursor = sc.firstWord;
  s.actions.forEach((a, k) => {
    let m = findPhrase(s.id, a.trigger, cursor, true) ?? findPhrase(s.id, a.trigger, sc.firstWord, true) ?? findPhrase(s.id, a.trigger, cursor, false);
    let time: number;
    if (m) {
      time = words[m.index].start;
      cursor = m.index + 1;
    } else {
      time = sc.start + ((k + 1) / (s.actions.length + 1)) * (sc.end - sc.start);
      report.push(`trigger ${s.id}[${a.trigger}] not found, proportional at ${time.toFixed(2)} s`);
    }
    triggers.push({ scene: s.id, action: k, trigger: a.trigger, description: a.description, found: !!m, wordIndex: m ? m.index : -1, time, frame: Math.round(time * fps) });
  });
});

const s1 = script.scenes[0].screenText;
const timeline: Timeline = {
  videoId: id,
  fps,
  audio: cfg.publicAudio,
  audioDurationSec: audio.durationSec,
  durationInFrames,
  title: { line1: s1[0]?.plain ?? "", line2: s1[1]?.plain ?? "" },
  words,
  pages,
  labels,
  triggers,
  scenes,
  silences: audio.silences,
};
writeJson(dataFile(id, "timeline"), timeline);

console.log(`alignScenes ${id}: ${durationInFrames} frames (${(durationInFrames / fps).toFixed(2)} s), ${pages.length} caption pages, ${labels.length} labels, ${triggers.length} triggers`);
for (const sc of scenes) console.log(`  ${sc.id.padEnd(3)} ${sc.type.padEnd(12)} ${sc.start.toFixed(2).padStart(6)} -> ${sc.end.toFixed(2).padStart(6)} s  (${(sc.end - sc.start).toFixed(1)} s)`);
for (const t of triggers) console.log(`  trigger ${t.scene} [${t.trigger}] word ${t.wordIndex} at ${t.time.toFixed(3)} s, frame ${t.frame}${t.found ? "" : " (fallback)"}`);
for (const l of labels) console.log(`  label   ${l.scene}-${l.chip} "${l.segments.map((s) => s.text).join("")}" @ ${l.anchor} ${l.time.toFixed(2)} s, frames ${l.fromFrame}-${l.toFrame}`);
for (const r of report) console.warn("  WARN " + r);
