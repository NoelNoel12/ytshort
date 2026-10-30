// S2 Call: Pak Dodi walks into the lift on the phone; doors close, bars drop, the call drops.
import React from "react";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue, sceneRange } from "./tl";
import { Cabin, CABIN, LandingDoor } from "../../world/short04/Lift";
import { CallIcon, Phone, SignalBars } from "../../world/short04/Signal";
import { PakDodi } from "../../world/characters/PakDodi";
import { exprAt, poseAt, walkOffsets } from "../../world/characters/rig";
import { EASE, keys1, keys3, pop, punch, ramp } from "../../anim";
import { CAB, GROUND, PHONE_EAR, PHONE_HAND, dodiBox, hudPos, hudVol } from "./layout";

const T = {
  enter: cue("S2", 0), // [masuk lift]
  close: cue("S2", 1), // [pintu tertutup]
  drop: cue("S2", 2), // [teleponnya bisa putus]
};
const DOOR_SHUT = T.close + 12;
const FROM = sceneRange("S2").from;

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  // Walk from the lobby into the cabin, then turn to face out
  const x = keys1(f, [
    [ctx.from, -4.3],
    [T.enter, -2.9],
    [T.enter + 26, CAB[0] + 0.1],
  ]);
  const walking = f < T.enter + 24;
  const rot = keys1(f, [
    [ctx.from, Math.PI / 2],
    [T.enter + 24, Math.PI / 2],
    [T.enter + 36, 0.15],
  ]);
  const door = f < T.close ? 1 : 1 - ramp(f, T.close, DOOR_SHUT, EASE.inOut);
  // Bars fall one by one after the doors shut
  const bars = f < DOOR_SHUT ? 4 : Math.max(1, 4 - Math.floor((f - DOOR_SHUT + 4) / 10));
  const dropped = ramp(f, T.drop, T.drop + 8);
  const pose = poseAt(f, [
    [ctx.from, "phoneEar"],
    [T.drop + 6, "phoneUp", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "happy"],
    [DOOR_SHUT + 8, "confused"],
    [T.drop + 4, "surprised"],
    [T.drop + 26, "sweat"],
  ]);
  const inCabin = x > CAB[0] - 0.9;
  const local: [number, number, number] = [x - CAB[0], 0, 0.05];
  const dodi = (
    <PakDodi
      frame={f}
      position={inCabin ? local : [x, GROUND, CAB[2] + 0.05]}
      rotY={rot}
      pose={pose}
      expr={expr}
      walk={walking ? walkOffsets(f, 0.9) : null}
      rightHand={f < T.drop + 6 ? <Phone {...PHONE_EAR} bars={bars} /> : <Phone {...PHONE_HAND} bars={1} />}
    />
  );
  const barsPop = pop(f, ctx.from + 6, "bouncy");
  return (
    <group>
      <LandingDoor open={door} />
      <Cabin y={GROUND} door={door} light={1}>
        {inCabin && dodi}
      </Cabin>
      {!inCabin && dodi}
      <group position={hudPos(1, GROUND, x)} scale={barsPop}>
        <SignalBars position={[0, 0, 0]} level={bars} scale={0.9} frame={f} shake={bars <= 1 ? 1 : 0} />
        <CallIcon position={[0, 0.66, 0]} dropped={dropped} scale={0.8} />
      </group>
    </group>
  );
};

export const S2: SceneDef = {
  id: "S2",
  mood: "morning",
  focus: [-2, 0, -9.3],
  shadowSize: 8,
  out: "cut",
  camera: ({ frame: f, from, to }) => {
    // Move 1: track Dodi from the lobby into the lift. Move 2: push in to the bars.
    const p = punch(f, T.drop + 2, 0.07);
    const pos = keys3(f, [
      [from, [-3.6, 2.2, -2.4]],
      [T.enter + 30, [-1.1, 2.1, -3.0]],
      [T.close, [-0.55, 2.2, -3.6]],
      [to, [-0.25, 2.6, -4.6]],
    ]);
    const target = keys3(f, [
      [from, [-3.9, 1.6, -9.3]],
      [T.enter + 30, [-0.9, 1.6, -9.0]],
      [T.close, [-0.55, 1.7, -9.0]],
      [to, [-0.35, 2.3, -8.6]],
    ]);
    return { pos, target, fov: 42 / p };
  },
  action: ({ frame: f }) => {
    const x = keys1(f, [
      [FROM, -4.3],
      [T.enter, -2.9],
      [T.enter + 26, CAB[0] + 0.1],
    ]);
    return [
      dodiBox([x, GROUND, CAB[2] + 0.05]),
      hudVol(1, GROUND, x, true),
    ];
  },
  Set,
};

export const S2_SFX: SfxCue[] = [
  { at: FROM + 6, name: "pop", volume: 0.25 },
  { at: DOOR_SHUT, name: "ding", volume: 0.4 },
  { at: DOOR_SHUT + 2, name: "barsDown", volume: 0.32 },
  { at: T.drop, name: "callDrop", volume: 0.32 },
];

