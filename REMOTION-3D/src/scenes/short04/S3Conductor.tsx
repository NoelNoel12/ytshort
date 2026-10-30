// S3 Conductor: a giant slice of the lift wall as a stage. Charges wander, shift when rings hit, inside rings fade.
import React from "react";
import * as THREE from "three";
import { random } from "remotion";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue, wordFrame } from "./tl";
import { cabinSteel } from "../../world/short04/Lift";
import { Charge, Ring } from "../../world/short04/Signal";
import { PakDodi } from "../../world/characters/PakDodi";
import { exprAt, poseAt } from "../../world/characters/rig";
import { EASE, keys1, keys3, punch, ramp, sp } from "../../anim";
import { rbox } from "../../world/geom";
import { paint, std } from "../../world/materials";
import { Rings, ringStates, type RingStream } from "./rings";
import { dodiBox } from "./layout";

type V3 = [number, number, number];
const T = {
  cond: cue("S3", 0), // [penghantar]
  hit: cue("S3", 1), // [menabrak dindingnya]
  weak: cue("S3", 2), // [melemahkan gelombang]
  tapi: wordFrame("S3", "tapi"),
};
const STAGE: V3 = [2.2, 0.06, 0.2];
const ROT = -0.6; // outer face turned toward the camera
const W = { h: 2.8, d: 3.4, t: 0.22 };
const N = 26;
// Stage-local point on the outer face -> world
const toWorld = (lx: number, ly: number, lz: number): V3 => {
  const c = Math.cos(ROT);
  const s = Math.sin(ROT);
  return [STAGE[0] + lx * c + lz * s, STAGE[1] + ly, STAGE[2] - lx * s + lz * c];
};
const HIT_L: [number, number] = [1.55, 0.6]; // impact point on the face (y, z)
const HIT = toWorld(W.t / 2 + 0.05, HIT_L[0], HIT_L[1]);

const RINGS: RingStream = {
  from: [9.5, 4.2, 5.5],
  ctrl: [6.5, 2.8, 3.6],
  to: HIT,
  start: T.hit - 30,
  end: T.weak + 30,
  every: 22,
  travel: 30,
  r0: 0.3,
  r1: 0.65,
  mode: () => "bounce",
};

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const appear = sp(f, ctx.from, "soft");
  const charges = sp(f, T.cond, "bouncy");
  const shift = ramp(f, T.hit + 2, T.hit + 22, EASE.out);
  const shine = f >= T.cond && f < T.cond + 30 ? (f - T.cond) / 30 : -1;
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.weak + 4, "scratch", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.hit + 6, "surprised"],
    [T.weak + 6, "confused"],
  ]);
  // Inner ring that thins and fades inside the box
  const inner = ramp(f, T.weak, T.weak + 40, EASE.inOut);
  const innerPos = toWorld(-0.9 - inner * 0.6, 1.5, 0.3);
  return (
    <group>
      <group position={STAGE} rotation={[0, ROT, 0]} scale={[1, appear, 1]}>
        {/* Floor slice of the cabin, inside on -x */}
        <mesh position={[-0.9, 0.06, 0]} geometry={rbox(2.0, 0.12, W.d + 0.2, 0.03)} material={paint("#4A4F58", 0.6, 0.4)} castShadow receiveShadow />
        {/* The wall slice itself */}
        <mesh position={[0, W.h / 2, 0]} geometry={rbox(W.t, W.h, W.d, 0.04)} material={cabinSteel()} castShadow receiveShadow />
        {/* Cut edge shows the metal section */}
        <mesh position={[0, W.h + 0.005, 0]} geometry={rbox(W.t + 0.02, 0.02, W.d + 0.02, 0.008)} material={paint("#8E949C", 0.5, 0.6)} />
        {shine > 0 && <mesh position={[W.t / 2 + 0.01, W.h / 2, (shine - 0.5) * W.d * 1.3]} rotation={[0.5, 0, 0]} geometry={rbox(0.004, W.h * 1.4, 0.3, 0.002)} material={std("wallGlint", { color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 1.5, transparent: true, opacity: 0.55, depthWrite: false } as THREE.MeshStandardMaterialParameters)} />}
        {/* Charges crawling like ants, then crowding to one side after the hit */}
        {charges > 0.01 &&
          Array.from({ length: N }, (_, k) => {
            const bz = (random(`ch-z-${k}`) - 0.5) * (W.d - 0.4);
            const by = 0.3 + random(`ch-y-${k}`) * (W.h - 0.6);
            const t = f / 30;
            const wz = Math.sin(t * (1.3 + random(`ch-a-${k}`)) + k) * 0.18;
            const wy = Math.cos(t * (1.1 + random(`ch-b-${k}`)) + k * 1.7) * 0.12;
            const side = -1.3 + (k % 5) * 0.08;
            const z = bz + wz + (side - bz) * shift * 0.85;
            const y = by + wy;
            const pos = k % 2 ? "#FF8FB8" : "#7FD8FF";
            return <Charge key={k} position={[W.t / 2 + 0.06, y, z]} r={0.06 * charges} color={pos} />;
          })}
        {/* Ripples spreading from the impact point */}
        {f >= T.hit &&
          [0, 1, 2].map((k) => {
            const a = ((f - T.hit - k * 8) % 24) / 24;
            if (f - T.hit - k * 8 < 0) return null;
            return <Ring key={k} position={[W.t / 2 + 0.02, HIT_L[0], HIT_L[1]]} dir={[1, 0, 0]} radius={0.15 + a * 0.9} opacity={(1 - a) * 0.6} color="#BFF3FF" tube={0.025} />;
          })}
      </group>
      <Rings stream={RINGS} frame={f} />
      {/* Weak ring inside */}
      {f >= T.weak && <Ring position={innerPos} dir={[-Math.cos(ROT), 0, Math.sin(ROT)]} radius={0.5 + inner * 0.2} opacity={(1 - inner) * 0.55} tube={0.05 * (1 - inner * 0.8)} />}
      <PakDodi frame={f} position={toWorld(-1.25, 0.12, -0.6)} rotY={keys1(f, [[T.weak - 20, 0.5], [T.weak + 10, -0.35]])} pose={pose} expr={expr} lookAt={f > T.weak ? 0.4 : 0} />
    </group>
  );
};

export const S3: SceneDef = {
  id: "S3",
  mood: "morning",
  focus: STAGE,
  shadowSize: 7,
  out: "whip",
  whipDir: -1,
  camera: ({ frame: f, from, to }) => {
    // Move 1: push in to the wall. Move 2: orbit round to the inside.
    const p = punch(f, T.hit + 1, 0.06);
    const pos = keys3(f, [
      [from, [6.0, 2.6, 8.0]],
      [T.hit, [4.4, 2.1, 5.2]],
      [T.weak - 10, [3.9, 2.0, 4.6]],
      [to, [-1.6, 2.2, 4.4]],
    ]);
    const target = keys3(f, [
      [from, [2.2, 1.5, 0.2]],
      [T.hit, [2.4, 1.5, 0.4]],
      [T.weak - 10, [2.3, 1.5, 0.4]],
      [to, [1.2, 1.4, 0]],
    ]);
    return { pos, target, fov: 42 / p };
  },
  action: ({ frame: f }) => [
    // Charges crowd and the impact point on the wall face
    ...(f >= T.cond ? [{ c: toWorld(W.t / 2, 1.5, -0.6 * (f >= T.hit ? 1 : 0)), r: 0.95 }] : [{ c: toWorld(0, 1.4, 0), r: 0.9 }]),
    ...(f >= T.hit ? [{ c: HIT, r: 0.55 }] : []),
    ...(f > T.weak - 10 ? [dodiBox(toWorld(-1.25, 0.12, -0.6)), { c: toWorld(-1.2, 1.5, 0.3), r: 0.5 }] : []),
    ...ringStates(RINGS, f).map((r) => ({ c: r.pos, r: r.r * 0.9 })),
  ],
  Set,
};

export const S3_SFX: SfxCue[] = [
  { at: T.tapi, name: "whoosh", volume: 0.2 },
  { at: T.cond, name: "sparkle", volume: 0.3 },
  { at: T.hit, name: "boing", volume: 0.3 },
  { at: T.hit + 2, name: "ripple", volume: 0.35 },
  { at: T.weak, name: "fadeOut", volume: 0.3 },
];
