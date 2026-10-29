import React, { useMemo } from "react";
import * as THREE from "three";
import { M, paint } from "./materials";
import { box, capsule, cyl, rbox, sphere, torus, tube } from "./geom";

type V3 = [number, number, number];

const POLE_H = 7.2;

export const PowerPole: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, POLE_H / 2, 0]} geometry={cyl(0.12, 0.17, POLE_H, 20)} material={paint("#D8D4CC", 0.7)} castShadow receiveShadow />
    <mesh position={[0, POLE_H - 0.5, 0]} geometry={rbox(0.12, 0.12, 1.8, 0.03)} material={M.darkMetal()} castShadow />
    {[-0.75, 0, 0.75].map((z) => (
      <mesh key={z} position={[0, POLE_H - 0.38, z]} geometry={cyl(0.05, 0.06, 0.18, 12)} material={paint("#E8E2D0", 0.4)} />
    ))}
    <mesh position={[0.25, POLE_H - 1.6, 0]} geometry={rbox(0.38, 0.55, 0.4, 0.05)} material={paint("#8C9298", 0.5, 0.3)} castShadow />
  </group>
);

// Poles along x with sagging cables between them (thick enough to stay above 2 px)
export const PowerLine: React.FC<{ z: number; xs: number[] }> = ({ z, xs }) => {
  const cables = useMemo(() => {
    const out: { key: string; pts: THREE.Vector3[] }[] = [];
    for (let i = 0; i < xs.length - 1; i++) {
      for (const dz of [-0.75, 0, 0.75]) {
        const a = new THREE.Vector3(xs[i], POLE_H - 0.3, z + dz);
        const b = new THREE.Vector3(xs[i + 1], POLE_H - 0.3, z + dz);
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 12; k++) {
          const t = k / 12;
          const p = a.clone().lerp(b, t);
          p.y -= 0.65 * 4 * t * (1 - t);
          pts.push(p);
        }
        out.push({ key: `cable:${z}:${xs[i]}:${dz}`, pts });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xs.join(","), z]);
  return (
    <group>
      {xs.map((x) => (
        <PowerPole key={x} position={[x, 0, z]} />
      ))}
      {cables.map((c) => (
        <mesh key={c.key} geometry={tube(c.key, c.pts, 0.035, 32, 6)} material={M.cable()} />
      ))}
    </group>
  );
};

export const StreetLamp: React.FC<{ position: V3; rotY?: number }> = ({ position, rotY = 0 }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh position={[0, 2.6, 0]} geometry={cyl(0.07, 0.1, 5.2, 16)} material={M.darkMetal()} castShadow />
    <mesh position={[0, 5.2, 0.55]} rotation={[Math.PI / 2, 0, 0]} geometry={cyl(0.045, 0.045, 1.1, 12)} material={M.darkMetal()} castShadow />
    <mesh position={[0, 5.12, 1.1]} geometry={rbox(0.5, 0.16, 0.3, 0.06)} material={M.darkMetal()} castShadow />
    <mesh position={[0, 5.03, 1.1]} geometry={box(0.4, 0.02, 0.22)} material={paint("#FFF6D8", 0.3)} />
  </group>
);

export const PlasticChair: React.FC<{ position: V3; rotY?: number; color?: string }> = ({ position, rotY = 0, color = "#E04B3C" }) => {
  const m = paint(color, 0.4);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.45, 0]} geometry={rbox(0.5, 0.06, 0.5, 0.03)} material={m} castShadow receiveShadow />
      <mesh position={[0, 0.78, -0.24]} rotation={[-0.12, 0, 0]} geometry={rbox(0.5, 0.6, 0.05, 0.03)} material={m} castShadow />
      {[
        [-0.21, -0.21],
        [0.21, -0.21],
        [-0.21, 0.21],
        [0.21, 0.21],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.22, z]} rotation={[z * 0.2, 0, -x * 0.2]} geometry={cyl(0.03, 0.04, 0.46, 12)} material={m} castShadow />
      ))}
    </group>
  );
};

// Toy scooter
export const Motorbike: React.FC<{ position: V3; rotY?: number; color?: string }> = ({ position, rotY = 0, color = "#3C7DD9" }) => {
  const body = paint(color, 0.3, 0.2);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {[-0.62, 0.62].map((x) => (
        <group key={x} position={[x, 0.3, 0]}>
          <mesh geometry={torus(0.22, 0.09, 14, 32)} material={M.rubber()} castShadow />
          <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cyl(0.12, 0.12, 0.1, 24)} material={M.steel()} />
        </group>
      ))}
      <mesh position={[0, 0.48, 0]} geometry={rbox(1.0, 0.18, 0.32, 0.07)} material={body} castShadow />
      <mesh position={[-0.35, 0.68, 0]} geometry={capsule(0.2, 0.45, 8, 20)} rotation={[0, 0, Math.PI / 2]} material={body} castShadow />
      <mesh position={[-0.3, 0.92, 0]} geometry={rbox(0.62, 0.1, 0.3, 0.05)} material={paint("#2A2B30", 0.6)} castShadow />
      <mesh position={[0.55, 0.8, 0]} rotation={[0, 0, -0.35]} geometry={rbox(0.14, 0.8, 0.34, 0.05)} material={body} castShadow />
      <mesh position={[0.68, 1.22, 0]} geometry={cyl(0.03, 0.03, 0.7, 12)} rotation={[Math.PI / 2, 0, 0]} material={M.darkMetal()} />
      <mesh position={[0.74, 1.08, 0]} geometry={sphere(0.09, 16, 12)} material={paint("#FFF3C4", 0.2)} />
    </group>
  );
};

export const Bench: React.FC<{ position: V3; rotY?: number }> = ({ position, rotY = 0 }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.48, 0]} geometry={rbox(2.0, 0.08, 0.45, 0.03)} material={M.wood()} castShadow receiveShadow />
    <mesh position={[0, 0.85, -0.2]} geometry={rbox(2.0, 0.3, 0.06, 0.03)} material={M.wood()} castShadow />
    {[-0.85, 0.85].map((x) => (
      <mesh key={x} position={[x, 0.24, 0]} geometry={rbox(0.08, 0.48, 0.42, 0.02)} material={M.darkMetal()} castShadow />
    ))}
  </group>
);
