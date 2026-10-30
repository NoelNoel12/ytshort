// Pose and expression data for the joint-based characters (no skeletons).
type R = [number, number, number];

export type Pose = {
  armL: R; // shoulder rotation (x forward swing, y twist, z raise outward)
  armR: R;
  elbowL: number; // bend (radians, positive bends the forearm forward)
  elbowR: number;
  legL: number; // hip swing
  legR: number;
  kneeL: number;
  kneeR: number;
  torso: R;
  head: R;
  lift: number; // vertical body offset
};

const z: R = [0, 0, 0];

export const POSES = {
  idle: { armL: [0.05, 0, 0.18], armR: [0.05, 0, -0.18], elbowL: 0.25, elbowR: 0.25, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: z, head: z, lift: 0 },
  wave: { armL: [0.05, 0, 0.18], armR: [0, 0, -2.5], elbowR: 0.6, elbowL: 0.25, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0, 0, 0.05], head: [0, 0, -0.08], lift: 0 },
  point: { armL: [0.05, 0, 0.2], armR: [-1.45, 0.2, -0.1], elbowL: 0.25, elbowR: 0.05, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.06, -0.1, 0], head: [0.05, -0.1, 0], lift: 0 },
  pointLeft: { armL: [-1.45, -0.2, 0.1], armR: [0.05, 0, -0.2], elbowL: 0.05, elbowR: 0.25, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.06, 0.1, 0], head: [0.05, 0.1, 0], lift: 0 },
  pointViewer: { armL: [0.05, 0, 0.2], armR: [-1.5, 0, -0.05], elbowL: 0.25, elbowR: 0, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.05, 0, 0], head: [0, 0, 0], lift: 0 },
  thumbsUp: { armL: [0.05, 0, 0.18], armR: [-1.1, 0.3, -0.25], elbowL: 0.25, elbowR: 1.25, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0, 0, 0.04], head: [0, 0, 0.06], lift: 0 },
  hug: { armL: [-1.2, 0.5, 0.25], armR: [-1.2, -0.5, -0.25], elbowL: 0.9, elbowR: 0.9, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.12, 0, 0], head: [0.1, 0, 0.12], lift: 0 },
  hold: { armL: [-0.9, 0.35, 0.15], armR: [-0.9, -0.35, -0.15], elbowL: 0.7, elbowR: 0.7, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.05, 0, 0], head: [0.15, 0, 0], lift: 0 },
  holdUp: { armL: [-2.3, 0.2, 0.3], armR: [-2.3, -0.2, -0.3], elbowL: 0.4, elbowR: 0.4, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [-0.05, 0, 0], head: [-0.2, 0, 0], lift: 0 },
  cheer: { armL: [0, 0, 2.5], armR: [0, 0, -2.5], elbowL: 0.3, elbowR: 0.3, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [-0.05, 0, 0], head: [-0.1, 0, 0], lift: 0.05 },
  surprised: { armL: [-0.3, 0, 1.2], armR: [-0.3, 0, -1.2], elbowL: 0.6, elbowR: 0.6, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [-0.12, 0, 0], head: [-0.15, 0, 0], lift: 0.03 },
  shrug: { armL: [-0.4, 0, 0.9], armR: [-0.4, 0, -0.9], elbowL: 1.4, elbowR: 1.4, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0, 0, 0], head: [0, 0, 0.18], lift: 0 },
  scratch: { armL: [0.05, 0, 0.18], armR: [-2.0, -0.6, -0.7], elbowL: 0.25, elbowR: 1.9, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0, 0, -0.05], head: [0.05, 0, -0.18], lift: 0 },
  raiseHand: { armL: [0.05, 0, 0.18], armR: [-2.9, 0, -0.15], elbowL: 0.25, elbowR: 0.15, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0, 0, 0.05], head: [-0.05, 0, 0], lift: 0 },
  compare: { armL: [-1.0, -0.2, 0.3], armR: [-1.6, 0.3, -0.2], elbowL: 0.4, elbowR: 0.1, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.05, 0.15, 0], head: [-0.15, 0.2, 0], lift: 0 },
  thumbsUpHold: { armL: [-0.95, 0.35, 0.15], armR: [-1.1, 0.3, -0.25], elbowL: 0.95, elbowR: 1.25, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0, 0, 0.04], head: [0, 0, 0.06], lift: 0 },
  holdCal: { armL: [-0.95, 0.35, 0.15], armR: [0.05, 0, -0.2], elbowL: 0.95, elbowR: 0.25, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0, 0, 0], head: [0.12, 0, 0], lift: 0 },
  phoneEar: { armL: [0.05, 0, 0.18], armR: [-0.762, 1.22, -2.17], elbowL: 0.25, elbowR: 0.846, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0, 0, 0.04], head: [0, -0.15, 0.12], lift: 0 },
  phoneUp: { armL: [0.05, 0, 0.3], armR: [-2.95, 0, -0.25], elbowL: 0.25, elbowR: 0.2, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [-0.06, 0, 0.06], head: [-0.35, 0, 0], lift: 0.04 },
  phoneLook: { armL: [-0.6, 0.3, 0.2], armR: [-1.05, -0.35, -0.2], elbowL: 0.9, elbowR: 1.0, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.08, 0, 0], head: [0.3, 0, 0], lift: 0 },
  nod: { armL: [0.05, 0, 0.18], armR: [0.05, 0, -0.18], elbowL: 0.25, elbowR: 0.25, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.05, 0, 0], head: [0.25, 0, 0], lift: 0 },
  place: { armL: [-1.3, 0.25, 0.1], armR: [-1.3, -0.25, -0.1], elbowL: 0.35, elbowR: 0.35, legL: 0, legR: 0, kneeL: 0, kneeR: 0, torso: [0.3, 0, 0], head: [0.25, 0, 0], lift: -0.03 },
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lr = (a: R, b: R, t: number): R => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const blendPose = (a: Pose, b: Pose, t: number): Pose => ({
  armL: lr(a.armL, b.armL, t),
  armR: lr(a.armR, b.armR, t),
  elbowL: lerp(a.elbowL, b.elbowL, t),
  elbowR: lerp(a.elbowR, b.elbowR, t),
  legL: lerp(a.legL, b.legL, t),
  legR: lerp(a.legR, b.legR, t),
  kneeL: lerp(a.kneeL, b.kneeL, t),
  kneeR: lerp(a.kneeR, b.kneeR, t),
  torso: lr(a.torso, b.torso, t),
  head: lr(a.head, b.head, t),
  lift: lerp(a.lift, b.lift, t),
});

// Pose track: [[frame, pose, transitionFrames]], blended with an ease
export const poseAt = (frame: number, track: [number, PoseName, number?][]): Pose => {
  let cur: Pose = POSES[track[0][1]];
  for (let i = 1; i < track.length; i++) {
    const [f, name, dur = 8] = track[i];
    if (frame < f) break;
    const t = Math.min(1, (frame - f) / dur);
    // Ease out with a small overshoot for snappy poses
    const e = t < 1 ? 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.08 : 1;
    cur = blendPose(cur, POSES[name], e);
  }
  return cur;
};

// Walk cycle offsets added on top of a pose
export type WalkOffsets = { legL: number; legR: number; kneeL: number; kneeR: number; bob: number };
export const walkOffsets = (frame: number, speed = 1): WalkOffsets => {
  const ph = (frame / 30) * Math.PI * 2 * 1.8 * speed;
  const s = Math.sin(ph);
  return {
    legL: 0.55 * s,
    legR: -0.55 * s,
    kneeL: Math.max(0, -Math.sin(ph + 0.6)) * 0.7,
    kneeR: Math.max(0, Math.sin(ph + 0.6)) * 0.7,
    bob: Math.abs(Math.cos(ph)) * 0.05,
  };
};

export type Mouth = "smile" | "grin" | "open" | "o" | "flat" | "frown" | "wavy";
export type Expression = { eye: number; eyeY: number; brow: number; browY: number; mouth: Mouth; blush: number; sweat: boolean; sparkle: boolean };

export const EXPRESSIONS = {
  neutral: { eye: 1, eyeY: 1, brow: 0, browY: 0, mouth: "smile", blush: 0.7, sweat: false, sparkle: false },
  happy: { eye: 1, eyeY: 0.55, brow: -0.15, browY: 0.02, mouth: "grin", blush: 1, sweat: false, sparkle: false },
  excited: { eye: 1.25, eyeY: 1.15, brow: -0.2, browY: 0.03, mouth: "grin", blush: 1, sweat: false, sparkle: true },
  surprised: { eye: 1.35, eyeY: 1.35, brow: -0.1, browY: 0.05, mouth: "o", blush: 0.6, sweat: false, sparkle: false },
  sweat: { eye: 1.1, eyeY: 1.1, brow: 0.35, browY: 0.01, mouth: "wavy", blush: 0.5, sweat: true, sparkle: false },
  proud: { eye: 1, eyeY: 0.45, brow: -0.2, browY: 0.02, mouth: "grin", blush: 1, sweat: false, sparkle: false },
  confused: { eye: 1, eyeY: 1, brow: 0.4, browY: 0, mouth: "flat", blush: 0.6, sweat: false, sparkle: false },
  frown: { eye: 0.95, eyeY: 0.85, brow: 0.45, browY: -0.01, mouth: "frown", blush: 0.4, sweat: false, sparkle: false },
} satisfies Record<string, Expression>;

export type ExpressionName = keyof typeof EXPRESSIONS;

// Expression track: last key at or before frame wins (faces swap on a beat)
export const exprAt = (frame: number, track: [number, ExpressionName][]): Expression => {
  let cur: Expression = EXPRESSIONS[track[0][1]];
  for (const [f, name] of track) if (frame >= f) cur = EXPRESSIONS[name];
  return cur;
};
