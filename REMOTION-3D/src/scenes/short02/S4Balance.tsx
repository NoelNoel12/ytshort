// S4 Balance: the debt jar shrinks every month, the red interest block stays the same.
import React from "react";
import { cue } from "../../timeline";
import type { SceneDef } from "../types";
import { FlipCalendar, InterestBlock } from "../../world/props/desk";
import { Jar } from "../../world/props/money";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { VIS } from "../../finance";
import { EASE, arc, keys1, keys3, peck, punch, ramp, squash } from "../../anim";
import { rbox } from "../../world/geom";
import { M } from "../../world/materials";
import { STAGE, add } from "./layout";

const T = {
  down: cue("S4", 0), // [utangnya terus turun]
  six: cue("S4", 1), // [bulan keenam]
  same: cue("S4", 2), // [tetap seratus dua puluh ribu]
};
const STEP = Math.round((T.six - T.down) / 5); // five flips land on JUN at "bulan keenam"
const JAR: [number, number, number] = add(STAGE, [-1.1, 0, 0.2]);
const RED: [number, number, number] = add(STAGE, [1.55, 0, 0.35]);
const PED_H = 0.7;

// Months paid at frame f (1 on JAN at the first cue, 6 on JUN)
const paidAt = (f: number) => (f < T.down + 4 ? 0 : Math.min(6, 1 + Math.floor((f - T.down - 4) / STEP)));

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const paid = paidAt(f);
  // Smooth the jar level after each payment
  const prevPaid = paidAt(f - 6);
  const k = paid === prevPaid ? 1 : ramp(f, T.down + 4 + (paid - 1) * STEP, T.down + 10 + (paid - 1) * STEP, EASE.out);
  const fill = VIS.jarFill(prevPaid) + (VIS.jarFill(paid) - VIS.jarFill(prevPaid)) * k;
  const page = f < T.down ? 0 : Math.min(5, Math.max(0, (f - T.down - 4) / STEP));
  // Red block pulses each month at the same height (still charges 120 ribu)
  const payFrames = Array.from({ length: 6 }, (_, i) => T.down + 4 + i * STEP);
  const lastPay = payFrames.filter((p) => f >= p).pop() ?? -100;
  const redSq = squash(f, lastPay + 2, 0.45);
  // Tuti hops onto the jar lid at "bulan keenam" and peeks in
  const hopAt = T.six + 4;
  const tHop = ramp(f, hopAt, hopAt + 12, EASE.inOut);
  const tutiPos = f < hopAt ? add(JAR, [0.75, 0, 0.7]) : arc(add(JAR, [0.75, 0, 0.7]), add(JAR, [0, 1.25, 0.05]), tHop, 0.7);
  const peekPeck = f > hopAt + 14 ? 0.85 + Math.sin(f / 4) * 0.1 : Math.max(peck(f, ctx.from + 10), peck(f, ctx.from + 60));
  // Dodi points jar <-> block, confused
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.down + 2, "pointLeft", 8],
    [T.six + 20, "idle", 8],
    [T.same, "point", 5],
    [T.same + 12, "pointLeft", 5],
    [T.same + 24, "point", 5],
    [T.same + 36, "scratch", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.down + 10, "happy"],
    [T.same, "confused"],
    [T.same + 30, "sweat"],
  ]);
  const look = f >= T.same ? (Math.floor((f - T.same) / 12) % 2 ? 0.5 : -0.5) : 0;
  return (
    <group>
      <Jar position={JAR} fill={fill} />
      <FlipCalendar position={add(STAGE, [0.2, 0, -1.3])} scale={1.25} page={page} />
      {/* Pedestal and red interest block */}
      <mesh position={[RED[0], RED[1] + PED_H / 2, RED[2]]} geometry={rbox(1.1, PED_H, 0.9, 0.05)} material={M.concrete()} castShadow receiveShadow />
      <group position={[RED[0], RED[1] + PED_H, RED[2]]} scale={[redSq[0], redSq[1], redSq[0]]}>
        <InterestBlock />
      </group>
      <PakDodi frame={f} position={add(STAGE, [0.15, 0, 0.75])} rotY={0} pose={pose} expr={expr} lookAt={look} />
      <Tuti frame={f} position={tutiPos} rotY={f < hopAt ? -0.8 : 0.2} peck={peekPeck} flap={f >= hopAt && f < hopAt + 12 ? 1 : 0} eyesWide={f > hopAt + 16} />
    </group>
  );
};

export const S4: SceneDef = {
  id: "S4",
  mood: "morning",
  focus: [STAGE[0], 0, STAGE[2]],
  shadowSize: 9,
  out: "flyby",
  camera: ({ frame: f, from, to }) => {
    // Move 1: push in from wide to the jar. Move 2: fast whip-pan to the red block.
    const p = punch(f, T.six + 2, 0.06);
    if (f < T.same) {
      const pos = keys3(f, [
        [from, [STAGE[0] + 0.5, 3.0, STAGE[2] + 7.6]],
        [T.six, [JAR[0] + 0.6, 2.1, JAR[2] + 4.4]],
        [T.same, [JAR[0] + 0.4, 2.2, JAR[2] + 3.6]],
      ]);
      const target = keys3(f, [
        [from, [STAGE[0], 1.0, STAGE[2]]],
        [T.six, [JAR[0] + 0.2, 1.1, JAR[2]]],
        [T.same, [JAR[0], 1.2, JAR[2]]],
      ]);
      return { pos, target, fov: 42 / p };
    }
    // Whip to the block over 6 frames, then a slow push
    const w = ramp(f, T.same, T.same + 6, EASE.in);
    const tgt = keys3(f, [
      [T.same, [JAR[0], 1.2, JAR[2]]],
      [T.same + 6, [RED[0] - 0.3, 1.1, RED[2]]],
      [to, [RED[0] - 0.5, 1.1, RED[2]]],
    ], EASE.linear);
    const pos = keys3(f, [
      [T.same, [JAR[0] + 0.4, 2.2, JAR[2] + 3.6]],
      [T.same + 6, [RED[0] + 0.9, 2.0, RED[2] + 4.2]],
      [to, [RED[0] + 0.6, 1.9, RED[2] + 3.7]],
    ]);
    return { pos, target: tgt, fov: 42, roll: Math.sin(w * Math.PI) * -0.06 };
  },
  Set,
};

