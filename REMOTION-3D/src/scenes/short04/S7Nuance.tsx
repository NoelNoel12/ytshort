// S7 Nuance: not every lift goes dead; it depends on materials and on boosters in the building.
import React from "react";
import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { cue, sceneRange } from "./tl";
import { Cabin } from "../../world/short04/Lift";
import { Repeater, Ring, SignalBars, WoodLabel } from "../../world/short04/Signal";
import { Tuti } from "../../world/characters/Tuti";
import { EASE, keys1, keys3, peck, pop, punch, ramp } from "../../anim";
import { M, paint } from "../../world/materials";
import { boxW, rboxW } from "../../world/geom";
import { orbit } from "../../world/CameraRig";

type V3 = [number, number, number];
const T = {
  notAll: cue("S7", 0), // [nggak semua lift]
  material: cue("S7", 1), // [tergantung bahan]
  booster: cue("S7", 2), // [penguat sinyal]
};
const R = sceneRange("S7");
const CENTER: V3 = [18, 0.06, -1.6];
const A: V3 = [CENTER[0] - 1.5, CENTER[1], CENTER[2]];
const B: V3 = [CENTER[0] + 1.5, CENTER[1], CENTER[2]];
const MS = 0.42; // model scale
const BOOST: V3 = [A[0] + 1.17, 2.6, A[2] + 0.4];
const CLOSE_TY = 2.3; // close-up target height
// BAHAN label pops in on its cue and bows out quickly when the booster takes over
const labelScale = (f: number) => pop(f, T.material, "bouncy") * (1 - ramp(f, T.booster, T.booster + 5, EASE.inOut));

// Small cutaway building model with a lift inside (a maket on the street)
const MiniBuilding: React.FC<{ position: V3; wall: string; glassy?: boolean }> = ({ position, wall, glassy = false }) => (
  <group position={position}>
    <mesh position={[0, 0.06, 0]} geometry={rboxW(2.7, 0.12, 2.2, 0.03, 1.5)} material={M.woodDark()} castShadow receiveShadow />
    {[0, 1, 2].map((k) => (
      <mesh key={k} position={[0, 0.12 + k * 1.3 + 0.05, -0.1]} geometry={boxW(2.5, 0.1, 1.8, 1.5)} material={M.concrete()} castShadow receiveShadow />
    ))}
    <mesh position={[0, 0.12 + 1.95, -0.98]} geometry={boxW(2.5, 3.9, 0.12, 2)} material={glassy ? paint("#8FC3E8", 0.15, 0.3) : M.plaster(wall)} castShadow receiveShadow />
    {[-1.22, 1.22].map((x) => (
      <mesh key={x} position={[x, 0.12 + 1.95, -0.1]} geometry={boxW(0.1, 3.9, 1.8, 2)} material={M.plaster(wall)} castShadow receiveShadow />
    ))}
    <mesh position={[0, 0.12 + 3.95, -0.1]} geometry={rboxW(2.6, 0.12, 1.9, 0.03, 2)} material={M.plaster(wall)} castShadow />
    <group scale={MS} position={[0, 0.17, -0.15]}>
      <Cabin y={0} at={[0, 0, 0]} door={0} light={1} />
    </group>
  </group>
);

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  const a = pop(f, T.notAll, "bouncy") * 0.88;
  const b = pop(f, T.notAll + 5, "bouncy") * 0.88;
  const label = labelScale(f);
  const rep = pop(f, T.booster, "bouncy");
  const blink = f >= T.booster ? (Math.floor((f - T.booster) / 8) % 2 ? 0 : 1) : 0;
  const nod = f >= T.booster + 6 ? Math.max(0, Math.sin(((f - T.booster - 6) / 8) * Math.PI)) * (f < T.booster + 40 ? 1 : 0) : 0;
  return (
    <group>
      <group position={A} scale={[0.88, Math.max(0.001, a), 0.88]}>
        <MiniBuilding position={[0, 0, 0]} wall="#F1DDBF" />
      </group>
      <group position={B} scale={[0.88, Math.max(0.001, b), 0.88]}>
        <MiniBuilding position={[0, 0, 0]} wall="#C9D3DC" glassy />
      </group>
      <SignalBars position={[A[0], 4.15, A[2] + 0.4]} level={a > 0.44 ? 4 : 0} scale={0.9} frame={f} />
      <SignalBars position={[B[0], 4.15, B[2] + 0.4]} level={b > 0.44 ? 1 : 0} scale={0.9} frame={f} shake={1} />
      {f >= T.material && label > 0.01 && <WoodLabel position={[CENTER[0], 1.25, CENTER[2] + 0.5]} scale={label} text="BAHAN" w={1.2} h={0.42} posts={1.0} />}
      {f >= T.booster && (
        <group position={BOOST} scale={rep * 1.4}>
          <Repeater position={[0, 0, 0]} rotY={Math.PI / 2} blink={blink} />
          {/* The booster pushes fresh rings into the building towards its lift */}
          {[0, 1, 2].map((k) => {
            const t = f - T.booster - 6 - k * 9;
            if (t < 0) return null;
            const a = (t % 27) / 27;
            return <Ring key={k} position={[-0.25 - a * 0.7, -a * 0.35, a * 0.15]} dir={[-0.8, -0.2, 0.55]} radius={0.12 + a * 0.3} opacity={(1 - a) * 0.9} tube={0.03} color="#9CFFB8" />;
          })}
        </group>
      )}
      <Tuti frame={f} position={[CENTER[0] - 0.5, 0.06, CENTER[2] + 1.3]} rotY={keys1(f, [[R.from, 0.3], [T.booster, -0.5]])} peck={Math.max(peck(f, R.from + 15), nod)} eyesWide={f >= T.notAll && f < T.notAll + 20} />
    </group>
  );
};

export const S7: SceneDef = {
  id: "S7",
  mood: "golden",
  focus: CENTER,
  shadowSize: 8,
  out: "flyby",
  camera: ({ frame: f, from, to }) => {
    // Move 1: slow orbit around the two models. Move 2: close-up on the booster.
    const p = punch(f, T.booster + 2, 0.06);
    if (f < T.booster) {
      const a = keys1(f, [
        [from, 0.35],
        [T.booster, -0.05],
      ]);
      const target: V3 = [CENTER[0], 2.4, CENTER[2]];
      return { pos: orbit(target, 10.2, a, 1.4), target, fov: 50 / p };
    }
    const pos = keys3(f, [
      [T.booster, orbit([CENTER[0], 2.4, CENTER[2]], 10.2, -0.05, 1.4)],
      [T.booster + 16, [A[0] + 3.1, 3.4, A[2] + 5.3]],
      [to, [A[0] + 2.9, 3.3, A[2] + 4.9]],
    ]);
    const target = keys3(f, [
      [T.booster, [CENTER[0], 2.4, CENTER[2]]],
      [T.booster + 16, [A[0] + 0.8, CLOSE_TY, A[2]]],
      [to, [A[0] + 0.8, CLOSE_TY, A[2]]],
    ]);
    return { pos, target, fov: 42 / p };
  },
  action: ({ frame: f }) => [
    ...(f < T.booster + 10 ? [{ c: [A[0], 4.3, A[2] + 0.4] as V3, r: 0.45 }, { c: [B[0], 4.3, B[2] + 0.4] as V3, r: 0.45 }] : []),
    ...(f >= T.notAll && f < T.notAll + 14 ? [{ c: [CENTER[0], 1.9, CENTER[2]] as V3, r: 1.6 }] : []),
    ...(f >= T.material && labelScale(f) > 0.01 ? [{ c: [CENTER[0], 1.25, CENTER[2] + 0.5] as V3, r: 0.6 * Math.max(0.5, labelScale(f)) }] : []),
    ...(f >= T.booster ? [{ c: [BOOST[0] - 0.3, BOOST[1] - 0.1, BOOST[2]] as V3, r: 0.6 }] : []),
  ],
  Set,
};

export const S7_SFX: SfxCue[] = [
  { at: T.notAll, name: "pop", volume: 0.3 },
  { at: T.notAll + 5, name: "pop", volume: 0.26 },
  { at: T.notAll + 10, name: "buzz", volume: 0.16 },
  { at: T.material, name: "pop", volume: 0.34 },
  ...[0, 16, 32].map((d) => ({ at: T.booster + d, name: "blip", volume: 0.28 })),
];
