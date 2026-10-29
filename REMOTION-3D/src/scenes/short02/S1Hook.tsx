// S1 Hook: the simplest interest rule appears on a kampung road.
import React from "react";
import { cue, wordFrame } from "../../timeline";
import type { SceneDef } from "../types";
import { CashierDesk, Calculator, DESK, Sparkle } from "../../world/props/desk";
import { Board } from "../../world/props/boards";
import { BOARD_STYLE } from "../../world/props/styles";
import { Dust } from "../../world/props/misc";
import { Tuti } from "../../world/characters/Tuti";
import { DISPLAY } from "../../finance";
import { EASE, arc, dropY, hop, keys1, keys3, peck, punch, ramp, squash } from "../../anim";
import { orbit } from "../../world/CameraRig";
import { M } from "../../world/materials";
import { rbox } from "../../world/geom";

const D: [number, number, number] = [0, 0.06, 0.4];
const TOP = D[1] + DESK.h + 0.08;
const BOARD_POS: [number, number, number] = [0.55, TOP, D[2] + 0.05];

const T = {
  desk: cue("S1", 0), // [bunga paling gampang]
  flat: cue("S1", 1), // [bunga flat]
  pricey: cue("S1", 2), // [padahal aslinya lebih mahal]
  hitung: wordFrame("S1", "hitung"),
  tapi: wordFrame("S1", "tapi"),
};

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  // Desk falls in, lands with squash and dust
  const deskLand = T.desk + 7;
  const deskY = dropY(f, T.desk, 3.2, 7);
  const deskSq = squash(f, deskLand, 0.8);
  const deskVisible = f >= T.desk - 6;
  // Shadow grows just before the drop (anticipation)
  const pre = ramp(f, T.desk - 6, deskLand);
  // Calculator lands next, lights up on "hitung"
  const calcAt = T.desk + 20;
  const calcY = dropY(f, calcAt, 2.2, 7);
  const calcSq = squash(f, calcAt + 7, 0.6);
  // FLAT board: "tok" onto the desk
  const flatY = dropY(f, T.flat, 0.9, 6);
  const flatSq = squash(f, T.flat + 6, 1);
  const shine = f >= T.tapi + 4 ? ((f - (T.tapi + 4)) % 40) / 26 : -1;
  // Foreshadow: a dark silhouette grows slowly behind the board
  const shadowGrow = ramp(f, T.pricey, ctx.to, EASE.inOut);
  // Tuti: pecking the road, startled by the desk, then flies onto the desk and pecks the board once
  const flyAt = T.flat + 8;
  const tFly = ramp(f, flyAt, flyAt + 14, EASE.inOut);
  const tutiStart: [number, number, number] = [1.5, 0.06, 1.9];
  const tutiDesk: [number, number, number] = [0.05, TOP, D[2] + 0.12];
  const startled = hop(f, deskLand, 0.35, 12);
  const tutiPos = f < flyAt ? ([tutiStart[0] + ramp(f, deskLand, deskLand + 12) * 0.5, tutiStart[1] + startled, tutiStart[2] + ramp(f, deskLand, deskLand + 12) * 0.4] as [number, number, number]) : arc([2.0, 0.06, 2.3], tutiDesk, tFly, 1.2);
  const peckAt = T.flat + 26;
  const tutiPeck = f < flyAt ? Math.max(peck(f, 10), peck(f, 22), peck(f, 70), peck(f, 84), peck(f, 120)) : peck(f, peckAt, 7);
  const tutiFlap = (f >= deskLand && f < deskLand + 12) || (f >= flyAt && f < flyAt + 14) ? 1 : 0;
  const tutiTurn = f >= T.pricey + 6 ? keys1(f, [[T.pricey + 6, 0], [T.pricey + 12, -1.2]]) : 0;

  return (
    <group>
      {/* Anticipation shadow on the road */}
      {f < deskLand && f >= T.desk - 6 && (
        <mesh position={[D[0], 0.075, D[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[pre * 1.4, pre * 0.7, 1]} material={M.blob()} renderOrder={2}>
          <circleGeometry args={[1.2, 40]} />
        </mesh>
      )}
      {deskVisible && f >= T.desk && (
        <group position={[D[0], D[1] + deskY, D[2]]} scale={[deskSq[0], deskSq[1], deskSq[0]]}>
          <CashierDesk />
          {f >= calcAt && (
            <group position={[-0.42, DESK.h + 0.13 + calcY, 0.02]} scale={[calcSq[0], calcSq[1], calcSq[0]]}>
              <Calculator rotation={[0.28, 0.25, 0]} line={`${DISPLAY.loan} x ${DISPLAY.flatMonthly}`} on={f >= T.hitung ? 1 : 0} />
            </group>
          )}
        </group>
      )}
      <Dust frame={f} at={deskLand} origin={[D[0], 0.08, D[2]]} count={14} spread={1.6} seed="s1-desk" />
      <Dust frame={f} at={T.flat + 6} origin={[BOARD_POS[0], TOP, BOARD_POS[2]]} count={6} spread={0.4} size={0.06} seed="s1-flat" />
      {f >= T.flat && (
        <group position={[BOARD_POS[0], BOARD_POS[1] + flatY, BOARD_POS[2]]} scale={[flatSq[0], flatSq[1], flatSq[0]]} rotation={[0, -0.15, 0]}>
          {/* Growing silhouette behind (foreshadowing) */}
          {shadowGrow > 0 && (
            <mesh position={[0, 0.3 + shadowGrow * 0.55, -0.45 - shadowGrow * 0.3]} scale={[1 + shadowGrow * 2.2, 1 + shadowGrow * 2.2, 1]} geometry={rbox(0.78, 0.42, 0.02, 0.04)} material={M.shadowBoard()} renderOrder={1} />
          )}
          <Board w={0.66} h={0.32} posts={0.14} text={{ key: "flat", text: "FLAT", ...BOARD_STYLE.flat }} shine={shine} glow={f >= T.tapi ? 0.12 : 0} />
          {f >= T.tapi + 2 &&
            [
              [-0.45, 0.62, 0.1, 0],
              [0.42, 0.5, 0.1, 6],
              [0.1, 0.78, 0.12, 12],
              [-0.25, 0.25, 0.14, 18],
            ].map(([x, y, z, delay], k) => {
              const s = Math.max(0, Math.sin(((f - T.tapi - delay) / 14) * Math.PI)) * 0.9;
              return <Sparkle key={k} position={[x, y, z]} s={f - T.tapi - delay > 0 && f < T.pricey ? s : 0} />;
            })}
        </group>
      )}
      <Tuti frame={f} position={tutiPos} rotY={f < flyAt ? -0.9 + ramp(f, deskLand, deskLand + 6) * 0.4 : keys1(f, [[flyAt, -1.6], [flyAt + 14, 1.2]])} scale={1.05} peck={tutiPeck} flap={tutiFlap} headTurn={tutiTurn} eyesWide={f >= T.pricey + 6 || (f >= deskLand && f < deskLand + 20)} />
    </group>
  );
};

export const S1: SceneDef = {
  id: "S1",
  mood: "morning",
  focus: [0, 0, 0.4],
  shadowSize: 9,
  out: "whip",
  whipDir: 1,
  camera: ({ frame: f }) => {
    // Move 1: diagonal dolly along the road. Move 2: punch-in on FLAT. Move 3: slow orbit toward the board.
    const p = punch(f, T.flat + 6, 0.08) * punch(f, T.pricey, 0.05);
    if (f < T.tapi) {
      const pos = keys3(f, [
        [0, [6.2, 2.7, 8.6]],
        [T.flat, [2.6, 2.0, 5.0]],
        [T.tapi, [2.0, 1.95, 4.3]],
      ]);
      const target = keys3(f, [
        [0, [-1.5, 0.9, -1.8]],
        [T.flat, [0.0, 0.85, 0.2]],
        [T.tapi, [0.25, 0.95, 0.35]],
      ]);
      return { pos, target, fov: 42 / p };
    }
    const a = keys1(f, [
      [T.tapi, 0.42],
      [T.pricey, 0.15],
      [T.pricey + 80, -0.12],
    ]);
    const r = keys1(f, [
      [T.tapi, 4.3],
      [T.pricey, 3.7],
      [T.pricey + 80, 4.9],
    ]);
    const ty = keys1(f, [
      [T.tapi, 1.0],
      [T.pricey + 80, 1.45],
    ]);
    return { pos: orbit([0.45, ty, 0.4], r, a, 0.75), target: [0.45, ty, 0.4], fov: 42 / p };
  },
  Set,
};

