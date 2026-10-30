// S4 Faraday: the cabin turns into a see-through cage, one thin ring slips through the door gap, one bar left.
import React from "react";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue, sceneRange } from "./tl";
import { Cabin, CABIN, LandingDoor } from "../../world/short04/Lift";
import { Phone, Ring, SignalBars, WoodLabel } from "../../world/short04/Signal";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { EASE, keys1, keys3, peck, punch, ramp, sp } from "../../anim";
import { CAB, CABIN_HIT, GROUND, PHONE_HAND, RING_Z, TOWER_TOP, floorY, dodiBox, hudPos, hudVol } from "./layout";
import { Rings, ringStates, type RingStream } from "./rings";

type V3 = [number, number, number];
const T = {
  cage: cue("S4", 0), // [sangkar Faraday]
  leak: cue("S4", 1), // [nggak nahan sinyal dengan sempurna]
  weak: cue("S4", 2), // [jauh melemah]
};
const FROM = sceneRange("S4").from;
const RINGS: RingStream = { from: TOWER_TOP, ctrl: [7.0, 10.5, RING_Z + 0.6], to: CABIN_HIT, start: FROM - 20, end: 1160, every: 20, travel: 30, r0: 0.3, r1: 0.7, mode: () => "fade" };
const GAP: V3 = [CAB[0] - CABIN.w / 2 - 0.05, GROUND + 1.25, CAB[2]];
const LEAK_FROM: V3 = [-4.6, GROUND + 1.6, CAB[2] + 0.4];
const TUTI: V3 = [-2.7, GROUND, CAB[2] + 0.9];
const BOARD_Y = GROUND + CABIN.h + 0.42; // SANGKAR FARADAY board just above the cabin roof

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const cage = ramp(f, T.cage, T.cage + 18, EASE.inOut);
  const label = sp(f, T.cage + 4, "bouncy");
  // The thin ring that sneaks through the door gap and fades inside
  const lt = ramp(f, T.leak, T.leak + 34, EASE.linear);
  const leakPos: V3 = lt < 0.6 ? [LEAK_FROM[0] + (GAP[0] - LEAK_FROM[0]) * (lt / 0.6), LEAK_FROM[1] + (GAP[1] - LEAK_FROM[1]) * (lt / 0.6), LEAK_FROM[2] + (GAP[2] - LEAK_FROM[2]) * (lt / 0.6)] : [GAP[0] + (lt - 0.6) * 2.0, GAP[1], GAP[2]];
  const leakOp = f < T.leak ? 0 : lt < 0.6 ? 0.9 : 0.9 * (1 - (lt - 0.6) / 0.4);
  const bars = f < T.weak ? 2 : 1;
  const pose = poseAt(f, [
    [ctx.from, "phoneLook"],
    [T.weak + 2, "phoneUp", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "confused"],
    [T.cage + 6, "surprised"],
    [T.cage + 30, "neutral"],
    [T.weak + 4, "sweat"],
  ]);
  const point = f >= T.leak + 8 && f < T.leak + 50;
  return (
    <group>
      <LandingDoor open={0.12} />
      <Cabin y={GROUND} door={0.12} cage={cage} light={0.8}>
        <PakDodi frame={f} position={[0.15, 0, 0.1]} rotY={0.1} pose={pose} expr={expr} rightHand={<Phone {...PHONE_HAND} bars={bars} />} />
      </Cabin>
      <Rings stream={RINGS} frame={f} />
      {f >= T.leak && <Ring position={leakPos} dir={[1, 0, 0]} radius={0.32} opacity={leakOp} tube={0.022} />}
      {f >= T.cage + 4 && <WoodLabel position={[CAB[0] - 0.2, BOARD_Y, -7.5]} scale={label * 0.75} text="SANGKAR FARADAY" w={2.6} h={0.55} />}
      <group position={hudPos(1)}>
        <SignalBars position={[0, 0, 0]} level={bars} scale={0.9} frame={f} shake={f >= T.weak ? 1 : 0} />
      </group>
      <Tuti frame={f} position={TUTI} rotY={keys1(f, [[ctx.from, 0.4], [T.leak + 6, 1.4]])} flap={point ? 0.4 : 0} headTurn={point ? 0.5 : 0} peck={Math.max(peck(f, ctx.from + 14), peck(f, T.weak + 10))} eyesWide={point} />
    </group>
  );
};

export const S4: SceneDef = {
  id: "S4",
  mood: "dim",
  focus: [-1.5, 0, -9],
  shadowSize: 8,
  out: "flyby",
  camera: ({ frame: f, to }) => {
    // Move 1: slow push on the cage. Move 2: whip to the door gap, then pull out.
    const p = punch(f, T.cage + 4, 0.06);
    const pos = keys3(f, [
      [FROM, [0.6, 2.5, -2.4]],
      [T.leak, [0.2, 2.4, -3.4]],
      [T.leak + 6, [-3.0, 1.9, -4.6]],
      [T.weak - 6, [-2.8, 1.9, -5.0]],
      [to, [-0.7, 3.2, -1.6]],
    ]);
    const target = keys3(f, [
      [FROM, [-0.8, 1.7, -9.0]],
      [T.leak, [-0.8, 1.7, -9.0]],
      [T.leak + 6, [-2.2, 1.5, -9.2]],
      [T.weak - 6, [-2.0, 1.5, -9.2]],
      [to, [-0.9, 2.5, -8.8]],
    ], EASE.inOut);
    return { pos, target, fov: 42 / p };
  },
  action: ({ frame: f }) => [
    // While the box turns into a cage the whole cabin is the action, afterwards Dodi's face
    ...(f >= T.cage - 4 && f < T.cage + 22 ? [{ box: [[CAB[0] - 1.0, GROUND + 0.3, CAB[2] - 1.0], [CAB[0] + 1.0, GROUND + 2.5, CAB[2] + 1.0]] as [V3, V3] }] : [dodiBox([CAB[0] + 0.15, GROUND, CAB[2] + 0.1])]),
    ...(f >= T.cage ? [{ box: [[CAB[0] - 1.2, BOARD_Y - 0.26, -7.6], [CAB[0] + 0.8, BOARD_Y + 0.26, -7.4]] as [V3, V3] }] : []),
    ...(f >= T.leak && f < T.leak + 40 ? [{ c: GAP, r: 0.6 }] : []),
    hudVol(1),
    ...ringStates(RINGS, f).map((r) => ({ c: r.pos, r: r.r })),
  ],
  Set,
};

export const S4_SFX: SfxCue[] = [
  { at: T.cage, name: "sparkle", volume: 0.3 },
  { at: T.cage + 4, name: "pop", volume: 0.35 },
  { at: T.leak, name: "wave", volume: 0.18 },
  { at: T.leak + 22, name: "fadeOut", volume: 0.22 },
  { at: T.weak, name: "buzz", volume: 0.22 },
];

