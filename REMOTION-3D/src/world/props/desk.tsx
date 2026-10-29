// Cashier desk, calculator, installment box, blocks, flip calendar, small tables.
import React, { useMemo } from "react";
import * as THREE from "three";
import { M, paint, std } from "../materials";
import { box, boxW, custom, cyl, rbox, rboxW, sphere } from "../geom";
import { cachedTexture } from "../textures";
import { textTexture } from "./text";
import { VIS } from "../../finance";

type V3 = [number, number, number];

export const DESK = { w: 1.9, h: 1.05, d: 0.8 };

// Wooden cashier counter with a PINJAMAN sign, no bank branding
export const CashierDesk: React.FC<{ position?: V3; rotY?: number; scale?: number | V3 }> = ({ position = [0, 0, 0], rotY = 0, scale = 1 }) => {
  const sign = textTexture("pinjaman", { text: "PINJAMAN", w: 1024, h: 256, bg: "#24543F", fg: "#FFF2C8", border: "#E8C66A", radius: 40, size: 170 });
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={custom("deskBlob", () => new THREE.PlaneGeometry(DESK.w * 1.5, DESK.d * 2))} material={M.blob()} renderOrder={2} />
      {/* Body */}
      <mesh position={[0, DESK.h / 2, 0]} geometry={rboxW(DESK.w, DESK.h, DESK.d, 0.05, 1.2)} material={M.woodCounter()} castShadow receiveShadow />
      {/* Plinth and top */}
      <mesh position={[0, 0.06, 0.01]} geometry={rbox(DESK.w + 0.06, 0.12, DESK.d + 0.06, 0.03)} material={M.woodDark()} castShadow />
      <mesh position={[0, DESK.h + 0.04, 0.02]} geometry={rboxW(DESK.w + 0.18, 0.08, DESK.d + 0.2, 0.03, 1.2)} material={M.woodDark()} castShadow receiveShadow />
      {/* Front panels */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.47, 0.42, DESK.d / 2 + 0.01]} geometry={rbox(0.8, 0.5, 0.03, 0.02)} material={M.woodLight()} castShadow />
      ))}
      {/* Sign */}
      <group position={[0, 0.84, DESK.d / 2 + 0.03]}>
        <mesh geometry={rbox(1.5, 0.4, 0.04, 0.02)} material={paint("#1C3E2F", 0.5)} castShadow />
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[1.44, 0.36]} />
          <meshStandardMaterial map={sign} roughness={0.5} />
        </mesh>
      </group>
      {/* Little bell and stamp on the top */}
      <group position={[0.6, DESK.h + 0.08, -0.15]}>
        <mesh position={[0, 0.02, 0]} geometry={cyl(0.08, 0.09, 0.03, 32)} material={M.darkMetal()} castShadow />
        <mesh position={[0, 0.06, 0]} geometry={custom("bell", () => new THREE.SphereGeometry(0.07, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2))} material={M.gold()} castShadow />
      </group>
    </group>
  );
};

const lcdTexture = (key: string, line: string, on: number) =>
  textTexture(`lcd:${key}:${on > 0.5 ? 1 : 0}`, { text: line, w: 1024, h: 256, bg: on > 0.5 ? "#C8E6B0" : "#7D8F72", fg: on > 0.5 ? "#1F3020" : "#6D7E63", radius: 24, size: 150, font: "Plus Jakarta Sans", weight: 800 });

// Giant desk calculator lying flat (screen faces up/forward)
export const Calculator: React.FC<{ position?: V3; rotation?: V3; scale?: number; line: string; on: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, line, on }) => {
  const screen = lcdTexture("calc", line, on);
  const keys = useMemo(() => {
    const out: { p: V3; c: string }[] = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) out.push({ p: [-0.24 + c * 0.16, 0.05, 0.02 + r * 0.13], c: c === 3 ? "#F28C38" : r === 3 && c === 2 ? "#E04B3C" : "#E8E3D8" });
    return out;
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={rbox(0.72, 0.09, 0.9, 0.04)} material={paint("#3B3F47", 0.5)} castShadow receiveShadow />
      <mesh position={[0, 0.047, -0.26]} geometry={rbox(0.6, 0.012, 0.22, 0.01)} material={paint("#24272D", 0.4)} />
      <mesh position={[0, 0.055, -0.26]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.56, 0.18]} />
        <meshStandardMaterial map={screen} roughness={0.3} emissive="#ffffff" emissiveMap={screen} emissiveIntensity={on > 0.5 ? 0.35 : 0} />
      </mesh>
      {keys.map((k, i) => (
        <mesh key={i} position={k.p} geometry={rbox(0.12, 0.04, 0.1, 0.018)} material={paint(k.c, 0.45)} castShadow />
      ))}
    </group>
  );
};

// Glass-walled installment box with a wooden frame
export const InstallmentBox: React.FC<{ position?: V3; size?: V3 }> = ({ position = [0, 0, 0], size = [1.5, 1.7, 1.2] }) => {
  const [w, h, d] = size;
  const posts: V3[] = [
    [-w / 2, h / 2, -d / 2],
    [w / 2, h / 2, -d / 2],
    [-w / 2, h / 2, d / 2],
    [w / 2, h / 2, d / 2],
  ];
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} geometry={rboxW(w + 0.16, 0.1, d + 0.16, 0.03, 1.2)} material={M.woodDark()} castShadow receiveShadow />
      {posts.map((p, k) => (
        <mesh key={k} position={p} geometry={rbox(0.07, h, 0.07, 0.02)} material={M.woodDark()} castShadow />
      ))}
      <mesh position={[0, h, 0]} geometry={rbox(w + 0.1, 0.06, d + 0.1, 0.02)} material={M.woodDark()} castShadow />
      <mesh position={[0, h / 2 + 0.05, 0]} geometry={box(w - 0.02, h - 0.1, d - 0.02)} material={M.boxGlass()} renderOrder={3} />
    </group>
  );
};

// Principal block (gold) and interest block (red); heights from finance.ts
export const PrincipalBlock: React.FC<{ position?: V3; scale?: V3 }> = ({ position = [0, 0, 0], scale = [1, 1, 1] }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, VIS.principalBlockH / 2, 0]} geometry={rbox(0.9, VIS.principalBlockH, 0.7, 0.06)} material={M.gold()} castShadow receiveShadow />
    <mesh position={[0, VIS.principalBlockH * 0.5, 0.352]} geometry={rbox(0.5, 0.08, 0.01, 0.004)} material={paint("#D89A1E", 0.3, 0.8)} />
  </group>
);

export const INTEREST_H = VIS.interestBlockH * VIS.interestVisualScale;
export const InterestBlock: React.FC<{ position?: V3; scale?: V3 }> = ({ position = [0, 0, 0], scale = [1, 1, 1] }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, INTEREST_H / 2, 0]} geometry={rbox(0.9, INTEREST_H, 0.7, 0.05)} material={M.interestRed()} castShadow receiveShadow />
  </group>
);

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

// Calendar page: month name plus a tiny gold-and-red stack (same every month)
const pageTexture = (m: number) =>
  cachedTexture(`calpage:${m}`, 512, 640, (ctx, w, h) => {
    ctx.fillStyle = "#FFFDF6";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#D94B3F";
    ctx.fillRect(0, 0, w, h * 0.26);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${Math.round(h * 0.17)}px "Baloo 2"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(MONTHS[m % 12], w / 2, h * 0.14);
    // Stack icon
    ctx.fillStyle = "#F2B632";
    ctx.fillRect(w * 0.3, h * 0.45, w * 0.4, h * 0.3);
    ctx.fillStyle = "#D94B3F";
    ctx.fillRect(w * 0.3, h * 0.39, w * 0.4, h * 0.06);
    ctx.strokeStyle = "rgba(60,40,20,0.35)";
    ctx.lineWidth = 6;
    ctx.strokeRect(w * 0.3, h * 0.39, w * 0.4, h * 0.36);
  });

// Desk flip calendar; `page` is a float: integer part = month shown, fraction = flip progress
export const FlipCalendar: React.FC<{ position?: V3; rotation?: V3; scale?: number; page: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, page }) => {
  const W = 0.9;
  const H = 1.1;
  const cur = Math.max(0, Math.min(11, Math.floor(page)));
  const t = page - cur;
  const pageGeo = custom("calPageGeo", () => {
    const g = new THREE.PlaneGeometry(W, H);
    g.translate(0, -H / 2, 0); // hinge at the top
    return g;
  });
  const pageMats = useMemo(() => MONTHS.map((_, m) => new THREE.MeshStandardMaterial({ map: pageTexture(m), roughness: 0.85, side: THREE.DoubleSide })), []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Stand */}
      <mesh position={[0, 0.05, -0.1]} geometry={rbox(W + 0.2, 0.1, 0.5, 0.03)} material={M.woodDark()} castShadow receiveShadow />
      <mesh position={[0, H / 2 + 0.1, -0.2]} rotation={[-0.15, 0, 0]} geometry={rbox(W + 0.1, H + 0.1, 0.05, 0.02)} material={paint("#3B3F47", 0.6)} castShadow />
      <group position={[0, H + 0.16, -0.12]} rotation={[-0.15, 0, 0]}>
        {/* Ring binders */}
        {[-0.3, 0, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.02, 0.01]} rotation={[0, Math.PI / 2, 0]} geometry={custom("binder", () => new THREE.TorusGeometry(0.04, 0.012, 8, 20))} material={M.steel()} />
        ))}
        {/* Next page underneath, current page on top flipping up and over */}
        {cur < 11 && <mesh position={[0, 0, 0.004]} geometry={pageGeo} material={pageMats[cur + 1]} />}
        <mesh position={[0, 0, 0.01]} rotation={[-Math.PI * Math.min(1, t * 1.05), 0, 0]} geometry={pageGeo} material={pageMats[cur]} castShadow />
      </group>
    </group>
  );
};

// Small calendar tile showing a label (S2: "1%" each month)
export const MiniCalendar: React.FC<{ position?: V3; rotation?: V3; scale?: number; label: string; month: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, label, month }) => {
  const tex = cachedTexture(`minical:${label}:${month}`, 256, 320, (ctx, w, h) => {
    ctx.fillStyle = "#FFFDF6";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#D94B3F";
    ctx.fillRect(0, 0, w, h * 0.3);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(h * 0.17)}px "Baloo 2"`;
    ctx.fillText(MONTHS[month % 12], w / 2, h * 0.16);
    ctx.fillStyle = "#24543F";
    ctx.font = `800 ${Math.round(h * 0.36)}px "Baloo 2"`;
    ctx.fillText(label, w / 2, h * 0.66);
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={rbox(0.42, 0.52, 0.05, 0.02)} material={paint("#3B3F47", 0.6)} castShadow />
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[0.38, 0.48]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.27, 0.02]} rotation={[0, 0, Math.PI / 2]} geometry={cyl(0.015, 0.015, 0.3, 10)} material={M.steel()} />
    </group>
  );
};

// Simple wooden table (porch)
export const WoodTable: React.FC<{ position?: V3; rotY?: number; w?: number; d?: number; h?: number }> = ({ position = [0, 0, 0], rotY = 0, w = 2.0, d = 1.1, h = 0.85 }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh position={[0, h, 0]} geometry={rboxW(w, 0.08, d, 0.03, 1.4)} material={M.woodCounter()} castShadow receiveShadow />
    {[
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].map(([sx, sz]) => (
      <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1)]} geometry={rbox(0.08, h, 0.08, 0.02)} material={M.woodDark()} castShadow />
    ))}
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={custom("tableBlob", () => new THREE.PlaneGeometry(2.6, 1.6))} material={M.blob()} renderOrder={2} />
  </group>
);

// Glossy sparkle star (for "berkilau" moments)
export const Sparkle: React.FC<{ position: V3; s: number }> = ({ position, s }) =>
  s > 0.01 ? (
    <group position={position} scale={s}>
      <mesh geometry={custom("sparkle", () => new THREE.OctahedronGeometry(0.08, 0))} scale={[0.35, 1.3, 0.35]} material={std("sparkleMat", { color: "#FFF6C8", emissive: "#FFE58A", emissiveIntensity: 2, toneMapped: false } as THREE.MeshStandardMaterialParameters)} />
      <mesh geometry={custom("sparkle", () => new THREE.OctahedronGeometry(0.08, 0))} scale={[1.3, 0.35, 0.35]} material={std("sparkleMat", { color: "#FFF6C8", emissive: "#FFE58A", emissiveIntensity: 2, toneMapped: false } as THREE.MeshStandardMaterialParameters)} />
    </group>
  ) : null;

export const Ball: React.FC<{ position: V3; r: number; color: string }> = ({ position, r, color }) => <mesh position={position} geometry={sphere(r, 24, 16)} material={paint(color, 0.4)} castShadow />;

export const Slab: React.FC<{ position: V3; size: V3; mat: THREE.Material }> = ({ position, size, mat }) => <mesh position={position} geometry={boxW(size[0], size[1], size[2], 1)} material={mat} castShadow receiveShadow />;
