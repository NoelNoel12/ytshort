// S5 Overpay: interest is still charged on money already paid back; 12% cracks, 21% rises.
import React from "react";
import * as THREE from "three";
import { cue } from "../../timeline";
import type { SceneDef } from "../types";
import { CashierDesk, InterestBlock, INTEREST_H } from "../../world/props/desk";
import { Board, CrackBoard } from "../../world/props/boards";
import { BOARD_STYLE } from "../../world/props/styles";
import { Dust, Feathers } from "../../world/props/misc";
import { Coin, Jar } from "../../world/props/money";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { DISPLAY, VIS } from "../../finance";
import { EASE, arc, keys1, keys3, punch, ramp, shake, sp, squash } from "../../anim";
import { cyl, rbox, sphere } from "../../world/geom";
import { M, std } from "../../world/materials";
import { DESK_POS, DESK_TOP, add } from "./layout";

const T = {
  coins: cue("S5", 0), // [uang yang sudah dia balikin]
  sisa: cue("S5", 1), // [sisa utang]
  shock: cue("S5", 2), // [dua puluh satu persen]
};
const JAR: [number, number, number] = [-0.95, 0.06, 1.6];
const TRAY: [number, number, number] = add(DESK_POS, [-0.45, DESK_TOP - DESK_POS[1], 0.1]);
const RED: [number, number, number] = add(DESK_POS, [0.5, DESK_TOP - DESK_POS[1], 0.05]);
const BOARD_Z = -1.0;
const POLE: [number, number, number] = [1.45, 0.06, -0.55];
const POLE_H = 2.4;
const COINS = 6;

const ghost = () => std("ghostCoin", { color: "#FF6B5E", emissive: "#D94B3F", emissiveIntensity: 0.6, transparent: true, opacity: 0.45, depthWrite: false } as THREE.MeshStandardMaterialParameters);

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  // Coins fly from the jar to the desk tray
  const flights = Array.from({ length: COINS }, (_, k) => T.coins + 2 + k * 5);
  // Board crack and collapse, bigger board rises behind
  const crack = ramp(f, T.sisa, T.sisa + 10, EASE.in);
  const fall = ramp(f, T.sisa + 12, T.sisa + 30, EASE.in);
  const riseAt = T.sisa + 16;
  const rise = sp(f, riseAt, "heavy");
  // Tuti on a pole, falls at "dua puluh satu persen"
  const fallAt = T.shock + 3;
  const tFall = ramp(f, fallAt, fallAt + 14, EASE.in);
  const tutiTop: [number, number, number] = [POLE[0], POLE[1] + POLE_H + 0.06, POLE[2]];
  const tutiGround: [number, number, number] = [POLE[0] + 0.7, 0.06, POLE[2] + 0.9];
  const tutiPos = f < fallAt ? tutiTop : arc(tutiTop, tutiGround, tFall, 0.3);
  const tutiRoll = f < fallAt ? 0 : keys1(f, [[fallAt, 0], [fallAt + 14, Math.PI / 2], [fallAt + 40, Math.PI / 2], [fallAt + 52, 0]]);
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.coins + 10, "surprised", 6],
    [T.coins + 50, "pointLeft", 8],
    [riseAt + 4, "surprised", 5],
    [T.shock + 20, "shrug", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.coins + 8, "surprised"],
    [T.coins + 50, "confused"],
    [riseAt + 2, "surprised"],
    [T.shock + 18, "sweat"],
  ]);
  const redSq = squash(f, T.coins + 30, 0.5);
  return (
    <group>
      <group position={DESK_POS}>
        <CashierDesk />
      </group>
      <Jar position={JAR} fill={VIS.jarFill(6)} />
      {/* Coin tray on the desk */}
      <mesh position={add(TRAY, [0, 0.03, 0])} geometry={cyl(0.32, 0.28, 0.06, 40)} material={M.woodDark()} castShadow receiveShadow />
      {flights.map((s, k) => {
        if (f < s) return null;
        const t = Math.min(1, (f - s) / 12);
        const p = arc(add(JAR, [0, 1.15, 0]), add(TRAY, [(k % 3) * 0.12 - 0.12, 0.08 + Math.floor(k / 3) * 0.025, (k % 2) * 0.1 - 0.05]), t, 1.0);
        return <Coin key={k} position={p} rotation={t < 1 ? [t * 9, 0, t * 5] : [0, k, 0]} scale={0.9} />;
      })}
      {/* Red block keeps charging: ghost coins of the paid-back money circle above it */}
      <group position={RED} scale={[redSq[0], redSq[1], redSq[0]]}>
        <InterestBlock />
      </group>
      {f >= T.coins + 20 &&
        Array.from({ length: 3 }, (_, k) => {
          const a = (f - T.coins) * 0.08 + (k * Math.PI * 2) / 3;
          const s = sp(f, T.coins + 20 + k * 4, "bouncy");
          return (
            <group key={k} position={add(RED, [Math.cos(a) * 0.45, INTEREST_H + 0.45 + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.3])} rotation={[Math.PI / 2, 0, a]} scale={s}>
              <mesh geometry={cyl(0.09, 0.09, 0.022, 40)} material={ghost()} />
            </group>
          );
        })}
      {/* 12% board cracks and falls apart */}
      {f < T.sisa + 40 && <CrackBoard position={[0, 0.06, BOARD_Z]} w={1.2} h={VIS.boardFlatH} text={{ key: "b12", text: DISPLAY.flatYearly, ...BOARD_STYLE.wood }} crack={crack} fall={fall} posts={1.45} />}
      {f >= riseAt && (
        <group position={[0, 0.06 - (1 - rise) * (VIS.boardEffectiveH + 1.2), BOARD_Z - 0.35]}>
          <Board w={1.5} h={VIS.boardEffectiveH} posts={1.3} wood text={{ key: "b21", text: DISPLAY.effectiveYearlyShort, ...BOARD_STYLE.red }} />
        </group>
      )}
      <Dust frame={f} at={riseAt + 8} origin={[0, 0.08, BOARD_Z - 0.3]} count={16} spread={2.0} seed="s5-rise" color="#D8CBB5" size={0.2} />
      <Dust frame={f} at={T.sisa + 28} origin={[0, 0.08, BOARD_Z + 0.2]} count={10} spread={1.2} seed="s5-fall" />
      {/* Pole for Tuti */}
      <mesh position={[POLE[0], POLE[1] + POLE_H / 2, POLE[2]]} geometry={cyl(0.06, 0.08, POLE_H, 20)} material={M.wood()} castShadow />
      <mesh position={[POLE[0], POLE[1] + POLE_H, POLE[2]]} geometry={rbox(0.36, 0.06, 0.2, 0.02)} material={M.woodDark()} castShadow />
      <Tuti frame={f} position={tutiPos} rotY={-0.5} roll={tutiRoll} eyesWide={f >= T.shock - 2} flap={f >= fallAt && f < fallAt + 14 ? 1 : 0} shadow={f >= fallAt + 10} />
      <Feathers frame={f} at={fallAt} origin={tutiTop} seed="s5-feathers" count={9} />
      <Dust frame={f} at={fallAt + 14} origin={tutiGround} count={6} spread={0.4} size={0.07} seed="s5-tuti" />
      <PakDodi frame={f} position={[-1.6, 0.06, 0.75]} rotY={0.45} pose={pose} expr={expr} />
    </group>
  );
};

export const S5: SceneDef = {
  id: "S5",
  mood: "dim",
  focus: [0, 0, 0],
  shadowSize: 9,
  out: "whip",
  whipDir: 1,
  camera: ({ frame: f, from, to }) => {
    // Move 1: low push-in on the desk. Move 2: tilt up to the 21% board, shake on landing.
    const sh = shake(f, T.sisa + 24, 0.1, 14, "s5");
    const p = punch(f, T.shock + 2, 0.07);
    const pos = keys3(f, [
      [from, [2.2, 0.75, 6.6]],
      [T.sisa, [1.2, 0.8, 5.2]],
      [T.sisa + 30, [0.9, 0.9, 5.9]],
      [to, [1.4, 1.0, 6.1]],
    ]);
    const target = keys3(f, [
      [from, [-0.4, 1.3, 0.4]],
      [T.sisa, [-0.2, 1.5, 0]],
      [T.sisa + 30, [0.2, 2.2, -0.6]],
      [to, [0.6, 2.0, -0.4]],
    ]);
    return { pos: [pos[0] + sh[0], pos[1] + sh[1], pos[2] + sh[2]], target, fov: 44 / p };
  },
  Set,
};
