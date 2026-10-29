// S6 Effective: EFEKTIF grows out of a cutaway soil block; two 12% boards almost match 21%.
import React from "react";
import { cue } from "../../timeline";
import type { SceneDef } from "../types";
import { Board } from "../../world/props/boards";
import { BOARD_STYLE } from "../../world/props/styles";
import { Dust, SoilBlock } from "../../world/props/misc";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { DISPLAY, VIS } from "../../finance";
import { EASE, dropY, hop, keys1, peck, punch, ramp, sp, squash } from "../../anim";
import { orbit } from "../../world/CameraRig";
import { GARDEN, add } from "./layout";
import { Bush } from "../../world/nature";

const T = {
  eff: cue("S6", 0), // [bunga efektif]
  twice: cue("S6", 1), // [hampir dua kali lipat]
};
const TOP_Y = 1.0;
const STAGE: [number, number, number] = [GARDEN[0], TOP_Y, GARDEN[2]];
const LEFT = add(STAGE, [-0.55, 0, -0.7]);
const RIGHT = add(STAGE, [0.95, 0, -0.7]);
const BAR_W = 1.05;
const HEAD_H = 0.42;
const POST = 0.12;
const H12 = VIS.boardFlatH;
const H21 = VIS.boardEffectiveH;

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  // EFEKTIF column grows out of the soil
  const grow = sp(f, T.eff, "heavy");
  // Second 12% board drops onto the first one
  const dupAt = T.twice + 4;
  const dupY = dropY(f, dupAt, 1.6, 9);
  const dupSq = squash(f, dupAt + 9, 0.8);
  const stacked = f >= dupAt;
  const flatHeadY = keys1(f, [
    [dupAt, POST + H12 + 0.07],
    [dupAt + 9, POST + 2 * H12 + 0.07 * 2],
  ], EASE.out);
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.eff + 4, "surprised", 6],
    [T.eff + 30, "point", 8],
    [T.twice + 14, "compare", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.eff + 2, "surprised"],
    [T.eff + 34, "neutral"],
    [T.twice + 16, "confused"],
    [T.twice + 50, "frown"],
  ]);
  const tutiHop = hop(f, T.eff + 2, 0.4, 12);
  return (
    <group>
      <SoilBlock position={[GARDEN[0], TOP_Y, GARDEN[2]]} size={[5.4, 1.6, 3.4]} />
      <Bush position={add(STAGE, [-2.2, 0, 1.1])} scale={0.55} seed="s6b1" />
      <Bush position={add(STAGE, [2.3, 0, 1.2])} scale={0.5} seed="s6b2" />
      {/* FLAT column: 12% board plus header */}
      <Board position={LEFT} w={BAR_W} h={H12} posts={POST} wood text={{ key: "bar12", text: DISPLAY.flatYearly, ...BOARD_STYLE.wood }} />
      {stacked && (
        <group position={add(LEFT, [0, POST + H12 + 0.07 + dupY, 0])} scale={[dupSq[0], dupSq[1], dupSq[0]]}>
          <Board w={BAR_W} h={H12} posts={0} wood text={{ key: "bar12", text: DISPLAY.flatYearly, ...BOARD_STYLE.wood }} />
        </group>
      )}
      <Board position={add(LEFT, [0, flatHeadY, 0.02])} w={BAR_W} h={HEAD_H} posts={0} text={{ key: "flat", text: "FLAT", ...BOARD_STYLE.flat }} />
      {/* EFEKTIF column: 21% board plus header, height from finance.ts */}
      {f >= T.eff && (
        <group position={RIGHT} scale={[1, Math.max(0.001, grow), 1]}>
          <Board w={BAR_W} h={H21} posts={POST} wood text={{ key: "bar21", text: DISPLAY.effectiveYearlyShort, ...BOARD_STYLE.red }} />
          <Board position={[0, POST + H21 + 0.07, 0.02]} w={BAR_W} h={HEAD_H} posts={0} text={{ key: "efektif", text: "EFEKTIF", ...BOARD_STYLE.efektif }} />
        </group>
      )}
      <Dust frame={f} at={T.eff + 2} origin={add(RIGHT, [0, 0.02, 0.3])} count={14} spread={1.2} seed="s6-grow" color="#B48A62" size={0.12} />
      <Dust frame={f} at={dupAt + 9} origin={add(LEFT, [0, POST + H12 + 0.1, 0.2])} count={6} spread={0.5} size={0.06} seed="s6-dup" />
      <PakDodi frame={f} position={add(STAGE, [-1.7, 0, 1.1])} rotY={keys1(f, [[ctx.from, 0.5], [T.twice + 10, 0.5], [T.twice + 20, 0.9]])} pose={pose} expr={expr} />
      <Tuti frame={f} position={add(STAGE, [1.95, tutiHop, 1.1])} rotY={0.6} peck={Math.max(peck(f, ctx.from + 8), peck(f, ctx.from + 20), peck(f, T.twice + 40))} flap={tutiHop > 0.01 ? 1 : 0} eyesWide={f >= T.eff && f < T.eff + 30} />
    </group>
  );
};

export const S6: SceneDef = {
  id: "S6",
  mood: "warm",
  focus: [GARDEN[0], 0, GARDEN[2]],
  shadowSize: 10,
  out: "cut",
  camera: ({ frame: f, from, to }) => {
    // Move 1: orbit around the soil stage. Move 2: pull out and up for the comparison.
    const p = punch(f, T.twice + 13, 0.06);
    const a = keys1(f, [
      [from, 0.42],
      [T.twice, 0.02],
      [to, -0.18],
    ]);
    const r = keys1(f, [
      [from, 8.6],
      [T.eff + 20, 8.0],
      [T.twice, 8.2],
      [to, 9.6],
    ]);
    const ty = keys1(f, [
      [from, 1.75],
      [T.eff + 20, 2.05],
      [to, 2.3],
    ]);
    const target: [number, number, number] = [GARDEN[0] - 0.2, ty, GARDEN[2] + 0.4];
    return { pos: orbit(target, r, a, 0.05), target, fov: 44 / p };
  },
  Set,
};

