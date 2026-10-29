// S3 Installment: 1 juta principal + 120 ribu interest, the same stack every month.
import React from "react";
import { cue } from "../../timeline";
import type { SceneDef } from "../types";
import { FlipCalendar, InstallmentBox, InterestBlock, PrincipalBlock, Sparkle } from "../../world/props/desk";
import { Dust } from "../../world/props/misc";
import { Coin } from "../../world/props/money";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { VIS } from "../../finance";
import { dropY, keys3, peck, pop, punch, shake, squash } from "../../anim";
import { STAGE, add } from "./layout";
import { random } from "remotion";

const T = {
  gold: cue("S3", 0), // [satu juta pokok]
  red: cue("S3", 1), // [seratus dua puluh ribu bunga]
  same: cue("S3", 2), // [sama terus]
};
const BOX = STAGE;
const BASE = BOX[1] + 0.1;
const FLIP_EVERY = 5;
const ROW_N = 5;

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const goldLand = T.gold + 8;
  const goldY = dropY(f, T.gold, 3.5, 8);
  const goldSq = squash(f, goldLand, 1);
  const redLand = T.red + 6;
  const redY = dropY(f, T.red, 2.2, 6);
  const redSq = squash(f, redLand, 1);
  // Calendar flips quickly from "sama terus"; each flip adds one identical stack to the row
  const page = f < T.same ? 0 : Math.min(11, (f - T.same) / FLIP_EVERY);
  const flips = Math.floor(page);
  const nod = f >= T.same + 6 ? Math.max(0, Math.sin(((f - T.same - 6) / 9) * Math.PI)) * (f < T.same + 42 ? 1 : 0) : 0;
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.gold - 6, "point", 6],
    [T.gold + 20, "idle", 8],
    [T.same, "thumbsUp", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [goldLand, "surprised"],
    [goldLand + 14, "neutral"],
    [redLand, "happy"],
    [T.same + 4, "proud"],
  ]);
  return (
    <group>
      <InstallmentBox position={BOX} />
      {f >= T.gold && (
        <group position={[BOX[0], BASE + goldY, BOX[2]]} scale={[goldSq[0], goldSq[1], goldSq[0]]}>
          <PrincipalBlock />
        </group>
      )}
      <Dust frame={f} at={goldLand} origin={[BOX[0], BASE, BOX[2] + 0.4]} count={10} spread={0.9} seed="s3-gold" />
      {f >= T.red && (
        <group position={[BOX[0], BASE + VIS.principalBlockH * goldSq[1] + redY, BOX[2]]} scale={[redSq[0], redSq[1], redSq[0]]}>
          <InterestBlock />
        </group>
      )}
      {/* Flip calendar behind the box */}
      <FlipCalendar position={add(BOX, [1.55, 0, -0.9])} scale={1.35} page={page} />
      {/* Row of identical monthly stacks */}
      {Array.from({ length: Math.min(ROW_N, flips) }, (_, k) => {
        const s = pop(f, T.same + (k + 1) * FLIP_EVERY, "bouncy");
        return (
          <group key={k} position={add(BOX, [2.9 + k * 0.82, 0.04, 0.25])} scale={0.62 * s}>
            <PrincipalBlock />
            <InterestBlock position={[0, VIS.principalBlockH, 0]} />
          </group>
        );
      })}
      {/* Light coin sparkle */}
      {f >= redLand &&
        Array.from({ length: 6 }, (_, k) => {
          const t = ((f - redLand + k * 11) % 50) / 50;
          const x = (random(`s3c${k}`) - 0.5) * 1.6;
          return <Coin key={k} position={add(BOX, [x, 2.6 - t * 1.2, 0.9 + (random(`s3z${k}`) - 0.5)])} rotation={[t * 6 + k, t * 4, 0]} scale={0.6 * Math.sin(t * Math.PI)} />;
        })}
      {[0, 1, 2].map((k) => (
        <Sparkle key={k} position={add(BOX, [-0.4 + k * 0.4, BASE + 1.3 + (k % 2) * 0.2, 0.4])} s={f > redLand ? Math.max(0, Math.sin(((f - redLand - k * 7) / 16) * Math.PI)) * 0.8 : 0} />
      ))}
      <PakDodi frame={f} position={add(BOX, [-1.65, 0, 0.75])} rotY={0.75} pose={{ ...pose, head: [pose.head[0] + nod * 0.35, pose.head[1], pose.head[2]] }} expr={expr} />
      <Tuti frame={f} position={add(BOX, [0.95, 0, 1.15])} rotY={-0.4} peck={Math.max(peck(f, ctx.from + 12), peck(f, T.same + 20))} eyesWide={f >= goldLand && f < goldLand + 15} squash={squash(f, goldLand + 1, 0.6)} />
    </group>
  );
};

export const S3: SceneDef = {
  id: "S3",
  mood: "morning",
  focus: [STAGE[0] + 1.5, 0, STAGE[2]],
  shadowSize: 10,
  out: "whip",
  whipDir: -1,
  camera: ({ frame: f, from, to }) => {
    // Move 1: push in on the box. Move 2: track sideways along the row of stacks.
    const sh = shake(f, T.gold + 8, 0.07, 10, "s3");
    const p = punch(f, T.red + 6, 0.06);
    const pos = keys3(f, [
      [from, [STAGE[0] - 1.3, 2.5, STAGE[2] + 7.6]],
      [T.gold, [STAGE[0] - 0.5, 2.3, STAGE[2] + 6.4]],
      [T.same, [STAGE[0] + 0.8, 2.2, STAGE[2] + 6.6]],
      [to, [STAGE[0] + 3.6, 2.3, STAGE[2] + 6.8]],
    ]);
    const target = keys3(f, [
      [from, [STAGE[0] - 0.7, 1.1, STAGE[2]]],
      [T.gold, [STAGE[0] - 0.2, 1.1, STAGE[2]]],
      [T.same, [STAGE[0] + 0.9, 1.05, STAGE[2]]],
      [to, [STAGE[0] + 3.6, 0.95, STAGE[2]]],
    ]);
    return { pos: [pos[0] + sh[0], pos[1] + sh[1], pos[2]], target, fov: 42 / p };
  },
  Set,
};

