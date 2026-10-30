// S5 Repeater: an outside antenna catches the signal, a cable brings it in, a small antenna spreads it in the cabin.
import React from "react";
import * as THREE from "three";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue, sceneRange } from "./tl";
import { Cabin, CABIN, LandingDoor } from "../../world/short04/Lift";
import { Cable, IndoorAntenna, Phone, Ring, RoofAntenna, SignalBars } from "../../world/short04/Signal";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { EASE, keys1, keys3, punch, ramp } from "../../anim";
import { BLD, CAB, GROUND, PHONE_HAND, TOWER_TOP, floorY, dodiBox, hudPos, hudVol } from "./layout";
import { ROOF_Y } from "../../world/short04/Building";
import { Rings, ringStates, type RingStream } from "./rings";

type V3 = [number, number, number];
const T = {
  outside: cue("S5", 0), // [antena di luar]
  cable: cue("S5", 1), // [kabelnya masuk]
  inside: cue("S5", 2), // [antena kecil di dalam]
};
const R = sceneRange("S5");
const ANT: V3 = [2.4, ROOF_Y, -10.0];
const ANT_TIP: V3 = [ANT[0], ANT[1] + 1.8, ANT[2]];
const X = BLD.shaft.x1 + 0.34;
const CABLE_PTS: V3[] = [
  [ANT[0], ROOF_Y + 0.08, ANT[2]],
  [1.4, ROOF_Y + 0.1, -8.8],
  [X, ROOF_Y + 0.05, -7.88],
  [X, floorY(4), -7.88],
  [X, floorY(2), -7.88],
  [X, GROUND + 3.1, -7.88],
  [CAB[0] + 0.5, GROUND + CABIN.h + 0.12, CAB[2] + 0.6],
  [CAB[0], GROUND + CABIN.h - 0.05, CAB[2] + 0.2],
];
const CURVE = new THREE.CatmullRomCurve3(CABLE_PTS.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.1);
const CABLE_DUR = T.inside - T.cable;
const tipAt = (f: number): V3 => {
  const p = CURVE.getPointAt(Math.max(0.001, Math.min(1, (f - T.cable) / CABLE_DUR)));
  return [p.x, p.y, p.z];
};
const RINGS: RingStream = { from: TOWER_TOP, ctrl: [6.5, ROOF_Y + 4, -8.5], to: ANT_TIP, start: T.outside - 6, end: R.to, every: 18, travel: 24, r0: 0.3, r1: 0.6, mode: () => "fade" };

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const yaw = keys1(f, [
    [ctx.from, 2.4],
    [T.outside, 2.4],
    [T.outside + 22, -0.75],
  ], EASE.inOut);
  const caught = f > T.outside + 26 ? 1 : 0;
  const progress = ramp(f, T.cable, T.inside, EASE.linear);
  const lit = ramp(f, T.inside, T.inside + 8);
  const bars = f < T.inside + 4 ? 1 : Math.min(4, 1 + Math.floor((f - T.inside - 4) / 6));
  const pose = poseAt(f, [
    [ctx.from, "phoneUp"],
    [T.inside + 10, "phoneLook", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "sweat"],
    [T.inside + 12, "excited"],
  ]);
  // Tuti follows the cable tip down
  const tip = tipAt(f);
  const tuti: V3 = f < T.cable ? [ANT[0] - 0.8, ROOF_Y + 0.02, ANT[2] + 0.6] : [tip[0] + 0.7, tip[1] + 0.5, -7.7];
  return (
    <group>
      <LandingDoor open={0} />
      <Cabin y={GROUND} door={0} light={1}>
        <PakDodi frame={f} position={[0.15, 0, 0.1]} rotY={0.1} pose={pose} expr={expr} rightHand={<Phone {...PHONE_HAND} bars={bars} />} />
        <IndoorAntenna position={[0, CABIN.h - 0.03, 0.2]} on={lit} />
      </Cabin>
      <RoofAntenna position={ANT} yaw={yaw} glow={caught} />
      <Rings stream={RINGS} frame={f} />
      <Cable id="s5" points={CABLE_PTS} progress={progress} />
      {/* New rings spreading inside the cabin */}
      {f >= T.inside &&
        [0, 1, 2, 3].map((k) => {
          const a = ((f - T.inside - k * 9) % 36) / 36;
          if (f - T.inside - k * 9 < 0) return null;
          return <Ring key={k} position={[CAB[0], GROUND + CABIN.h - 0.4 - a * 0.6, CAB[2] + 0.2]} dir={[0, 1, 0]} radius={0.15 + a * 0.85} opacity={(1 - a) * 0.8} tube={0.03} color="#9CFFB8" />;
        })}
      <group position={hudPos(1)}>
        <SignalBars position={[0, 0, 0]} level={bars} scale={0.9} frame={f} shake={bars <= 1 ? 1 : 0} />
      </group>
      <Tuti frame={f} position={tuti} rotY={f < T.cable ? -0.6 : 2.6} flap={f >= T.cable && f < T.inside + 10 ? 1 : 0} tuck={f >= T.cable && f < T.inside + 10} bodyTilt={f >= T.cable ? 0.4 : 0} shadow={f < T.cable} />
    </group>
  );
};

export const S5: SceneDef = {
  id: "S5",
  mood: "morning",
  focus: [0.5, 8, -9],
  shadowSize: 14,
  out: "cut",
  camera: ({ frame: f, from, to }) => {
    // Move 1: tilt up from the cabin to the roof. Move 2: track the cable down to the cabin.
    const p = punch(f, T.inside + 2, 0.06);
    if (f < T.cable) {
      const pos = keys3(f, [
        [from, [0.4, 2.6, -2.6]],
        [from + 20, [0.6, 3.4, -1.8]],
        [T.outside - 6, [3.2, ROOF_Y + 3.0, -1.0]],
        [T.cable, [2.6, ROOF_Y + 2.6, -2.2]],
      ]);
      const target = keys3(f, [
        [from, [-0.8, 1.9, -8.8]],
        [from + 20, [-0.6, 2.4, -8.6]],
        [T.outside - 6, [2.2, ROOF_Y + 1.2, -9.6]],
        [T.cable, [2.0, ROOF_Y + 0.8, -9.4]],
      ]);
      return { pos, target, fov: 42 };
    }
    const tip = tipAt(f);
    const settle = ramp(f, T.inside, to, EASE.inOut);
    const ty = tip[1] * (1 - settle) + (GROUND + 1.6) * settle;
    return { pos: [1.4 - settle * 1.0, ty + 1.1, -1.8 - settle * 0.6], target: [tip[0] * (1 - settle) + (CAB[0] + 0.1) * settle, ty, Math.min(-8.4, tip[2] - 0.5) * (1 - settle) - 8.4 * settle], fov: 44 / p };
  },
  action: ({ frame: f }) => [
    ...(f < T.cable ? [{ c: ANT_TIP, r: 0.9 }] : f < T.inside ? [{ c: tipAt(f), r: 0.55 }] : []),
    // New rings under the indoor antenna, Dodi's face, the bars
    ...(f >= T.inside ? [{ c: [CAB[0], GROUND + CABIN.h - 0.5, CAB[2] + 0.2] as V3, r: 0.6 }, hudVol(1)] : []),
    ...(f < R.from + 25 || f >= T.inside ? [dodiBox([CAB[0] + 0.15, GROUND, CAB[2] + 0.1])] : []),
    ...ringStates(RINGS, f).map((r) => ({ c: r.pos, r: r.r })),
  ],
  Set,
};

export const S5_SFX: SfxCue[] = [
  { at: R.from + 22, name: "whoosh", volume: 0.2 },
  { at: T.outside, name: "servo", volume: 0.35 },
  { at: T.outside + 26, name: "blip", volume: 0.3 },
  { at: T.cable, name: "zip", volume: 0.3 },
  { at: T.cable + 20, name: "zip", volume: 0.22 },
  { at: T.inside, name: "barsUp", volume: 0.34 },
];
