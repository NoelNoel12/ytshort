// S6 Shaft: the cabin races up and down; the antenna belongs on the shaft wall, not on the cabin.
import React from "react";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue, sceneRange } from "./tl";
import { Cabin, CABIN, LandingDoor } from "../../world/short04/Lift";
import { Phone, Ring, ShaftAntenna, SignalBars } from "../../world/short04/Signal";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { EASE, keys1, pop, punch, ramp, shake } from "../../anim";
import { BLD, CAB, GROUND, PHONE_HAND, floorY, dodiBox, hudPos, hudVol } from "./layout";

type V3 = [number, number, number];
const T = {
  move: cue("S6", 0), // [bergerak naik turun]
  shaft: cue("S6", 1), // [poros lift]
  pass: cue("S6", 2), // [bukan ikut kabin]
};
const R = sceneRange("S6");
// Cabin height keys: up, down, up again, then a smooth pass up by the shaft antenna
const CAB_KEYS: [number, number][] = [
  [R.from, GROUND],
  [T.move, GROUND],
  [T.move + 18, floorY(3)],
  [T.move + 26, floorY(3)],
  [T.move + 44, GROUND],
  [T.move + 52, GROUND],
  [T.move + 70, floorY(2)],
  [T.move + 80, floorY(2)],
  [T.pass, floorY(2)],
  [R.to, floorY(3) + 0.8],
];
const cabY = (f: number) => keys1(f, CAB_KEYS, EASE.inOut);
// Passengers lag the cabin: acceleration pushes them to the floor or lifts them to the ceiling
const liftAt = (f: number) => Math.max(0, Math.min(0.75, -(cabY(f + 1) - 2 * cabY(f) + cabY(f - 1)) * 9));
const STOPS = [T.move + 18, T.move + 44, T.move + 70];
const ANTENNA: V3 = [BLD.shaft.x1 - 0.06, floorY(2) + 1.4, CAB[2] + 0.6];

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const y = cabY(f);
  const lift = liftAt(f);
  const ant = pop(f, T.shaft, "bouncy");
  const pose = poseAt(f, [
    [ctx.from, "phoneLook"],
    [T.move, "surprised", 4],
    [T.shaft, "phoneLook", 8],
    [T.pass + 6, "thumbsUp", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "happy"],
    [T.move, "surprised"],
    [T.shaft + 4, "neutral"],
    [T.pass + 6, "proud"],
  ]);
  return (
    <group>
      <LandingDoor open={0} />
      {f >= T.shaft && <group position={ANTENNA} scale={1.5 * ant}><ShaftAntenna position={[0, 0, 0]} rotY={Math.PI} on={1} /></group>}
      {f >= T.shaft && <group position={ANTENNA} scale={ant}>{[0, 1].map((k) => {
        const a = ((f - T.shaft - k * 10) % 20) / 20;
        return f - T.shaft - k * 10 >= 0 ? <Ring key={k} position={[-0.12 - a * 0.25, 0, a * 0.3]} dir={[-0.6, 0, 0.8]} radius={0.14 + a * 0.45} opacity={(1 - a) * 0.9} tube={0.04} color="#9CFFB8" /> : null;
      })}</group>}
      <Cabin y={y} door={0} light={1}>
        <PakDodi frame={f} position={[0.1, lift, 0.1]} rotY={0.15} pose={pose} expr={expr} squash={[1 + lift * 0.1, 1 - lift * 0.12]} rightHand={<Phone {...PHONE_HAND} bars={4} />} />
        <Tuti frame={f} position={[-0.55, lift * 1.4, 0.45]} rotY={0.6} flap={lift > 0.1 ? 1 : 0} eyesWide={f >= T.move && f < T.shaft} shadow={lift < 0.05} />
      </Cabin>
      <group position={hudPos(-1, y)}>
        <SignalBars position={[0, 0, 0]} level={4} scale={0.9} frame={f} />
      </group>
    </group>
  );
};

export const S6: SceneDef = {
  id: "S6",
  mood: "golden",
  focus: [-0.8, 5, -9],
  shadowSize: 12,
  out: "whip",
  whipDir: 1,
  camera: ({ frame: f }) => {
    // Vertical tracking with the cabin (smoothed), shake on every hard stop
    const track = (cabY(f - 3) + cabY(f) + cabY(f + 3)) / 3;
    // From "bukan ikut kabin" the camera stops following: the antenna stays, the cabin leaves
    const hold = ramp(f, T.pass - 2, T.pass + 8, EASE.inOut);
    const y = track * (1 - hold) + floorY(2) * hold;
    const sh = STOPS.map((s) => shake(f, s, 0.07, 10, `s6${s}`)).reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], [0, 0, 0]);
    const p = punch(f, T.pass + 4, 0.05);
    const orbitX = keys1(f, [
      [R.from, 0.9],
      [T.shaft, -0.4],
      [R.to, 0.2],
    ]);
    return { pos: [orbitX + sh[0], y + 2.3 + sh[1], -2.6], target: [-0.6, y + 1.5, -8.8], fov: 44 / p };
  },
  action: ({ frame: f }) => {
    const y = cabY(f);
    return [
      dodiBox([CAB[0] + 0.1, y + liftAt(f), CAB[2] + 0.1]),
      hudVol(-1, y),
      ...(f >= T.shaft ? [{ c: ANTENNA, r: 0.5 }] : []),
    ];
  },
  Set,
};

export const S6_SFX: SfxCue[] = [
  { at: T.move, name: "rumble", volume: 0.3, durationInFrames: 96 },
  ...STOPS.map((s) => ({ at: s, name: "thud", volume: 0.4 })),
  { at: T.shaft, name: "pop", volume: 0.3 },
  { at: T.pass + 4, name: "blip", volume: 0.3 },
];
