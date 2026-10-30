// One persistent 3D world for the whole video: picks the active scene set, camera and light.
import React from "react";
import * as THREE from "three";
import { Kampung } from "../world/Kampung";
import { StaticBatch } from "../world/StaticBatch";
import { Lighting } from "../world/Lighting";
import { Sky } from "../world/Sky";
import { CameraRig, type CamShot } from "../world/CameraRig";
import { Tuti } from "../world/characters/Tuti";
import { handheld } from "../anim";
import type { SceneCtx, SceneDef } from "./types";
import type { Timeline } from "../types";

export const WHIP_FRAMES = 4; // per side, 8 in total

export type ActiveScene = { def: SceneDef; ctx: SceneCtx; index: number };

export const activeScene = (scenes: SceneDef[], frame: number, TL: Timeline): ActiveScene => {
  let index = TL.scenes.findIndex((s) => frame >= s.fromFrame && frame < s.toFrame);
  if (index < 0) index = TL.scenes.length - 1;
  const s = TL.scenes[index];
  return { def: scenes[index], ctx: { frame, from: s.fromFrame, to: s.toFrame, dur: s.toFrame - s.fromFrame }, index };
};

// Signed whip amount around scene cuts: ramps to +-1 at the cut, 0 elsewhere
export const whipAmount = (scenes: SceneDef[], frame: number, TL: Timeline): number => {
  for (let i = 0; i < TL.scenes.length - 1; i++) {
    if (scenes[i].out !== "whip") continue;
    const cut = TL.scenes[i].toFrame;
    const d = frame - cut;
    if (d >= -WHIP_FRAMES && d < WHIP_FRAMES) {
      const dir = scenes[i].whipDir ?? 1;
      // Leaving: accelerate out. Entering: decelerate in from the other side.
      return d < 0 ? dir * Math.pow((d + WHIP_FRAMES + 1) / (WHIP_FRAMES + 1), 2) : -dir * Math.pow(1 - d / WHIP_FRAMES, 2);
    }
  }
  return 0;
};

// Fly-by window around a cut (Tuti crosses close to the lens)
export const flybyAmount = (scenes: SceneDef[], frame: number, TL: Timeline): number | null => {
  for (let i = 0; i < TL.scenes.length - 1; i++) {
    if (scenes[i].out !== "flyby") continue;
    const cut = TL.scenes[i].toFrame;
    const d = frame - cut;
    if (d >= -7 && d <= 7) return (d + 7) / 14;
  }
  return null;
};

const applyWhip = (shot: CamShot, whip: number): CamShot => {
  if (!whip) return shot;
  const pos = new THREE.Vector3(...shot.pos);
  const tgt = new THREE.Vector3(...shot.target);
  const fwd = tgt.clone().sub(pos);
  const dist = fwd.length();
  fwd.normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  // Yaw the view hard sideways
  const ang = whip * 0.9;
  const dir = fwd.clone().multiplyScalar(Math.cos(ang)).add(right.clone().multiplyScalar(Math.sin(ang)));
  const t = pos.clone().add(dir.multiplyScalar(dist));
  return { ...shot, target: [t.x, t.y, t.z], roll: (shot.roll ?? 0) - whip * 0.08 };
};

export type PerfFlags = { noKampung?: boolean; noShadows?: boolean; noEnv?: boolean; noAA?: boolean };

export const SceneWorld: React.FC<{ tl: Timeline; scenes: SceneDef[]; frame: number; lockCamera?: number | null; freezeAt?: number | null; perf?: PerfFlags; world?: React.ReactNode }> = ({ tl, scenes, frame, lockCamera = null, freezeAt = null, perf = {}, world }) => {
  // Flicker tests can freeze all scene animation (content) independently of the camera
  const contentFrame = freezeAt ?? frame;
  const { def, ctx } = activeScene(scenes, contentFrame, tl);
  // Flicker tests can pin the camera to one frame while the scene keeps animating
  const camFrame = lockCamera ?? frame;
  const base = def.camera({ ...ctx, frame: camFrame });
  // Subtle deterministic handheld on every shot
  const hh = handheld(camFrame, 1, ctx.from % 7);
  const shot0: CamShot = { ...base, pos: [base.pos[0] + hh[0], base.pos[1] + hh[1], base.pos[2] + hh[2]] };
  const shot = applyWhip(shot0, whipAmount(scenes, camFrame, tl));
  const fly = flybyAmount(scenes, contentFrame, tl);
  let flyPos: [number, number, number] | null = null;
  let flyRot = 0;
  if (fly !== null) {
    const pos = new THREE.Vector3(...shot.pos);
    const fwd = new THREE.Vector3(...shot.target).sub(pos).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const p = pos.clone().add(fwd.clone().multiplyScalar(0.75)).add(right.clone().multiplyScalar(THREE.MathUtils.lerp(-0.9, 0.9, fly))).add(new THREE.Vector3(0, -0.32 + Math.sin(fly * Math.PI) * 0.08, 0));
    flyPos = [p.x, p.y, p.z];
    flyRot = Math.atan2(right.x, right.z);
  }
  return (
    <>
      <CameraRig {...shot} />
      <Lighting mood={def.mood} focus={def.focus} shadowSize={def.shadowSize ?? 12} noEnv={perf.noEnv} />
      <Sky mood={def.mood} frame={contentFrame} />
      {!perf.noKampung && (
        <StaticBatch name="kampung">
          {world ?? <Kampung />}
        </StaticBatch>
      )}
      <def.Set ctx={ctx} />
      {flyPos && <Tuti frame={frame} position={flyPos} rotY={flyRot} scale={1.6} flap={1} bodyTilt={0.25} shadow={false} tuck seed="flyby" />}
    </>
  );
};
