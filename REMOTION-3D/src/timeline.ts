// Timeline data per video and small lookup helpers used by scenes.
import raw02 from "../data/short-02.timeline.json";
import type { Timeline } from "./types";
import { normTokens } from "./lib/text";

export type TimelineHelpers = {
  TL: Timeline;
  cue: (scene: string, k: number) => number;
  wordFrame: (scene: string, word: string, nth?: number) => number;
  sceneRange: (id: string) => { from: number; to: number };
};

export const makeTimeline = (raw: unknown): TimelineHelpers => {
  const TL = raw as Timeline;
  const sceneRange = (id: string) => {
    const s = TL.scenes.find((x) => x.id === id)!;
    return { from: s.fromFrame, to: s.toFrame };
  };
  // Absolute frame at which action k of a scene starts (word start of its trigger)
  const cue = (scene: string, k: number): number => {
    const t = TL.triggers.find((x) => x.scene === scene && x.action === k);
    if (!t) throw new Error(`No trigger ${scene}[${k}]`);
    return t.frame;
  };
  // Frame of the nth occurrence of a word inside a scene ("tapi", "jadi" beats)
  const wordFrame = (scene: string, word: string, nth = 0): number => {
    const w = normTokens(word).join(" ");
    const hits = TL.words.filter((x) => x.scene === scene && x.norm === w);
    const hit = hits[Math.min(nth, hits.length - 1)];
    return hit ? Math.round(hit.start * TL.fps) : sceneRange(scene).from;
  };
  return { TL, cue, wordFrame, sceneRange };
};

// Short 02 bindings (its scenes import these directly)
export const { TL, cue, wordFrame, sceneRange } = makeTimeline(raw02);
