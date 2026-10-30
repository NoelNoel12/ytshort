import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type V3 = [number, number, number];
// shiftY: lens shift, moves the whole image up by this fraction of the frame height (no tilt, no perspective change)
export type CamShot = { pos: V3; target: V3; fov: number; roll?: number; shiftY?: number };

// Sets the single scene camera from frame-driven values (no useFrame)
export const CameraRig: React.FC<CamShot> = ({ pos, target, fov, roll = 0, shiftY = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(target[0], target[1], target[2]);
    if (roll) camera.rotateZ(roll);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 1200;
    if (shiftY) camera.setViewOffset(size.width, size.height, 0, shiftY * size.height, size.width, size.height);
    else if (camera.view?.enabled) camera.clearViewOffset();
    camera.updateProjectionMatrix();
  });
  return null;
};

// Orbit helper: camera on a circle around a target
export const orbit = (target: V3, radius: number, angle: number, height: number): V3 => [target[0] + Math.sin(angle) * radius, target[1] + height, target[2] + Math.cos(angle) * radius];

// Recompose a scene camera: dolly back by k around the target, then lens-shift the image up by s
export const framed =
  <C,>(cam: (ctx: C) => CamShot, k: number, s: number) =>
  (ctx: C): CamShot => {
    const shot = cam(ctx);
    const t = shot.target;
    const pos: V3 = [t[0] + (shot.pos[0] - t[0]) * k, t[1] + (shot.pos[1] - t[1]) * k, t[2] + (shot.pos[2] - t[2]) * k];
    return { ...shot, pos, shiftY: (shot.shiftY ?? 0) + s };
  };
