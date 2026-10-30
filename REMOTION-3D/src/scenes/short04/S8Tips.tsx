// S8 Tips: finish the call before the lift, or tell the other person; Tuti plays a ghost that vanishes.
import React from "react";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue, sceneRange } from "./tl";
import { Cabin, LandingDoor } from "../../world/short04/Lift";
import { GhostSheet, Phone } from "../../world/short04/Signal";
import { SpeechBubble } from "../../world/props/misc";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { EASE, keys1, keys3, pop, punch, ramp } from "../../anim";
import { BLD, CAB, GROUND, PHONE_EAR, PHONE_HAND, dodiBox } from "./layout";

type V3 = [number, number, number];
const T = {
  finish: cue("S8", 0), // [selesaikan teleponnya]
  tell: cue("S8", 1), // [kasih tahu]
  ghost: cue("S8", 2), // [dikira ngilang]
};
const R = sceneRange("S8");
const DODI: V3 = [-3.4, GROUND, CAB[2] + 0.5];
const DOOR: V3 = [BLD.shaft.x0 - 0.2, GROUND, CAB[2]];

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const onPhone = f < T.finish + 4 || f >= T.tell - 2;
  const pose = poseAt(f, [
    [ctx.from, "phoneEar"],
    [T.finish + 4, "phoneLook", 8],
    [T.finish + 26, "thumbsUp", 8],
    [T.tell - 2, "phoneEar", 6],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.finish + 6, "proud"],
    [T.tell, "happy"],
    [T.ghost + 10, "surprised"],
  ]);
  const bubble = pop(f, T.tell + 2, "bouncy");
  // Ghost glides to the lift door, the door opens a crack, the ghost fades behind it
  const g = ramp(f, T.ghost, T.ghost + 30, EASE.inOut);
  const ghostPos: V3 = [DODI[0] + 1.0 + (DOOR[0] - DODI[0] - 1.2) * g, GROUND + 0.55 + Math.sin(f / 5) * 0.06, DODI[2] + 0.4 - 0.9 * g];
  const fade = 1 - ramp(f, T.ghost + 22, T.ghost + 34);
  const door = f < T.ghost + 14 ? 0 : keys1(f, [[T.ghost + 14, 0], [T.ghost + 22, 0.25], [T.ghost + 40, 0]]);
  return (
    <group>
      <LandingDoor open={door} />
      <Cabin y={GROUND} door={door} light={0.8} />
      <PakDodi frame={f} position={DODI} rotY={keys1(f, [[ctx.from, 0.7], [T.ghost + 6, 0.7], [T.ghost + 14, 1.3]])} pose={pose} expr={expr} rightHand={onPhone ? <Phone {...PHONE_EAR} /> : <Phone {...PHONE_HAND} />} />
      {f >= T.tell + 2 && <SpeechBubble position={[DODI[0] + 0.9, GROUND + 2.0 + Math.sin(f / 10) * 0.03, DODI[2] + 0.55]} rotation={[0, 0.45, 0]} scale={bubble * 0.4} text="SEBENTAR YA" w={2.1} h={0.75} tailSide={-1} />}
      {f < T.ghost ? (
        <Tuti frame={f} position={[DODI[0] + 1.0, GROUND, DODI[2] + 0.4]} rotY={-0.4} peck={0} />
      ) : (
        fade > 0.01 && <GhostSheet position={ghostPos} scale={1.0} opacity={fade} sway={Math.sin(f / 6)} />
      )}
    </group>
  );
};

export const S8: SceneDef = {
  id: "S8",
  mood: "warm",
  focus: [-3, 0, -9.3],
  shadowSize: 7,
  out: "whip",
  whipDir: -1,
  camera: ({ frame: f, from, to }) => {
    // Move 1: push in on Dodi. Move 2: whip to the lift door.
    const p = punch(f, T.tell + 2, 0.06);
    const pos = keys3(f, [
      [from, [-1.6, 2.2, -2.2]],
      [T.ghost - 4, [-2.4, 2.1, -4.6]],
      [T.ghost + 4, [-1.4, 1.8, -5.0]],
      [to, [-1.2, 1.7, -5.4]],
    ]);
    const target = keys3(f, [
      [from, [-3.3, 1.6, -9.0]],
      [T.tell, [-3.2, 1.65, -8.95]],
      [T.tell + 12, [-2.85, 1.7, -8.9]],
      [T.ghost - 4, [-2.85, 1.7, -8.9]],
      [T.ghost + 4, [-2.3, 1.2, -9.3]],
      [to, [-2.2, 1.1, -9.3]],
    ]);
    return { pos, target, fov: 42 / p };
  },
  action: ({ frame: f }) => [
    dodiBox(DODI),
    ...(f >= T.tell ? [{ c: [DODI[0] + 0.9, GROUND + 2.0, DODI[2] + 0.55] as V3, r: 0.5 }] : []),
    ...(f >= T.ghost ? [{ c: [DODI[0] + 1.0 + (DOOR[0] - DODI[0] - 1.2) * ramp(f, T.ghost, T.ghost + 30, EASE.inOut), GROUND + 0.85, DODI[2] + 0.4 - 0.9 * ramp(f, T.ghost, T.ghost + 30, EASE.inOut)] as V3, r: 0.45 }] : []),
  ],
  Set,
};

export const S8_SFX: SfxCue[] = [
  { at: T.finish + 4, name: "click", volume: 0.4 },
  { at: T.tell + 2, name: "pop", volume: 0.34 },
  { at: T.ghost, name: "ghost", volume: 0.3 },
  { at: T.ghost + 26, name: "poof", volume: 0.3 },
];
