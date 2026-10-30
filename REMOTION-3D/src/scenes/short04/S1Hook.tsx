// S1 Hook: a strong metal box drops into the shaft, signal rings bounce off it.
import React from "react";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue } from "./tl";
import { Cabin, LandingDoor } from "../../world/short04/Lift";
import { Dust } from "../../world/props/misc";
import { Tuti } from "../../world/characters/Tuti";
import { EASE, arc, dropY, keys1, keys3, peck, punch, ramp, shake, squash } from "../../anim";
import { CABIN_HIT, CAB, CAB_MID, GROUND, RING_Z, TOWER_TOP, add, floorY } from "./layout";
import { Rings, ringStates, type RingStream } from "./rings";

const T = {
  signal: cue("S1", 1), // [sinyal HP]
  box: cue("S1", 0), // [kotak yang kuat]
  bounce: cue("S1", 2), // [susah masuk]
};
const DROP = 14;
const LAND = T.box + DROP;
const PERCH: [number, number, number] = [CAB[0] + 0.3, floorY(1) + 0.02, -7.95];

// Before the box lands the rings fly freely into the empty shaft higher up; after, they bounce off the box
const EVERY = 20;
const FIRST_HIT = T.signal + Math.ceil((LAND - 30 - T.signal) / EVERY) * EVERY;
export const S1_RINGS_PASS: RingStream = {
  from: TOWER_TOP,
  ctrl: [7.0, 12.0, RING_Z + 0.6],
  to: [CABIN_HIT[0], floorY(2) + 1.4, RING_Z],
  start: T.signal,
  end: FIRST_HIT - 1,
  every: EVERY,
  travel: 30,
  r0: 0.3,
  r1: 0.7,
  mode: () => "pass",
};
export const S1_RINGS: RingStream = {
  from: TOWER_TOP,
  ctrl: [7.0, 10.5, RING_Z + 0.6],
  to: CABIN_HIT,
  start: FIRST_HIT,
  end: 330,
  every: EVERY,
  travel: 30,
  r0: 0.3,
  r1: 0.7,
  mode: () => "bounce",
};

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const cabY = f < T.box ? 30 : GROUND + dropY(f, T.box, 21, DROP);
  const sq = squash(f, LAND, 0.9);
  const glint = f >= LAND + 3 ? (f - LAND - 3) / 26 : -1;
  // Tuti: startled by the clang, flies off, comes back to swat a ring on "susah masuk"
  const flee = ramp(f, LAND + 2, LAND + 22, EASE.inOut);
  const back = ramp(f, T.bounce - 14, T.bounce + 2, EASE.out);
  const away: [number, number, number] = [6, 7.5, -6.2];
  const swatSpot: [number, number, number] = [CABIN_HIT[0] + 1.3, CABIN_HIT[1] + 0.9, RING_Z + 0.5];
  const tutiPos = f < LAND + 2 ? PERCH : f < T.bounce - 14 ? arc(PERCH, away, flee, 1.2) : arc(away, swatSpot, back, 0.6);
  const flying = (f >= LAND + 2 && f < LAND + 22) || (f >= T.bounce - 14 && f < T.bounce + 30);
  const swat = f >= T.bounce + 2 && f < T.bounce + 12 ? Math.sin(((f - T.bounce - 2) / 10) * Math.PI) : 0;
  return (
    <group>
      <LandingDoor open={0} />
      <group position={[0, 0, 0]}>
        <group scale={[sq[0], sq[1], sq[0]]} position={[0, 0, 0]}>
          <Cabin y={cabY} door={0} glint={glint} light={f >= LAND ? 1 : 0.3} />
        </group>
      </group>
      <Dust frame={f} at={LAND} origin={[CAB[0], GROUND + 0.05, CAB[2] + 0.9]} count={14} spread={1.4} seed="s104-land" color="#D9D2C4" />
      <Rings stream={S1_RINGS_PASS} frame={f} />
      <Rings stream={S1_RINGS} frame={f} />
      <Tuti
        frame={f}
        position={tutiPos}
        rotY={f < LAND + 2 ? 0.3 : f < T.bounce - 14 ? -1.2 : 2.0}
        flap={flying ? 1 : 0}
        bodyTilt={flying ? 0.3 : 0}
        tuck={flying}
        eyesWide={f >= LAND && f < LAND + 30}
        peck={f < LAND ? Math.max(peck(f, 40), peck(f, 95), peck(f, 140)) : 0}
        roll={swat * 0.6}
        shadow={!flying}
      />
    </group>
  );
};

export const S1: SceneDef = {
  id: "S1",
  mood: "morning",
  focus: [2, 0, -9],
  shadowSize: 16,
  out: "whip",
  whipDir: 1,
  camera: ({ frame: f }) => {
    // Move 1: dolly in from the wide maket. Move 2: drop and punch-in on the cabin wall.
    const sh = shake(f, LAND, 0.14, 14, "s104");
    const p = punch(f, LAND, 0.08) * punch(f, T.bounce + 2, 0.05);
    const pos = keys3(f, [
      [0, [5.6, 9.4, 20]],
      [T.box - 10, [2.4, 5.6, 11.5]],
      [LAND, [0.6, 3.5, 4.8]],
      [T.bounce, [0.9, 2.9, 2.9]],
      [330, [1.0, 2.7, 2.2]],
    ]);
    const target = keys3(f, [
      [0, [4.9, 7.6, -9]],
      [T.box - 10, [0.6, 4.4, -8.5]],
      [LAND, [-0.5, 2.0, -8.6]],
      [T.bounce, [-0.1, 2.0, -8.3]],
      [330, [0.0, 2.0, -8.3]],
    ]);
    const fov = keys1(f, [
      [0, 44],
      [T.box - 10, 40],
    ]);
    return { pos: [pos[0] + sh[0], pos[1] + sh[1], pos[2]], target, fov: fov / p };
  },
  // Main action: the tower top, the cabin and the flying rings
  action: ({ frame: f }) => [
    ...(f < T.box ? [{ c: TOWER_TOP, r: 1.2 }] : []),
    // The falling box while it drops and lands, then the spot where rings hit it
    ...(f >= T.box && f < LAND + 10 ? [{ c: [CAB[0], (f < T.box ? 30 : GROUND + dropY(f, T.box, 21, DROP)) + 1.2, CAB[2]] as [number, number, number], r: 1.2 }] : []),
    ...(f >= LAND ? [{ c: CABIN_HIT, r: 0.6 }] : []),
    ...[...ringStates(S1_RINGS_PASS, f), ...ringStates(S1_RINGS, f)].map((r) => ({ c: r.pos, r: r.r * 0.9 })),
  ],
  Set,
};

export const S1_SFX: SfxCue[] = [
  ...Array.from({ length: 6 }, (_, k) => ({ at: T.signal + k * 20, name: "wave", volume: 0.22 - k * 0.02 })),
  { at: T.box, name: "whoosh", volume: 0.35 },
  { at: LAND, name: "clang", volume: 0.6 },
  { at: LAND + 3, name: "sparkle", volume: 0.25 },
  { at: LAND + 2, name: "flap", volume: 0.3 },
  ...[0, 1, 2].map((k) => ({ at: T.bounce + 30 - 30 + k * 20 + 8, name: "boing", volume: 0.32 })),
  { at: T.bounce - 14, name: "flap", volume: 0.28 },
  { at: T.bounce + 3, name: "whoosh", volume: 0.22 },
];
