import type { SceneType } from "../src/types";

// One entry per Short. All pipeline scripts take the id as their first CLI argument.
// Paths are relative to ROOT (the folder that holds AUDIO, ASSETS, FINAL OUTPUT).
export type VideoConfig = {
  id: string;
  compositionId: string;
  script: string;
  sourceAudio: string;
  publicAudio: string; // inside REMOTION-3D/public
  output: string;
  fps: number;
  tailSec: number; // hold after the last word for the end card
  maxVoSec: number;
  sceneTypeMap: Record<string, SceneType>;
  // Optional override: chip key "S3-2" -> phrase in VO to anchor the label on
  labelAnchors?: Record<string, string>;
};

export const VIDEOS: Record<string, VideoConfig> = {
  "short-02": {
    id: "short-02",
    compositionId: "Short02",
    script: "skrip-short-02-bunga-flat.md",
    sourceAudio: "AUDIO/30 Oktober 2026/Bunga Flat.mp3",
    publicAudio: "audio/short-02.wav",
    output: "FINAL OUTPUT/30 Oktober 2026/Kenapa bunga flat kelihatan murah (3D v1).mp4",
    fps: 30,
    tailSec: 0.7,
    maxVoSec: 89.5,
    sceneTypeMap: {
      S1: "hook",
      S2: "loan",
      S3: "installment",
      S4: "balance",
      S5: "overpay",
      S6: "effective",
      S7: "nuance",
      S8: "tips",
      S9: "cta",
    },
    labelAnchors: {
      // "Cicilan tetap" is spoken as "Cicilannya sama terus"
      "S3-2": "Cicilannya sama terus",
      // "Jangan bandingin flat vs efektif" lands on "dibandingin langsung"
      "S7-2": "dibandingin langsung",
    },
  },
};

export const getVideo = (id: string | undefined): VideoConfig => {
  const v = id ? VIDEOS[id] : undefined;
  if (!v) {
    throw new Error(`Unknown video id "${id}". Known: ${Object.keys(VIDEOS).join(", ")}`);
  }
  return v;
};
