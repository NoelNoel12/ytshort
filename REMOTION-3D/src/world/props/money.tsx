// Toy money, coins, jar, sacks, envelopes. No real currency designs.
import React, { useMemo } from "react";
import * as THREE from "three";
import { M, paint, std } from "../materials";
import { custom, cyl, lathe, rbox, sphere, torus } from "../geom";
import { textTexture } from "./text";
import { rng } from "../noise";

type V3 = [number, number, number];

const BILL = { w: 0.34, h: 0.035, d: 0.17 };
const BILL_COLORS = ["#E9A56B", "#8FC79A", "#F2C46D", "#E58D8D"];

// One banded bundle of toy bills
export const MoneyBundle: React.FC<{ position?: V3; rotation?: V3; color?: number; scale?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], color = 0, scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={rbox(BILL.w, BILL.h * 2.4, BILL.d, 0.012)} material={M.money(BILL_COLORS[color % BILL_COLORS.length])} castShadow receiveShadow />
    <mesh geometry={rbox(0.06, BILL.h * 2.6, BILL.d + 0.006, 0.006)} material={paint("#F7F2E6", 0.6)} />
  </group>
);

// Stack of bundles, count from data
export const MoneyStack: React.FC<{ position?: V3; count: number; seed?: string; rotY?: number }> = ({ position = [0, 0, 0], count, seed = "stack", rotY = 0 }) => {
  const r = rng(seed);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {Array.from({ length: count }, (_, k) => (
        <MoneyBundle key={k} position={[(r() - 0.5) * 0.02, 0.042 + k * 0.085, (r() - 0.5) * 0.02]} rotation={[0, (r() - 0.5) * 0.12, 0]} color={k} />
      ))}
    </group>
  );
};

export const Coin: React.FC<{ position?: V3; rotation?: V3; scale?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={cyl(0.09, 0.09, 0.022, 48)} material={M.coin()} castShadow />
    <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={torus(0.068, 0.006, 8, 40)} material={M.coin()} />
  </group>
);

// Glass jar, fill 0..1 of toy bundles inside (data-driven by remaining debt)
const JAR_H = 1.1;
const JAR_R = 0.42;
export const Jar: React.FC<{ position?: V3; fill: number; scale?: number | V3; glow?: number }> = ({ position = [0, 0, 0], fill, scale = 1 }) => {
  const glass = lathe(
    "jar",
    [
      // Bottom sits 2 cm up: a double-sided glass disc must never be coplanar with the road (z-fighting)
      [0.001, 0.02],
      [JAR_R * 0.92, 0.02],
      [JAR_R, 0.075],
      [JAR_R, JAR_H * 0.84],
      [JAR_R * 0.8, JAR_H * 0.94],
      [JAR_R * 0.74, JAR_H],
    ],
    64,
  );
  const rows = 12;
  const shown = Math.max(0, Math.min(rows, fill * rows));
  const layers = Math.floor(shown);
  const partial = shown - layers;
  const slots = useMemo(() => {
    const r = rng("jar-slots");
    return Array.from({ length: rows }, (_, k) => Array.from({ length: 4 }, (_, j) => ({ a: (j / 4) * Math.PI * 2 + k * 0.6, rot: (r() - 0.5) * 0.4, c: (k + j) % 4 })));
  }, []);
  const layerH = (JAR_H * 0.8) / rows;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={custom("jarBlob", () => new THREE.CircleGeometry(JAR_R * 1.5, 40))} material={M.blob()} renderOrder={2} />
      {/* Contents: rings of bundles per layer, top layer scales in partially */}
      {slots.slice(0, layers + (partial > 0.01 ? 1 : 0)).map((ring, k) => (
        <group key={k} position={[0, 0.075 + k * layerH + layerH / 2, 0]} scale={k === layers ? [1, partial, 1] : [1, 1, 1]}>
          {ring.map((s, j) => (
            <group key={j} rotation={[0, s.a, 0]}>
              <MoneyBundle position={[0, 0, JAR_R * 0.42]} rotation={[0, Math.PI / 2 + s.rot, 0]} color={s.c} scale={0.9} />
            </group>
          ))}
        </group>
      ))}
      <mesh geometry={glass} material={M.jarGlass()} renderOrder={3} />
      <mesh position={[0, JAR_H + 0.04, 0]} geometry={cyl(JAR_R * 0.8, JAR_R * 0.8, 0.1, 48)} material={paint("#D94B3F", 0.35, 0.1)} castShadow />
      <mesh position={[0, JAR_H + 0.09, 0]} geometry={rbox(JAR_R * 1.2, 0.03, 0.1, 0.012)} material={paint("#B33A30", 0.4)} />
    </group>
  );
};

// Cloth sack with a tied neck; optional label texture
export const Sack: React.FC<{ position?: V3; rotation?: V3; scale?: number | V3; color?: string; label?: string; labelColor?: string; open?: boolean; bulge?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, color = "#D9B98C", label, labelColor = "#2B1B10", open = false, bulge = 1 }) => {
  const body = lathe(
    "sack",
    [
      [0.001, 0],
      [0.26, 0.02],
      [0.36, 0.14],
      [0.38, 0.3],
      [0.3, 0.48],
      [0.15, 0.58],
      [0.12, 0.62],
    ],
    48,
  );
  const tex = label ? textTexture(`sack:${label}`, { text: label, w: 1024, h: 384, bg: "#FFF6E3", fg: labelColor, radius: 60, size: 220 }) : null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh scale={[bulge, 1, bulge]} geometry={body} material={M.bag(color)} castShadow receiveShadow />
      {open && (
        <group position={[0, 0.6, 0]}>
          {/* Rolled rim and a dark opening so it reads as a sack, not a ball */}
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[bulge, bulge, 1]} geometry={torus(0.13, 0.04, 10, 32)} material={M.bag(color)} castShadow />
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[bulge, bulge, 1]} geometry={custom("sackHole", () => new THREE.CircleGeometry(0.12, 28))} material={paint("#4A3424", 0.9)} />
        </group>
      )}
      {!open && (
        <>
          <mesh position={[0, 0.66, 0]} geometry={torus(0.095, 0.025, 8, 24)} rotation={[Math.PI / 2, 0, 0]} material={paint("#7A5232", 0.7)} />
          {[-0.5, 0.5].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.05, 0.74, 0]} rotation={[0, 0, a]} scale={[1, 1.4, 0.6]} geometry={sphere(0.07, 16, 12)} material={M.bag(color)} castShadow />
          ))}
        </>
      )}
      {tex && (
        <mesh position={[0, 0.27, 0.385 * bulge]} rotation={[-0.05, 0, 0]} geometry={rbox(0.52, 0.2, 0.02, 0.008)}>
          <meshStandardMaterial attach="material-0" color="#FFF6E3" roughness={0.8} />
          <meshStandardMaterial attach="material-1" color="#FFF6E3" roughness={0.8} />
          <meshStandardMaterial attach="material-2" color="#FFF6E3" roughness={0.8} />
          <meshStandardMaterial attach="material-3" color="#FFF6E3" roughness={0.8} />
          <meshStandardMaterial attach="material-4" map={tex} roughness={0.8} />
          <meshStandardMaterial attach="material-5" color="#FFF6E3" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
};

// Envelope with a folded flap
export const Envelope: React.FC<{ position?: V3; rotation?: V3; scale?: number | V3; label?: string }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, label }) => {
  const flap = custom("envFlap", () => {
    const s = new THREE.Shape();
    s.moveTo(-0.3, 0);
    s.lineTo(0.3, 0);
    s.lineTo(0, -0.18);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: false });
  });
  const tex = label ? textTexture(`env:${label}`, { text: label, w: 512, h: 256, bg: null, fg: "#7A5232", size: 150 }) : null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={rbox(0.62, 0.025, 0.4, 0.01)} material={M.envelope()} castShadow receiveShadow />
      <mesh position={[0, 0.014, -0.2]} rotation={[-Math.PI / 2, 0, 0]} geometry={flap} material={std("envFlap", { color: "#E8CF9C", roughness: 0.8 })} />
      {tex && (
        <mesh position={[0.05, 0.016, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.34, 0.17]} />
          <meshStandardMaterial map={tex} transparent roughness={0.8} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      )}
    </group>
  );
};
