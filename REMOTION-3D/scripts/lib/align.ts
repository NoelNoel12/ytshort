// Character-level alignment of script words onto whisper words.
// Handles digits vs spelled numbers ("12%" vs "dua belas persen") and merges/splits ("ke enam" vs "keenam").
import { normWord } from "../../src/lib/text";
import type { Silence } from "../paths";

export type WhisperWord = { text: string; start: number; end: number; prob?: number };
export type AlignedWord = { i: number; text: string; norm: string; start: number; end: number; aligned: number };

type Ch = { c: string; t0: number; t1: number; w: number };

const charsOfWhisper = (words: WhisperWord[]): Ch[] => {
  const out: Ch[] = [];
  words.forEach((w, wi) => {
    const s = normWord(w.text).replace(/ /g, "");
    const n = s.length;
    for (let k = 0; k < n; k++) {
      out.push({ c: s[k], t0: w.start + ((w.end - w.start) * k) / n, t1: w.start + ((w.end - w.start) * (k + 1)) / n, w: wi });
    }
  });
  return out;
};

export const alignScriptToWhisper = (scriptWords: string[], whisper: WhisperWord[]): AlignedWord[] => {
  const sChars: { c: string; w: number }[] = [];
  const norms = scriptWords.map((w) => normWord(w));
  norms.forEach((n, wi) => {
    for (const c of n.replace(/ /g, "")) sChars.push({ c, w: wi });
  });
  const wChars = charsOfWhisper(whisper);
  const m = sChars.length;
  const n = wChars.length;
  // Needleman-Wunsch with unit costs, traceback matrix in a flat Uint8Array
  const dir = new Uint8Array((m + 1) * (n + 1));
  let prev = new Int32Array(n + 1);
  let cur = new Int32Array(n + 1);
  for (let j = 0; j <= n; j++) {
    prev[j] = j;
    dir[j] = 2;
  }
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    dir[i * (n + 1)] = 1;
    const ci = sChars[i - 1].c;
    for (let j = 1; j <= n; j++) {
      const diag = prev[j - 1] + (ci === wChars[j - 1].c ? 0 : 1);
      const up = prev[j] + 1;
      const left = cur[j - 1] + 1;
      let best = diag;
      let d = 0;
      if (up < best) {
        best = up;
        d = 1;
      }
      if (left < best) {
        best = left;
        d = 2;
      }
      cur[j] = best;
      dir[i * (n + 1) + j] = d;
    }
    [prev, cur] = [cur, prev];
  }
  // Traceback: map each script char to a whisper char (or -1)
  const map = new Int32Array(m).fill(-1);
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const d = dir[i * (n + 1) + j];
    if (i > 0 && j > 0 && d === 0) {
      map[i - 1] = j - 1;
      i--;
      j--;
    } else if (i > 0 && (j === 0 || d === 1)) i--;
    else j--;
  }

  const out: AlignedWord[] = scriptWords.map((text, wi) => ({ i: wi, text, norm: norms[wi], start: NaN, end: NaN, aligned: 0 }));
  sChars.forEach((sc, k) => {
    const wc = map[k];
    if (wc < 0) return;
    const o = out[sc.w];
    const t0 = wChars[wc].t0;
    const t1 = wChars[wc].t1;
    if (Number.isNaN(o.start) || t0 < o.start) o.start = t0;
    if (Number.isNaN(o.end) || t1 > o.end) o.end = t1;
    o.aligned++;
  });
  // Fill words with no aligned chars by interpolating between neighbours
  for (let k = 0; k < out.length; k++) {
    if (!Number.isNaN(out[k].start)) continue;
    let a = k - 1;
    while (a >= 0 && Number.isNaN(out[a].end)) a--;
    let b = k + 1;
    while (b < out.length && Number.isNaN(out[b].start)) b++;
    const t0 = a >= 0 ? out[a].end : 0;
    const t1 = b < out.length ? out[b].start : t0 + 0.3;
    const span = b - a - 1;
    const pos = k - a - 1;
    out[k].start = t0 + ((t1 - t0) * pos) / span;
    out[k].end = t0 + ((t1 - t0) * (pos + 1)) / span;
  }
  return out;
};

export type SnapStat = { i: number; text: string; field: "start" | "end"; from: number; to: number };

// Snap word edges to silence edges: start -> end of the pause before it, end -> start of the pause after it.
export const snapToSilences = <T extends { start: number; end: number; text: string }>(
  words: T[],
  silences: Silence[],
  maxShift = 0.25,
): { words: T[]; changes: SnapStat[] } => {
  const w = words.map((x) => ({ ...x }));
  const changes: SnapStat[] = [];
  // Pre-pass: a pause sitting inside a word with only a sliver of the word before it
  // means the word really starts after the pause (whisper tends to start words early).
  for (let k = 0; k < w.length; k++) {
    for (const s of silences) {
      if (!(s.start > w[k].start && s.end < w[k].end)) continue;
      if (s.start - w[k].start < 0.15) {
        changes.push({ i: k, text: w[k].text, field: "start", from: w[k].start, to: s.end });
        if (k > 0 && w[k - 1].end > s.start) w[k - 1].end = s.start;
        w[k].start = s.end;
      } else if (w[k].end - s.end < 0.15) {
        changes.push({ i: k, text: w[k].text, field: "end", from: w[k].end, to: s.start });
        if (k + 1 < w.length && w[k + 1].start < s.end) w[k + 1].start = s.end;
        w[k].end = s.start;
      }
    }
  }
  for (let k = 0; k < w.length; k++) {
    const prevStart = k > 0 ? w[k - 1].start : -Infinity;
    const prevEnd = k > 0 ? w[k - 1].end : -Infinity;
    const nextStart = k + 1 < w.length ? w[k + 1].start : Infinity;
    const nextEnd = k + 1 < w.length ? w[k + 1].end : Infinity;
    // Pause that ends near this word's start and begins after the previous word started
    let bestS: Silence | null = null;
    for (const s of silences) {
      // Skip pauses that sit inside the previous word
      if (s.start <= prevStart || s.end > w[k].end || s.end < prevEnd - 0.1) continue;
      // A start that lies inside a pause can only belong at the end of that pause
      const inside = w[k].start > s.start && w[k].start < s.end;
      // Sound between the pause and the word can only be this word
      const fill = s.end < w[k].start && s.end >= prevEnd;
      if ((inside || fill || Math.abs(s.end - w[k].start) <= maxShift) && (!bestS || Math.abs(s.end - w[k].start) < Math.abs(bestS.end - w[k].start))) bestS = s;
    }
    if (bestS && bestS.end !== w[k].start) {
      changes.push({ i: k, text: w[k].text, field: "start", from: w[k].start, to: bestS.end });
      w[k].start = bestS.end;
    }
    let bestE: Silence | null = null;
    for (const s of silences) {
      // Skip pauses that sit inside the next word
      if (s.end >= nextEnd || s.start < w[k].start || s.start > nextStart + 0.1) continue;
      const inside = w[k].end > s.start && w[k].end < s.end;
      const fill = s.start > w[k].end && s.start <= nextStart;
      if ((inside || fill || Math.abs(s.start - w[k].end) <= maxShift) && (!bestE || Math.abs(s.start - w[k].end) < Math.abs(bestE.start - w[k].end))) bestE = s;
    }
    if (bestE && bestE.start !== w[k].end) {
      changes.push({ i: k, text: w[k].text, field: "end", from: w[k].end, to: bestE.start });
      w[k].end = bestE.start;
    }
  }
  // Keep order and a minimum length
  for (let k = 0; k < w.length; k++) {
    if (k > 0 && w[k].start < w[k - 1].end) {
      // Overlap inside continuous speech: split at the midpoint
      const mid = (w[k].start + w[k - 1].end) / 2;
      w[k - 1].end = Math.min(w[k - 1].end, mid);
      w[k].start = Math.max(w[k].start, mid);
    }
    if (w[k].end - w[k].start < 0.06) w[k].end = w[k].start + 0.06;
  }
  return { words: w, changes };
};

export const stats = (xs: number[]) => {
  const a = [...xs].sort((p, q) => p - q);
  const q = (p: number) => (a.length ? a[Math.min(a.length - 1, Math.floor(p * (a.length - 1) + 0.5))] : NaN);
  return { n: a.length, median: q(0.5), p95: q(0.95), max: a[a.length - 1] ?? NaN, mean: a.reduce((s, x) => s + x, 0) / (a.length || 1) };
};
