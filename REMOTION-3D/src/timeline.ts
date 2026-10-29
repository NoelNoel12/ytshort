// Timeline data for Short 02 and small lookup helpers used by scenes.
import raw from "../data/short-02.timeline.json";
import type { Timeline } from "./types";
import { normTokens } from "./lib/text";

export const TL = raw as unknown as Timeline;

// Absolute frame at which action k of a scene starts (word start of its trigger)
export const cue = (scene: string, k: number): number => {
  const t = TL.triggers.find((x) => x.scene === scene && x.action === k);
  if (!t) throw new Error(`No trigger ${scene}[${k}]`);
  return t.frame;
};

// Frame of the nth occurrence of a word inside a scene ("tapi", "jadi" beats)
export const wordFrame = (scene: string, word: string, nth = 0): number => {
  const w = normTokens(word).join(" ");
  const hits = TL.words.filter((x) => x.scene === scene && x.norm === w);
  const hit = hits[Math.min(nth, hits.length - 1)];
  return hit ? Math.round(hit.start * TL.fps) : sceneRange(scene).from;
};

export const sceneRange = (id: string) => {
  const s = TL.scenes.find((x) => x.id === id)!;
  return { from: s.fromFrame, to: s.toFrame };
};
