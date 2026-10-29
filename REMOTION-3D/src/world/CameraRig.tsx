import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type V3 = [number, number, number];
export type CamShot = { pos: V3; target: V3; fov: number; roll?: number };

// Sets the single scene camera from frame-driven values (no useFrame)
export const CameraRig: React.FC<CamShot> = ({ pos, target, fov, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(target[0], target[1], target[2]);
    if (roll) camera.rotateZ(roll);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 1200;
    camera.updateProjectionMatrix();
  });
  return null;
};

// Orbit helper: camera on a circle around a target
export const orbit = (target: V3, radius: number, angle: number, height: number): V3 => [target[0] + Math.sin(angle) * radius, target[1] + height, target[2] + Math.cos(angle) * radius];
