// S2 Loan: Pak Dodi borrows 12 juta for a cement mixer; 1% a month looks like 12% a year.
import React from "react";
import { cue, wordFrame } from "../../timeline";
import type { SceneDef } from "../types";
import { CashierDesk, MiniCalendar } from "../../world/props/desk";
import { Board } from "../../world/props/boards";
import { BOARD_STYLE } from "../../world/props/styles";
import { CementMixer, Dust } from "../../world/props/misc";
import { MoneyBundle, MoneyStack, Sack } from "../../world/props/money";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt, walkOffsets } from "../../world/characters/rig";
import { DISPLAY } from "../../finance";
import { EASE, arc, hop, keys1, peck, pop, punch, ramp, sp, squash } from "../../anim";
import { orbit } from "../../world/CameraRig";
import { DESK_POS, DESK_TOP, add } from "./layout";

const T = {
  borrow: cue("S2", 0), // [Pak Dodi minjem]
  molen: cue("S2", 1), // [mesin molen]
  twelve: cue("S2", 2), // [dua belas persen]
  bunga: wordFrame("S2", "bunganya"),
  flat: wordFrame("S2", "flat"),
};

const DODI_END: [number, number, number] = [-1.15, 0.06, 1.25];
const SACK_POS: [number, number, number] = [-0.45, 0.06, 1.85];
const MOLEN_POS: [number, number, number] = [-2.15, 0.06, -0.55];
const BUNDLES = 5;

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  // Walk in from the left, stop in front of the desk
  const walkEnd = T.borrow + 6;
  const tw = ramp(f, ctx.from, walkEnd, EASE.out);
  const dodiX = keys1(f, [
    [ctx.from, -3.4],
    [walkEnd, DODI_END[0]],
    [T.molen + 4, DODI_END[0]],
    [T.molen + 16, -1.45],
  ]);
  const walking = f < walkEnd - 2 || (f > T.molen + 4 && f < T.molen + 16);
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.borrow + 4, "hold", 6],
    [T.borrow + 52, "idle", 8],
    [T.molen + 14, "hug", 8],
    [T.molen + 58, "idle", 10],
    [T.twelve - 10, "point", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.borrow + 12, "excited"],
    [T.molen + 10, "proud"],
    [T.molen + 60, "happy"],
    [T.twelve + 4, "surprised"],
    [T.twelve + 30, "neutral"],
  ]);
  const rot = keys1(f, [
    [ctx.from, Math.PI / 2],
    [walkEnd, 0.9],
    [T.molen + 2, 0.9],
    [T.molen + 10, -0.9],
    [T.molen + 58, -0.9],
    [T.molen + 70, 0.4],
  ]);
  // Bundles fly from the desk into the sack, one by one
  const flights = Array.from({ length: BUNDLES }, (_, k) => T.borrow + 6 + k * 8);
  const landed = flights.filter((s) => f >= s + 10).length;
  const lastLand = landed > 0 ? flights[landed - 1] + 10 : -100;
  const sackSq = squash(f, lastLand, 0.5);
  const molenPop = pop(f, T.molen, "bouncy");
  // One "1%" calendar, then twelve in a row, then the 12% board
  const oneCal = pop(f, T.bunga + 6, "bouncy");
  const rowStart = T.twelve;
  const boardRise = sp(f, T.twelve + 26, "heavy");
  const tutiPeck = Math.max(peck(f, ctx.from + 20), peck(f, ctx.from + 34), peck(f, T.molen + 30), peck(f, T.twelve - 40));
  return (
    <group>
      <group position={DESK_POS}>
        <CashierDesk />
      </group>
      {/* Remaining stack on the desk shrinks as bundles leave */}
      <MoneyStack position={add(DESK_POS, [0.35, DESK_TOP - DESK_POS[1], 0.05])} count={Math.max(0, BUNDLES - flights.filter((s) => f >= s).length)} />
      {flights.map((s, k) => {
        if (f < s || f >= s + 10) return null;
        const t = (f - s) / 10;
        const p = arc(add(DESK_POS, [0.35, DESK_TOP - DESK_POS[1] + 0.05 + (BUNDLES - k) * 0.085, 0.05]), add(SACK_POS, [0, 0.6, 0]), t, 0.9);
        return <MoneyBundle key={k} position={p} rotation={[t * 4, t * 3, 0]} color={k} />;
      })}
      <Sack position={SACK_POS} scale={[sackSq[0], sackSq[1], sackSq[0]]} open bulge={0.62 + 0.08 * landed} color="#D9B98C" />
      <PakDodi frame={f} position={[dodiX, 0.06, DODI_END[2]]} rotY={rot} pose={pose} expr={expr} walk={walking ? walkOffsets(f) : null} />
      {/* Cement mixer pops in */}
      {f >= T.molen && (
        <group position={MOLEN_POS} scale={molenPop}>
          <CementMixer rotY={0.5} spin={(f - T.molen) * 0.08} />
        </group>
      )}
      <Dust frame={f} at={T.molen + 4} origin={MOLEN_POS} count={12} spread={1.3} seed="s2-molen" />
      {/* Calendars */}
      {f >= T.bunga + 6 && f < rowStart + 2 && (
        <group position={[0.2, 2.55 + Math.sin(f / 9) * 0.04, 0.9]} scale={oneCal * 1.4}>
          <MiniCalendar label={DISPLAY.flatMonthly} month={0} />
        </group>
      )}
      {f >= rowStart &&
        Array.from({ length: 12 }, (_, k) => {
          const s = pop(f, rowStart + k * 2, "snappy");
          const x = -2.2 + (k % 6) * 0.78;
          const y = k < 6 ? 2.95 : 2.3;
          return (
            <group key={k} position={[x + 0.25, y + Math.sin(f / 10 + k) * 0.03, 0.9]} scale={s * 1.1}>
              <MiniCalendar label={DISPLAY.flatMonthly} month={k} />
            </group>
          );
        })}
      {f >= T.twelve + 26 && (
        <group position={[1.15, -1.6 + boardRise * 1.66, 1.5]}>
          <Board w={1.0} h={0.6} posts={0.9} wood text={{ key: "b12small", text: DISPLAY.flatYearly, ...BOARD_STYLE.wood }} />
        </group>
      )}
      <Dust frame={f} at={T.twelve + 34} origin={[1.15, 0.08, 1.5]} count={8} spread={0.8} seed="s2-board" />
      <Tuti frame={f} position={[0.35, 0.06 + hop(f, T.molen + 4, 0.35, 10), 2.4]} rotY={-0.6 + (f > T.molen + 4 ? -0.8 : 0)} peck={tutiPeck} flap={f >= T.molen + 4 && f < T.molen + 14 ? 1 : 0} eyesWide={f >= T.molen && f < T.molen + 24} />
    </group>
  );
};

export const S2: SceneDef = {
  id: "S2",
  mood: "morning",
  focus: [-1.0, 0, 0.6],
  shadowSize: 10,
  out: "cut",
  camera: ({ frame: f, from, to }) => {
    // Move 1: slow orbit around Dodi and the mixer. Move 2: pull up to the calendar row.
    const p = punch(f, T.molen + 2, 0.06);
    const a = keys1(f, [
      [from, 0.4],
      [T.twelve - 20, -0.18],
      [to, -0.08],
    ]);
    const r = keys1(f, [
      [from, 7.6],
      [T.molen, 7.0],
      [T.twelve - 20, 7.2],
      [to, 8.4],
    ]);
    const ty = keys1(f, [
      [from, 1.15],
      [T.twelve - 20, 1.25],
      [to, 1.95],
    ]);
    const tx = keys1(f, [
      [from, -1.2],
      [T.molen, -1.3],
      [T.twelve - 20, -0.5],
      [to, -0.1],
    ]);
    const target: [number, number, number] = [tx, ty, 0.6];
    return { pos: orbit(target, r, a, 1.2), target, fov: 44 / p };
  },
  Set,
};

