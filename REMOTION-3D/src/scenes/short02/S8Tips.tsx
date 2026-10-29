// S8 Tips: ask for the effective rate per year; check admin and insurance fees on top of interest.
import React from "react";
import { random } from "remotion";
import { cue } from "../../timeline";
import type { SceneDef } from "../types";
import { CashierDesk, InterestBlock, INTEREST_H } from "../../world/props/desk";
import { Dust, SpeechBubble } from "../../world/props/misc";
import { Coin, Sack } from "../../world/props/money";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { EASE, arc, hop, keys1, keys3, peck, pop, punch, ramp, squash } from "../../anim";
import { DESK_POS, DESK_TOP, add } from "./layout";

const T = {
  ask: cue("S8", 0), // [tanya bunga efektifnya]
  fees: cue("S8", 1), // [biaya admin dan asuransinya]
  extra: cue("S8", 2), // [biaya tambahan]
};
const RED: [number, number, number] = add(DESK_POS, [0.45, DESK_TOP - DESK_POS[1], 0.05]);
const DODI: [number, number, number] = [-1.3, 0.06, 1.3];
const SACK_A: [number, number, number] = [1.6, 0.06, 1.15];
const SACK_B: [number, number, number] = [2.3, 0.06, 0.7];
const SACK_S = 0.55;

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const bubble = pop(f, T.ask + 4, "bouncy");
  const sackPopA = pop(f, T.fees, "bouncy");
  const sackPopB = pop(f, T.fees + 5, "bouncy");
  // Tuti hops to the ADMIN sack and pecks it; coins spill out
  const hopAt = T.fees + 8;
  const tHop = ramp(f, hopAt, hopAt + 10, EASE.inOut);
  const tutiPos = f < hopAt ? ([0.6, 0.06, 1.9] as [number, number, number]) : arc([0.6, 0.06, 1.9], add(SACK_A, [-0.45, 0, 0.25]), tHop, 0.35);
  const peckAt = hopAt + 14;
  const sackHit = squash(f, peckAt + 3, 0.6);
  // Sacks are placed on top of the red interest block as extra height
  const liftA = ramp(f, T.extra + 2, T.extra + 16, EASE.inOut);
  const liftB = ramp(f, T.extra + 12, T.extra + 26, EASE.inOut);
  const onTop = (k: number): [number, number, number] => add(RED, [k === 0 ? -0.18 : 0.2, INTEREST_H + (k === 0 ? 0 : 0.02), k === 0 ? 0.05 : -0.08]);
  const posA = f < T.extra + 2 ? SACK_A : arc(SACK_A, onTop(0), liftA, 1.2);
  const posB = f < T.extra + 12 ? SACK_B : arc(SACK_B, onTop(1), liftB, 1.2);
  const landA = squash(f, T.extra + 16, 0.6);
  const landB = squash(f, T.extra + 26, 0.6);
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.ask - 2, "raiseHand", 6],
    [T.fees - 6, "idle", 8],
    [T.extra, "place", 6],
    [T.extra + 30, "thumbsUp", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.ask, "happy"],
    [T.fees + 4, "surprised"],
    [peckAt + 6, "sweat"],
    [T.extra + 30, "proud"],
  ]);
  return (
    <group>
      <group position={DESK_POS}>
        <CashierDesk />
      </group>
      <group position={RED}>
        <InterestBlock />
      </group>
      {f >= T.ask + 4 && <SpeechBubble position={add(DODI, [0.85, 2.5 + Math.sin(f / 10) * 0.03, 0.1])} rotation={[0, 0.2, 0]} scale={bubble * 0.8} text="EFEKTIF?" tailSide={-1} />}
      {f >= T.fees && <Sack position={posA} rotation={[0, -0.3, 0]} scale={[SACK_S * sackPopA * sackHit[0] * landA[0], SACK_S * sackPopA * sackHit[1] * landA[1], SACK_S * sackPopA * sackHit[0] * landA[0]]} label="ADMIN" color="#7CC3E8" />}
      {f >= T.fees + 5 && <Sack position={posB} rotation={[0, -0.6, 0]} scale={[SACK_S * sackPopB * landB[0], SACK_S * sackPopB * landB[1], SACK_S * sackPopB * landB[0]]} label="ASURANSI" color="#F2B632" />}
      <Dust frame={f} at={T.fees + 3} origin={SACK_A} count={6} spread={0.5} size={0.08} seed="s8a" />
      <Dust frame={f} at={T.fees + 8} origin={SACK_B} count={6} spread={0.5} size={0.08} seed="s8b" />
      {/* Coins spill from the pecked sack */}
      {f >= peckAt + 2 &&
        Array.from({ length: 7 }, (_, k) => {
          const t = Math.min(1, (f - peckAt - 2) / 14);
          const a = random(`s8coin${k}`) * Math.PI * 2;
          const r = 0.5 + random(`s8r${k}`) * 0.5;
          const end: [number, number, number] = add(SACK_A, [Math.cos(a) * r, 0.02, Math.sin(a) * r * 0.7]);
          const p = arc(add(SACK_A, [0, 0.4, 0]), end, t, 0.5);
          return <Coin key={k} position={p} rotation={t < 1 ? [t * 8 + k, 0, t * 5] : [0, k, 0]} scale={0.7} />;
        })}
      <PakDodi frame={f} position={DODI} rotY={keys1(f, [[ctx.from, 0.45], [T.extra - 4, 0.45], [T.extra + 4, 1.1], [T.extra + 30, 0.6]])} pose={pose} expr={expr} />
      <Tuti frame={f} position={[tutiPos[0], tutiPos[1] + (f < hopAt ? hop(f, T.ask + 6, 0.2, 8) : 0), tutiPos[2]]} rotY={f < hopAt ? -0.3 : 0.9} peck={Math.max(peck(f, peckAt, 7), peck(f, ctx.from + 14))} flap={f >= hopAt && f < hopAt + 10 ? 1 : 0} eyesWide={f > peckAt + 3 && f < peckAt + 30} />
    </group>
  );
};

export const S8: SceneDef = {
  id: "S8",
  mood: "golden",
  focus: [0.4, 0, 0.6],
  shadowSize: 8,
  out: "flyby",
  camera: ({ frame: f, from, to }) => {
    // Move 1: push in to Dodi. Move 2: fast pan to the sacks, then follow them onto the block.
    const p = punch(f, T.ask + 4, 0.06);
    if (f < T.fees) {
      const pos = keys3(f, [
        [from, [0.7, 2.2, 7.4]],
        [T.fees, [-0.6, 2.0, 5.9]],
      ]);
      const target = keys3(f, [
        [from, [-0.4, 1.4, 0.8]],
        [T.fees, [-0.6, 1.6, 1.1]],
      ]);
      return { pos, target, fov: 42 / p };
    }
    const pos = keys3(f, [
      [T.fees, [-0.6, 2.0, 5.9]],
      [T.fees + 6, [1.3, 1.8, 5.2]],
      [T.extra, [1.4, 1.9, 5.4]],
      [to, [0.6, 2.2, 6.0]],
    ]);
    const target = keys3(f, [
      [T.fees, [-0.6, 1.6, 1.1]],
      [T.fees + 6, [1.9, 0.8, 0.9]],
      [T.extra, [1.6, 0.85, 0.8]],
      [to, [0.5, 1.45, 0.3]],
    ]);
    return { pos, target, fov: 42, roll: f < T.fees + 6 ? -Math.sin(ramp(f, T.fees, T.fees + 6) * Math.PI) * 0.05 : 0 };
  },
  Set,
};
