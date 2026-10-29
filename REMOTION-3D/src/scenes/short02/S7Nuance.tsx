// S7 Nuance: flat is not always bad (fixed installments are easy to plan), but do not compare it with effective.
import React from "react";
import { cue, wordFrame } from "../../timeline";
import type { SceneDef } from "../types";
import { MiniCalendar, WoodTable } from "../../world/props/desk";
import { Board } from "../../world/props/boards";
import { BOARD_STYLE } from "../../world/props/styles";
import { BalanceScale, Dust } from "../../world/props/misc";
import { Envelope } from "../../world/props/money";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { EASE, arc, dropY, keys1, keys3, peck, pop, punch, ramp, sp, squash } from "../../anim";
import { PORCH, add } from "./layout";
import { PlasticChair } from "../../world/street";
import { PottedPlant } from "../../world/nature";

const T = {
  good: cue("S7", 0), // [nggak selalu jelek]
  plan: cue("S7", 1), // [gampang diatur]
  compare: cue("S7", 2), // [dibandingin langsung]
  tapi: wordFrame("S7", "tapi"),
};
const TABLE: [number, number, number] = add(PORCH, [-0.7, 0, 0.15]);
const TOP = TABLE[1] + 0.89;
const SCALE: [number, number, number] = add(PORCH, [1.35, 0, 0.2]);
const PAN_Y = 1.4 - 0.55 + 0.06; // pan surface relative to the scale base
const ENV_N = 3;
const MONTH_NAMES = ["JAN", "FEB", "MAR"];

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  // Envelopes appear messy, Tuti tidies them one by one
  const tidyAt = Array.from({ length: ENV_N }, (_, k) => T.plan + 14 + k * 14);
  const envs = Array.from({ length: ENV_N }, (_, k) => {
    const s = pop(f, T.plan + k * 4, "bouncy");
    const messy: [number, number, number] = [TABLE[0] - 0.55 + k * 0.52 + (k === 1 ? 0.08 : -0.06), TOP + 0.02, TABLE[2] + (k % 2 ? 0.18 : -0.1)];
    const neat: [number, number, number] = [TABLE[0] - 0.62 + k * 0.62, TOP + 0.02, TABLE[2] + 0.12];
    const t = sp(f, tidyAt[k] + 2, "snappy");
    const pos: [number, number, number] = [messy[0] + (neat[0] - messy[0]) * t, messy[1], messy[2] + (neat[2] - messy[2]) * t];
    const rot = (k === 0 ? 0.5 : k === 1 ? -0.4 : 0.3) * (1 - t);
    return { s, pos, rot };
  });
  // Tuti walks along the table to each envelope
  const tutiX = keys1(f, [
    [ctx.from, TABLE[0] - 0.9],
    [tidyAt[0] - 6, TABLE[0] - 0.85],
    [tidyAt[1] - 4, TABLE[0] - 0.25],
    [tidyAt[2] - 4, TABLE[0] + 0.35],
    [T.compare, TABLE[0] + 0.55],
  ]);
  const tutiPeck = Math.max(...tidyAt.map((a) => peck(f, a, 6)), peck(f, ctx.from + 12));
  // Boards onto the scale pans, scale tips to the heavier EFEKTIF side
  const flatDrop = dropY(f, T.compare, 1.0, 7);
  const effDrop = dropY(f, T.compare + 8, 1.0, 7);
  const tilt = f < T.compare + 15 ? 0 : sp(f, T.compare + 15, "wobble") * 0.32;
  const pose = poseAt(f, [
    [ctx.from, "holdCal"],
    [T.good - 4, "thumbsUpHold", 6],
    [T.plan, "idle", 8],
    [T.compare + 14, "shrug", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.good, "proud"],
    [T.plan + 6, "happy"],
    [T.compare + 16, "frown"],
  ]);
  const left = f >= T.compare ? (
    <group position={[0, flatDrop, 0]} rotation={[0, 0.2, 0]}>
      <Board w={0.52} h={0.26} posts={0} text={{ key: "flat", text: "FLAT", ...BOARD_STYLE.flat }} />
    </group>
  ) : null;
  const right = f >= T.compare + 8 ? (
    <group position={[0, effDrop, 0]} rotation={[0, -0.2, 0]}>
      <Board w={0.62} h={0.26} posts={0} text={{ key: "efektif", text: "EFEKTIF", ...BOARD_STYLE.efektif }} />
    </group>
  ) : null;
  return (
    <group>
      <WoodTable position={TABLE} />
      <PlasticChair position={add(PORCH, [-2.3, 0, 0.9])} rotY={0.7} color="#3C7DD9" />
      <PottedPlant position={add(PORCH, [-2.9, 0, -0.9])} seed="pp1" />
      <PottedPlant position={add(PORCH, [3.0, 0, -0.9])} seed="pp2" scale={0.85} />
      <PottedPlant position={add(PORCH, [0.6, 0, -1.1])} seed="pp3" scale={0.7} />
      {envs.map((e, k) =>
        e.s > 0.01 ? <Envelope key={k} position={e.pos} rotation={[0, e.rot, 0]} scale={[e.s * 0.8, e.s * 0.8, e.s * 0.8]} label={MONTH_NAMES[k]} /> : null,
      )}
      <BalanceScale position={SCALE} scale={0.85} tilt={tilt} left={left} right={right} />
      <Dust frame={f} at={T.compare + 7} origin={add(SCALE, [-0.72, PAN_Y, 0])} count={5} spread={0.3} size={0.05} seed="s7a" />
      <PakDodi
        frame={f}
        position={add(PORCH, [-1.15, 0, -0.55])}
        rotY={keys1(f, [[ctx.from, 0.15], [T.compare + 10, 0.15], [T.compare + 20, 0.7]])}
        pose={pose}
        expr={expr}
        leftHand={f < T.plan + 4 ? <MiniCalendar position={[0, 0.02, 0.1]} rotation={[1.8, 0, 0]} scale={0.75} label="" month={0} /> : null}
      />
      <Tuti frame={f} position={[tutiX, TOP, TABLE[2] - 0.25]} rotY={keys1(f, [[ctx.from, 0.6], [tidyAt[0], 0.3], [T.compare, 0.9]])} scale={0.85} peck={tutiPeck} />
    </group>
  );
};

export const S7: SceneDef = {
  id: "S7",
  mood: "golden",
  focus: [PORCH[0] + 0.6, 0, PORCH[2]],
  shadowSize: 8,
  out: "whip",
  whipDir: -1,
  camera: ({ frame: f, from, to }) => {
    // Move 1: slow tracking along the porch. Move 2: close-up on the scale.
    const p = punch(f, T.compare + 15, 0.07);
    if (f < T.compare) {
      const pos = keys3(f, [
        [from, [PORCH[0] + 2.4, 2.1, PORCH[2] + 5.6]],
        [T.plan, [PORCH[0] + 1.2, 2.0, PORCH[2] + 4.9]],
        [T.compare, [PORCH[0] + 0.9, 2.05, PORCH[2] + 4.6]],
      ]);
      const target = keys3(f, [
        [from, [PORCH[0] - 0.1, 1.35, PORCH[2] - 0.2]],
        [T.plan, [TABLE[0] - 0.4, 1.3, TABLE[2]]],
        [T.compare, [TABLE[0] + 0.4, 1.3, TABLE[2]]],
      ]);
      return { pos, target, fov: 42 / p };
    }
    const t = ramp(f, T.compare, T.compare + 14, EASE.inOut);
    const pos = keys3(f, [
      [T.compare, [PORCH[0] + 0.9, 2.05, PORCH[2] + 4.6]],
      [T.compare + 14, [SCALE[0] + 0.1, 2.0, SCALE[2] + 6.3]],
      [to, [SCALE[0] - 0.05, 1.9, SCALE[2] + 5.9]],
    ]);
    const target = keys3(f, [
      [T.compare, [TABLE[0] + 0.4, 1.3, TABLE[2]]],
      [T.compare + 14, [SCALE[0] + 0.05, 1.2, SCALE[2]]],
      [to, [SCALE[0], 1.15, SCALE[2]]],
    ]);
    return { pos, target, fov: (42 - t * 4) / p };
  },
  Set,
};

