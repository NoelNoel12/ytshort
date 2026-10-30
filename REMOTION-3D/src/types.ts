// Scene type names come from each video's sceneTypeMap (hook and cta have special text handling)
export type SceneType = string;

export type TextSegment = { text: string; highlight: boolean };

// One chip from "Teks layar", split on "/"
export type ScreenChip = { raw: string; plain: string; star: string; segments: TextSegment[] };

export type ActionSpec = { trigger: string; description: string };

export type SceneSpec = {
  id: string; // "S1"
  index: number;
  title: string;
  type: SceneType;
  durationHintSec: number | null;
  vo: string;
  screenText: ScreenChip[];
  actions: ActionSpec[];
  visual: string;
};

export type ScriptData = {
  videoId: string;
  source: string;
  meta: Record<string, string>;
  cast: { name: string; role: string }[];
  scenes: SceneSpec[];
  voText: string;
  voWordCount: number;
};

// Script word with timing (script spelling)
export type TimedWord = {
  i: number;
  text: string; // as in script, with punctuation
  caption: string; // on-screen form
  norm: string;
  scene: string;
  start: number;
  end: number;
  punct: string; // trailing punctuation
};

export type CaptionPage = {
  i: number;
  scene: string;
  words: { text: string; start: number; end: number; wi: number }[];
  start: number; // first word start (s)
  end: number; // last word end (s)
  showFrom: number; // frame
  showTo: number; // frame, exclusive
};

export type LabelCue = {
  scene: string;
  chip: number;
  segments: TextSegment[];
  anchor: string;
  anchorFound: boolean;
  time: number;
  fromFrame: number;
  toFrame: number;
};

export type TriggerCue = {
  scene: string;
  action: number;
  trigger: string;
  description: string;
  found: boolean;
  wordIndex: number;
  time: number;
  frame: number;
};

export type SceneTiming = {
  id: string;
  type: SceneType;
  start: number;
  end: number;
  fromFrame: number;
  toFrame: number;
  firstWord: number;
  lastWord: number;
};

export type Timeline = {
  videoId: string;
  fps: number;
  audio: string;
  audioDurationSec: number;
  durationInFrames: number;
  title: { line1: string; line2: string };
  words: TimedWord[];
  pages: CaptionPage[];
  labels: LabelCue[];
  triggers: TriggerCue[];
  scenes: SceneTiming[];
  silences: { start: number; end: number }[];
};
