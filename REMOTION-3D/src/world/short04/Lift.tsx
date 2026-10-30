// Lift cabin (cutaway front), sliding doors on the lobby side, and a Faraday-cage mode.
import React, { useMemo } from "react";
import * as THREE from "three";
import { M, paint, std } from "../materials";
import { box, cyl, rbox } from "../geom";
import { BLD, SHAFT_CX, SHAFT_CZ } from "./Building";

type V3 = [number, number, number];

export const CABIN = { w: 1.95, h: 2.45, d: 1.95, t: 0.07 };
export const cabinCenter = (y: number): V3 => [SHAFT_CX, y, SHAFT_CZ];

// Brushed steel with a soft vertical grain (large features only, no fine noise)
export const cabinSteel = () => std("cabinSteel", { color: "#C7CDD6", roughness: 0.32, metalness: 0.85, envMapIntensity: 1.3 });

type Props = {
  y: number; // cabin floor height
  door?: number; // 0 closed, 1 open
  cage?: number; // 0 solid walls, 1 see-through lattice
  light?: number; // ceiling light 0..1
  glint?: number; // wall shine sweep 0..1 (outside 0..1 hidden)
  at?: V3; // place the cabin somewhere other than the shaft (props, models)
  children?: React.ReactNode; // contents placed relative to the cabin floor centre
};

export const Cabin: React.FC<Props> = ({ y, door = 0, cage = 0, light = 1, glint = -1, at, children }) => {
  const { w, h, d, t } = CABIN;
  // Per-instance wall material so cage mode can fade it without touching other steel
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#C7CDD6", roughness: 0.32, metalness: 0.85, envMapIntensity: 1.3, transparent: true }), []);
  wallMat.opacity = 1 - cage * 0.92;
  wallMat.depthWrite = cage < 0.5;
  const gridMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9FB2C8", roughness: 0.3, metalness: 0.9, emissive: new THREE.Color("#7FB6FF"), emissiveIntensity: 0 }), []);
  gridMat.emissiveIntensity = cage * 0.35;
  const doorW = 0.5;
  const slide = door * (doorW - 0.04);
  // Lattice bars for the cage: verticals and horizontals on back, right, left and ceiling
  const bars = useMemo(() => {
    const out: { p: V3; s: V3 }[] = [];
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const fx = -w / 2 + (i / n) * w;
      const fz = -d / 2 + (i / n) * d;
      const fy = (i / n) * h;
      out.push({ p: [fx, h / 2, -d / 2], s: [0.035, h, 0.035] });
      out.push({ p: [w / 2, h / 2, fz], s: [0.035, h, 0.035] });
      out.push({ p: [-w / 2, h / 2, fz], s: [0.035, h, 0.035] });
      out.push({ p: [0, fy, -d / 2], s: [w, 0.035, 0.035] });
      out.push({ p: [w / 2, fy, 0], s: [0.035, 0.035, d] });
      out.push({ p: [-w / 2, fy, 0], s: [0.035, 0.035, d] });
      out.push({ p: [fx, h, 0], s: [0.035, 0.035, d] });
      out.push({ p: [0, h, fz], s: [w, 0.035, 0.035] });
    }
    return out;
  }, [w, h, d]);
  const [cx, , cz] = at ?? cabinCenter(y);
  return (
    <group position={[cx, at ? at[1] : y, cz]}>
      {/* Floor and ceiling */}
      <mesh position={[0, -t / 2, 0]} geometry={rbox(w + 0.1, t, d + 0.05, 0.02)} material={paint("#4A4F58", 0.6, 0.4)} castShadow receiveShadow />
      <mesh position={[0, 0.005, 0]} geometry={box(w - 0.1, 0.01, d - 0.1)} material={paint("#6B5B4E", 0.8)} receiveShadow />
      <mesh position={[0, h + t / 2, 0]} geometry={rbox(w + 0.1, t, d + 0.05, 0.02)} material={wallMat} castShadow />
      {/* Light panel */}
      <mesh position={[0, h - 0.01, 0]} geometry={rbox(1.0, 0.03, 0.7, 0.01)} material={std("cabinLight", { color: "#FFF6E0", emissive: "#FFEBC4", emissiveIntensity: 1.6 })} visible={light > 0.05} />
      {light > 0.05 && <pointLight position={[0, h - 0.35, 0.2]} color="#FFE2B0" intensity={light * 6} distance={4.5} decay={2} />}
      {/* Back and right walls */}
      <mesh position={[0, h / 2, -d / 2 + t / 2]} geometry={box(w, h, t)} material={wallMat} castShadow receiveShadow />
      <mesh position={[w / 2 - t / 2, h / 2, 0]} geometry={box(t, h, d)} material={wallMat} castShadow receiveShadow />
      {/* Handrail on the back wall */}
      <mesh position={[0, 0.95, -d / 2 + 0.12]} rotation={[0, 0, Math.PI / 2]} geometry={cyl(0.025, 0.025, w - 0.4, 16)} material={M.steel()} />
      {/* Left wall: frame around the door opening (lobby side) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-w / 2 + t / 2, h / 2, s * (doorW + (d / 2 - doorW) / 2)]} geometry={box(t, h, d / 2 - doorW)} material={wallMat} castShadow receiveShadow />
      ))}
      <mesh position={[-w / 2 + t / 2, 2.2 + (h - 2.2) / 2, 0]} geometry={box(t, h - 2.2, doorW * 2)} material={wallMat} castShadow />
      {/* Sliding doors (move along z) */}
      {[-1, 1].map((s) => (
        <mesh key={`door${s}`} position={[-w / 2 - 0.02, 1.1, s * (doorW / 2 + slide)]} geometry={rbox(0.05, 2.2, doorW - 0.01, 0.012)} material={cabinSteel()} castShadow />
      ))}
      {/* Button panel inside */}
      <mesh position={[w / 2 - t - 0.02, 1.25, d / 2 - 0.35]} geometry={rbox(0.03, 0.5, 0.18, 0.01)} material={M.darkMetal()} />
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[w / 2 - t - 0.04, 1.08 + k * 0.1, d / 2 - 0.35]} rotation={[0, 0, Math.PI / 2]} geometry={cyl(0.025, 0.025, 0.01, 16)} material={std("liftBtn", { color: "#F4F1E8", emissive: "#FFE7A0", emissiveIntensity: 0.4 })} />
      ))}
      {/* Wall shine sweep (S1 "kotak yang kuat") */}
      {glint > 0 && glint < 1 && (
        <mesh position={[(glint - 0.5) * w * 1.4, h / 2, -d / 2 + t + 0.01]} rotation={[0, 0, -0.4]} geometry={box(0.25, h * 1.6, 0.005)} material={std("cabinGlint", { color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 1.2, transparent: true, opacity: 0.5, depthWrite: false } as THREE.MeshStandardMaterialParameters)} />
      )}
      {/* Faraday lattice */}
      {cage > 0.01 &&
        bars.map((b, k) => (
          <mesh key={`bar${k}`} position={b.p} geometry={box(...b.s)} material={gridMat} castShadow />
        ))}
      <group>{children}</group>
    </group>
  );
};

// Ground-floor landing doors (lobby side of the shaft), animated with the cabin doors
export const LandingDoor: React.FC<{ open: number }> = ({ open }) => {
  const doorW = 0.55;
  const slide = open * (doorW - 0.04);
  const x = BLD.shaft.x0 - 0.12;
  return (
    <group position={[x, BLD.groundY + 1.15, SHAFT_CZ]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, s * (doorW / 2 + slide)]} geometry={rbox(0.05, 2.28, doorW - 0.01, 0.012)} material={M.steel()} castShadow />
      ))}
    </group>
  );
};
