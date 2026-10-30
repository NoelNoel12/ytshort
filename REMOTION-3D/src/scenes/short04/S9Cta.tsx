// S9 CTA: the SANGKAR FARADAY label spins into the answer card, comment balloons, long pull-back to the end card.
import React from "react";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue, sceneRange, wordFrame } from "./tl";
import { Cabin } from "../../world/short04/Lift";
import { WoodLabel } from "../../world/short04/Signal";
import { AnswerCard, CommentBubble } from "../../world/props/misc";
import { Sparkle } from "../../world/props/desk";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { EASE, keys1, keys3, peck, pop, ramp, sp } from "../../anim";
import { Rings, ringStates, type RingStream } from "./rings";
import { rboxW } from "../../world/geom";
import { M } from "../../world/materials";
import { dodiBox } from "./layout";

type V3 = [number, number, number];
const T = {
  answer: cue("S9", 0), // [jawabannya]
  you: cue("S9", 1), // [kamu yang pilih]
  noel: cue("S9", 2), // [Noel Menjawab]
  cage: wordFrame("S9", "sinyal"),
};
const R = sceneRange("S9");
const SPIN = 20;
const MODEL: V3 = [1.55, 0.86, 1.2];
const CRATE_H = 0.8;
const MODEL_S = 0.5;
const DODI: V3 = [-1.25, 0.06, 0.9];
const RINGS: RingStream = { from: [7, 3.2, 3.0], ctrl: [4.2, 2.2, 2.4], to: [MODEL[0] + 0.62, MODEL[1] + 0.65, MODEL[2] + 0.3], start: T.cage, end: T.you, every: 18, travel: 22, r0: 0.25, r1: 0.4, mode: () => "bounce" };
const BALLOONS: { p: V3; icon: "dots" | "heart" | "?"; color: string }[] = [
  { p: [-2.1, 3.4, -0.4], icon: "?", color: "#FFFFFF" },
  { p: [1.9, 3.9, -0.8], icon: "heart", color: "#FFF4D6" },
  { p: [-0.4, 4.7, -1.2], icon: "dots", color: "#FFFFFF" },
  { p: [2.6, 2.7, 0.2], icon: "?", color: "#E8F4FF" },
  { p: [-2.8, 4.9, -1.8], icon: "dots", color: "#FFF4D6" },
  { p: [1.1, 5.7, -2.0], icon: "heart", color: "#FFFFFF" },
];

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const spin = ramp(f, T.answer, T.answer + SPIN, EASE.inOut) * Math.PI * 2;
  const isCard = f >= T.answer + SPIN / 2;
  const check = sp(f, T.answer + SPIN, "bouncy");
  const model = pop(f, T.cage, "bouncy");
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.answer + SPIN, "thumbsUp", 8],
    [T.cage + 10, "pointLeft", 8],
    [T.you, "pointViewer", 8],
    [T.noel - 6, "cheer", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.answer + SPIN, "proud"],
    [T.you, "excited"],
    [T.noel, "happy"],
  ]);
  return (
    <group>
      <group position={[0, 0.06, 0.2]}>
        <mesh position={[0.1, 0.6, -0.06]}>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#7A5232" roughness={0.7} />
        </mesh>
        <group position={[0.1, 1.75, 0]} rotation={[0, spin, 0]} scale={0.82}>{!isCard ? <WoodLabel text="SANGKAR FARADAY" w={2.2} h={0.6} /> : <AnswerCard check={check} />}</group>
        {[0, 1, 2, 3].map((k) => (
          <Sparkle key={k} position={[-0.9 + k * 0.6, 2.5 + (k % 2) * 0.25, 0.2]} s={f > T.answer + SPIN ? Math.max(0, Math.sin(((f - T.answer - SPIN - k * 5) / 16) * Math.PI)) : 0} />
        ))}
      </group>
      {/* A small cage model with rings bouncing off it */}
      {f >= T.cage && (
        <mesh position={[MODEL[0], 0.06 + (CRATE_H / 2) * model, MODEL[2]]} scale={[1, model, 1]} geometry={rboxW(1.2, CRATE_H, 1.2, 0.04, 1.2)} material={M.woodLight()} castShadow receiveShadow />
      )}
      {f >= T.cage && (
        <group position={MODEL} scale={MODEL_S * model}>
          <Cabin y={0} at={[0, 0, 0]} cage={1} light={0.6} />
        </group>
      )}
      <Rings stream={RINGS} frame={f} tube={0.035} />
      {BALLOONS.map((b, k) => {
        const s = pop(f, T.you + k * 4, "bouncy");
        if (s < 0.01) return null;
        return <CommentBubble key={k} position={[b.p[0], b.p[1] + Math.sin(f / 14 + k) * 0.08, b.p[2]]} scale={s * 1.2} icon={b.icon} color={b.color} />;
      })}
      <PakDodi frame={f} position={DODI} rotY={keys1(f, [[ctx.from, 0.35], [T.cage + 6, 0.6], [T.you, 0.15]])} pose={pose} expr={expr} />
      <Tuti frame={f} position={[0.35, 0.06, 2.7]} rotY={keys1(f, [[ctx.from, -0.5], [T.you, -0.15]])} scale={1.1} sunglasses peck={Math.max(peck(f, ctx.from + 16), peck(f, T.answer + SPIN + 4))} flap={f >= T.you && f < T.you + 16 ? 1 : 0} />
    </group>
  );
};

export const S9: SceneDef = {
  id: "S9",
  mood: "golden",
  focus: [0, 0, 0.8],
  shadowSize: 9,
  camera: ({ frame: f, from, to }) => {
    // Move 1: settle on the answer card. Move 2: long pull-back up into the sky.
    if (f < T.you) {
      const pos = keys3(f, [
        [from, [0.9, 2.1, 6.3]],
        [T.answer + SPIN, [0.4, 2.2, 5.9]],
        [T.cage, [0.4, 2.5, 8.6]],
        [T.you, [-0.3, 2.5, 8.3]],
      ]);
      const target = keys3(f, [
        [from, [-0.45, 1.5, 0.3]],
        [T.answer + SPIN, [-0.4, 1.6, 0.3]],
        [T.cage, [0.2, 1.3, 0.6]],
        [T.you, [0, 1.6, 0.4]],
      ]);
      return { pos, target, fov: 42 };
    }
    const pos = keys3(f, [
      [T.you, [-0.3, 2.5, 8.3]],
      [T.noel, [0.2, 3.8, 11.0]],
      [to, [0.4, 7.5, 17.0]],
    ], EASE.inOut);
    const target = keys3(f, [
      [T.you, [0, 1.6, 0.4]],
      [T.noel, [0, 2.7, -0.5]],
      [to, [0, 3.7, -3]],
    ], EASE.inOut);
    return { pos, target, fov: 42 };
  },
  action: ({ frame: f }) => [
    { c: [0.1, 1.81, 0.2], r: 0.7 },
    dodiBox(DODI),
    ...(f >= T.cage && f < T.you ? [{ c: [MODEL[0], MODEL[1] + 0.6, MODEL[2]] as V3, r: 0.7 }] : []),
    ...ringStates(RINGS, f).map((r) => ({ c: r.pos, r: r.r })),
  ],
  Set,
};

export const S9_SFX: SfxCue[] = [
  { at: T.answer, name: "whoosh", volume: 0.25 },
  { at: T.answer + SPIN, name: "correct", volume: 0.4 },
  { at: T.cage, name: "pop", volume: 0.28 },
  ...[0, 1, 2].map((k) => ({ at: T.cage + 22 + k * 18, name: "boing", volume: 0.22 })),
  ...BALLOONS.map((_, k) => ({ at: T.you + k * 4, name: "pop", volume: 0.2 + (k % 2) * 0.05 })),
  { at: T.noel, name: "bigPop", volume: 0.45 },
  { at: R.to - 70, name: "whoosh", volume: 0.18 },
];
