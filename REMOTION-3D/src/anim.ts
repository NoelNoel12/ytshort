// Animation helpers. Everything is a pure function of the frame number.
import { Easing, interpolate, random, spring, type SpringConfig } from "remotion";

export const FPS = 30;

// Named spring presets (overshoot and settle)
export const SPRINGS = {
  snappy: { damping: 14, stiffness: 220, mass: 0.6 },
  bouncy: { damping: 8, stiffness: 170, mass: 0.8 },
  heavy: { damping: 16, stiffness: 95, mass: 1.7 },
  soft: { damping: 200, stiffness: 100, mass: 1 },
  wobble: { damping: 5, stiffness: 120, mass: 0.6 },
} satisfies Record<string, Partial<SpringConfig>>;
export type SpringName = keyof typeof SPRINGS;

// 0 before `start`, then springs to 1
export const sp = (frame: number, start: number, preset: SpringName = "snappy", durationInFrames?: number) =>
  frame < start ? 0 : spring({ frame: frame - start, fps: FPS, config: SPRINGS[preset], durationInFrames });

// Spring with a small counter move (anticipation) in the `lead` frames before start
export const spAnticip = (frame: number, start: number, preset: SpringName = "snappy", amount = 0.12, lead = 5) => {
  if (frame < start - lead) return 0;
  if (frame < start) return -amount * Math.sin(((frame - (start - lead)) / lead) * (Math.PI / 2));
  const s = sp(frame, start, preset);
  // Blend out of the anticipation dip over the first frames
  const dip = -amount * Math.max(0, 1 - (frame - start) / 3);
  return s + dip * (1 - s);
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Eased 0..1 ramp between two frames
export const ramp = (frame: number, a: number, b: number, ease: (t: number) => number = Easing.bezier(0.45, 0, 0.2, 1)) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

export const EASE = {
  inOut: Easing.bezier(0.45, 0, 0.2, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.5, 0, 0.75, 0),
  linear: (t: number) => t,
};

// Squash on landing: 3 frames of (x 1.15, y 0.8), then back
export const squash = (frame: number, land: number, depth = 1): [number, number] => {
  const d = frame - land;
  if (d < 0 || d > 9) return [1, 1];
  const k = d < 3 ? 1 : Math.max(0, 1 - (d - 3) / 6);
  const s = k * depth;
  return [1 + 0.15 * s, 1 - 0.2 * s];
};

// Deterministic handheld wobble: sum of sines with fixed phases
export const handheld = (frame: number, amp = 1, seed = 0): [number, number, number] => {
  const t = frame / FPS;
  const p = seed * 1.7;
  return [
    amp * (0.012 * Math.sin(t * 1.3 + p) + 0.006 * Math.sin(t * 2.9 + 1.1 + p)),
    amp * (0.01 * Math.sin(t * 1.7 + 2.3 + p) + 0.005 * Math.sin(t * 3.7 + 0.4 + p)),
    amp * (0.008 * Math.sin(t * 1.1 + 4.1 + p)),
  ];
};

// Decaying camera shake after an impact (seeded random, no Math.random)
export const shake = (frame: number, hit: number, amp = 0.08, dur = 12, seed = "shake"): [number, number, number] => {
  const d = frame - hit;
  if (d < 0 || d > dur) return [0, 0, 0];
  const k = Math.pow(1 - d / dur, 2) * amp;
  return [(random(`${seed}-x-${d}`) - 0.5) * 2 * k, (random(`${seed}-y-${d}`) - 0.5) * 2 * k, (random(`${seed}-z-${d}`) - 0.5) * k];
};

// Punch-in: scale 1 -> 1.08 in 3 frames, settle back over ~12 frames
export const punch = (frame: number, at: number, amount = 0.08) => {
  const d = frame - at;
  if (d < 0) return 1;
  if (d <= 3) return 1 + amount * (d / 3);
  return 1 + amount * Math.max(0, 1 - EASE.out(Math.min(1, (d - 3) / 14)));
};

// Deterministic blink: returns eyelid openness 0..1
export const blink = (frame: number, seed: string, minGap = 55, maxGap = 120) => {
  let t = 0;
  let k = 0;
  while (t <= frame) {
    const gap = minGap + Math.floor(random(`${seed}-${k}`) * (maxGap - minGap));
    const next = t + gap;
    if (frame >= next && frame < next + 5) {
      const d = frame - next;
      return [0.5, 0.05, 0.05, 0.4, 0.85][d];
    }
    if (next > frame) break;
    t = next;
    k++;
  }
  return 1;
};

// Smooth periodic glance value -1..1 with holds
export const glance = (frame: number, seed: number, period = 140) => {
  const t = (frame + seed * 37) / period;
  const base = Math.sin(t * Math.PI * 2);
  return Math.sign(base) * Math.pow(Math.abs(base), 0.5);
};

// Ballistic arc from a to b (t 0..1) with height h
export const arc = (a: [number, number, number], b: [number, number, number], t: number, h: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t) + 4 * h * t * (1 - t),
  lerp(a[2], b[2], t),
];

export const vlerp = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// Piecewise keyframes over frames for vectors: [[frame, value], ...]
export const keys3 = (frame: number, kf: [number, [number, number, number]][], ease = EASE.inOut): [number, number, number] => {
  if (frame <= kf[0][0]) return kf[0][1];
  for (let i = 0; i < kf.length - 1; i++) {
    const [f0, v0] = kf[i];
    const [f1, v1] = kf[i + 1];
    if (frame <= f1) return vlerp(v0, v1, ease((frame - f0) / Math.max(1, f1 - f0)));
  }
  return kf[kf.length - 1][1];
};

export const keys1 = (frame: number, kf: [number, number][], ease = EASE.inOut): number => {
  if (frame <= kf[0][0]) return kf[0][1];
  for (let i = 0; i < kf.length - 1; i++) {
    const [f0, v0] = kf[i];
    const [f1, v1] = kf[i + 1];
    if (frame <= f1) return lerp(v0, v1, ease((frame - f0) / Math.max(1, f1 - f0)));
  }
  return kf[kf.length - 1][1];
};

// Fall from `height` and land at frame `at + dur` (quadratic, like gravity)
export const dropY = (frame: number, at: number, height: number, dur = 7) => {
  if (frame < at) return height;
  const t = Math.min(1, (frame - at) / dur);
  return height * (1 - t * t);
};

// Pop-in scale with overshoot (0 before `at`)
export const pop = (frame: number, at: number, preset: SpringName = "bouncy") => sp(frame, at, preset);

// Hop: short parabolic jump starting at `at`, lasting `dur`
export const hop = (frame: number, at: number, h = 0.3, dur = 10) => {
  const d = frame - at;
  if (d < 0 || d > dur) return 0;
  const t = d / dur;
  return 4 * h * t * (1 - t);
};

// Peck pulse 0..1..0 over 6 frames
export const peck = (frame: number, at: number, dur = 6) => {
  const d = frame - at;
  if (d < 0 || d > dur) return 0;
  return Math.sin((d / dur) * Math.PI);
};
