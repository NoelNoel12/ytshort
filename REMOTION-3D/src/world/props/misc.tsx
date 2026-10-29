// Cement mixer, balance scale, 3D speech bubbles, answer card, cutaway soil block, particles.
import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { M, paint, std } from "../materials";
import { box, boxW, capsule, custom, cyl, lathe, rbox, rboxW, rock, sphere, torus } from "../geom";
import { textTexture } from "./text";
import { mergeGeoms } from "../Ground";
import { rng } from "../noise";

type V3 = [number, number, number];

// Orange cement mixer ("molen"), drum spins with `spin`
export const CementMixer: React.FC<{ position?: V3; rotY?: number; scale?: number; spin?: number }> = ({ position = [0, 0, 0], rotY = 0, scale = 1, spin = 0 }) => {
  const drum = lathe(
    "molenDrum",
    [
      [0.001, -0.62],
      [0.18, -0.6],
      [0.46, -0.32],
      [0.5, 0],
      [0.46, 0.22],
      [0.28, 0.5],
      [0.22, 0.6],
    ],
    56,
  );
  const orange = paint("#F07A2E", 0.32, 0.15);
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={custom("molenBlob", () => new THREE.CircleGeometry(1.0, 40))} material={M.blob()} renderOrder={2} />
      {/* Frame and wheels */}
      <mesh position={[0, 0.38, 0]} geometry={rbox(1.3, 0.1, 0.5, 0.03)} material={M.darkMetal()} castShadow />
      {[-1, 1].map((s) => (
        <group key={s} position={[-0.35, 0.24, s * 0.36]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} geometry={torus(0.17, 0.07, 12, 32)} material={M.rubber()} castShadow />
          <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cyl(0.1, 0.1, 0.08, 24)} material={paint("#E8E3D8", 0.4, 0.4)} />
        </group>
      ))}
      <mesh position={[0.55, 0.2, 0]} geometry={rbox(0.08, 0.4, 0.08, 0.02)} material={M.darkMetal()} castShadow />
      {/* Engine box */}
      <mesh position={[0.45, 0.62, -0.05]} geometry={rbox(0.38, 0.36, 0.42, 0.05)} material={orange} castShadow />
      <mesh position={[0.45, 0.62, 0.17]} geometry={rbox(0.24, 0.18, 0.02, 0.01)} material={M.darkMetal()} />
      {/* Yoke */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-0.1, 0.85, s * 0.56]} geometry={rbox(0.08, 0.9, 0.08, 0.02)} material={orange} castShadow />
      ))}
      {/* Tilted drum */}
      <group position={[-0.1, 1.05, 0]} rotation={[0, 0, 0.55]}>
        <group rotation={[0, spin, 0]}>
          <mesh geometry={drum} material={orange} castShadow receiveShadow />
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} rotation={[0, (k * Math.PI) / 2, 0]} position={[0, -0.05, 0]}>
              <primitive object={custom("molenRib", () => new THREE.TorusGeometry(0.495, 0.025, 8, 48, 0.5))} attach="geometry" />
              <primitive object={paint("#C95F22", 0.4)} attach="material" />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={torus(0.22, 0.04, 10, 32)} material={paint("#C95F22", 0.4)} />
      </group>
      {/* Handle wheel */}
      <mesh position={[0.75, 1.0, 0]} rotation={[0, Math.PI / 2, 0]} geometry={torus(0.16, 0.025, 8, 32)} material={M.darkMetal()} />
    </group>
  );
};

// Wooden balance scale; tilt in radians (positive = right pan down)
export const BalanceScale: React.FC<{ position?: V3; rotY?: number; scale?: number; tilt: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ position = [0, 0, 0], rotY = 0, scale = 1, tilt, left, right }) => {
  const arm = 0.85;
  const hang = 0.55;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      <mesh position={[0, 0.06, 0]} geometry={rboxW(0.9, 0.12, 0.6, 0.04, 1)} material={M.woodDark()} castShadow receiveShadow />
      <mesh position={[0, 0.75, 0]} geometry={rbox(0.12, 1.3, 0.12, 0.03)} material={M.wood()} castShadow />
      <mesh position={[0, 1.42, 0]} geometry={sphere(0.09, 24, 16)} material={M.gold()} castShadow />
      <group position={[0, 1.4, 0.0]} rotation={[0, 0, -tilt]}>
        <mesh geometry={rbox(arm * 2 + 0.1, 0.08, 0.1, 0.03)} material={M.wood()} castShadow />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * arm, 0, 0]} rotation={[0, 0, tilt]}>
            {[-0.18, 0.18].map((dz) => (
              <mesh key={dz} position={[0, -hang / 2, dz]} geometry={cyl(0.008, 0.008, hang, 6)} material={M.cable()} />
            ))}
            <group position={[0, -hang, 0]}>
              <mesh geometry={cyl(0.36, 0.3, 0.06, 40)} material={M.gold()} castShadow receiveShadow />
              <group position={[0, 0.03, 0]}>{s < 0 ? left : right}</group>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
};

// 3D speech bubble: rounded slab, tail cone, text on the front
export const SpeechBubble: React.FC<{ position?: V3; rotation?: V3; scale?: number; text: string; w?: number; h?: number; color?: string; fg?: string; tailSide?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, text, w = 1.5, h = 0.75, color = "#FFFFFF", fg = "#1F2A44", tailSide = -1 }) => {
  const tex = textTexture(`bubble:${text}:${fg}`, { text, w: 1024, h: Math.round((1024 * h) / w), fg, size: 260 });
  const mat = paint(color, 0.35);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={rbox(w, h, 0.24, Math.min(h * 0.45, 0.3), 5)} material={mat} castShadow />
      <mesh position={[tailSide * w * 0.22, -h / 2 - 0.12, 0]} rotation={[0, 0, tailSide * -0.5 + Math.PI]} geometry={custom("bubbleTail", () => new THREE.ConeGeometry(0.14, 0.34, 24))} material={mat} castShadow />
      <mesh position={[0, 0, 0.125]}>
        <planeGeometry args={[w * 0.9, h * 0.85]} />
        <meshStandardMaterial map={tex} transparent roughness={0.5} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  );
};

// Answer card with a green check mark (S9)
export const AnswerCard: React.FC<{ position?: V3; rotation?: V3; scale?: number; check: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, check }) => {
  const checkGeo = custom("check", () => {
    const s = new THREE.Shape();
    s.moveTo(-0.32, 0.02);
    s.lineTo(-0.12, -0.2);
    s.lineTo(0.34, 0.28);
    s.lineTo(0.26, 0.36);
    s.lineTo(-0.12, -0.04);
    s.lineTo(-0.24, 0.1);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 });
    return g;
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={rbox(1.5, 1.0, 0.12, 0.08, 4)} material={paint("#FFFDF6", 0.4)} castShadow />
      <mesh position={[0, 0, 0.065]} geometry={rbox(1.36, 0.86, 0.01, 0.06)} material={paint("#E8F6E8", 0.5)} />
      {check > 0.01 && <mesh position={[0, 0, 0.06]} scale={[check, check, 1]} geometry={checkGeo} material={paint("#2FA65A", 0.35)} castShadow />}
    </group>
  );
};

// Comment balloon with a small icon (dots, heart or question mark)
export const CommentBubble: React.FC<{ position?: V3; scale?: number; icon: "dots" | "heart" | "?"; color?: string }> = ({ position = [0, 0, 0], scale = 1, icon, color = "#FFFFFF" }) => {
  const mat = paint(color, 0.35);
  const ink = paint("#1F2A44", 0.4);
  return (
    <group position={position} scale={scale}>
      <mesh geometry={rbox(1.0, 0.7, 0.22, 0.3, 5)} material={mat} castShadow />
      <mesh position={[-0.25, -0.42, 0]} rotation={[0, 0, Math.PI + 0.5]} geometry={custom("bubbleTail", () => new THREE.ConeGeometry(0.14, 0.34, 24))} material={mat} castShadow />
      <group position={[0, 0, 0.12]}>
        {icon === "dots" && [-0.22, 0, 0.22].map((x) => <mesh key={x} position={[x, 0, 0]} geometry={sphere(0.07, 20, 14)} material={ink} />)}
        {icon === "heart" && (
          <group scale={0.5} position={[0, -0.05, 0]}>
            <mesh position={[-0.13, 0.08, 0]} geometry={sphere(0.17, 24, 16)} material={paint("#E94F5A", 0.35)} />
            <mesh position={[0.13, 0.08, 0]} geometry={sphere(0.17, 24, 16)} material={paint("#E94F5A", 0.35)} />
            <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 4]} geometry={rbox(0.3, 0.3, 0.3, 0.06)} material={paint("#E94F5A", 0.35)} />
          </group>
        )}
        {icon === "?" && (
          <group position={[0, 0.02, 0]}>
            <mesh position={[0, 0.08, 0]} rotation={[0, 0, -0.3]} geometry={torus(0.12, 0.045, 10, 30, Math.PI * 1.4)} material={ink} />
            <mesh position={[0.02, -0.08, 0]} geometry={capsule(0.04, 0.06, 4, 10)} material={ink} />
            <mesh position={[0.02, -0.22, 0]} geometry={sphere(0.05, 16, 12)} material={ink} />
          </group>
        )}
      </group>
    </group>
  );
};

// Cutaway soil block: grass top, layered soil sides (S6 garden stage)
export const SoilBlock: React.FC<{ position?: V3; size?: V3 }> = ({ position = [0, 0, 0], size = [5, 1.6, 3.2] }) => {
  const [w, h, d] = size;
  const layers = [
    { t: 0.16, mat: M.grassPatch() },
    { t: 0.45, mat: std("soilTop", { color: "#7A4E33", roughness: 1 }) },
    { t: 0.55, mat: M.soil() },
    { t: h - 1.16, mat: std("soilDeep", { color: "#A9744F", roughness: 1 }) },
  ];
  let y = 0;
  const stones = useMemo(() => {
    const r = rng("soilstones");
    return Array.from({ length: 14 }, () => ({ p: [(r() - 0.5) * (w - 0.4), -0.6 - r() * (h - 0.9), d / 2 + 0.02] as V3, s: 0.07 + r() * 0.1, rot: [r() * 3, r() * 3, r() * 3] as V3 }));
  }, [w, h, d]);
  return (
    <group position={position}>
      {layers.map((l, k) => {
        const yc = h - y - l.t / 2;
        y += l.t;
        return <mesh key={k} position={[0, yc - h, 0]} geometry={k === 0 ? rboxW(w + 0.04, l.t, d + 0.04, 0.04, 2) : boxW(w, l.t, d, 1.5)} material={l.mat} castShadow receiveShadow />;
      })}
      {stones.map((s, k) => (
        <mesh key={k} position={s.p} rotation={s.rot} geometry={rock(1)} scale={[s.s, s.s * 0.7, s.s * 0.5]} material={paint("#9A9186", 0.9)} castShadow />
      ))}
      {/* Roots poking through the top layer */}
      {[-1.4, 0.3, 1.6].map((x, k) => (
        <mesh key={x} position={[x, -0.4 - k * 0.05, d / 2 + 0.01]} rotation={[0, 0, 0.6 - k * 0.5]} geometry={capsule(0.025, 0.4, 4, 8)} material={paint("#6B4A30", 0.9)} />
      ))}
    </group>
  );
};

// ---------- deterministic particles ----------

// Dust puffs: soft spheres expanding and fading from an impact frame
export const Dust: React.FC<{ frame: number; at: number; origin: V3; count?: number; spread?: number; seed: string; color?: string; size?: number }> = ({ frame, at, origin, count = 10, spread = 1, seed, color = "#E8DCC8", size = 0.16 }) => {
  const d = frame - at;
  if (d < 0 || d > 26) return null;
  const t = d / 26;
  return (
    <group position={origin}>
      {Array.from({ length: count }, (_, k) => {
        const a = random(`${seed}-a-${k}`) * Math.PI * 2;
        const sp = (0.5 + random(`${seed}-s-${k}`)) * spread;
        const r = (1 - Math.pow(1 - t, 2.2)) * sp;
        const s = size * (0.6 + random(`${seed}-z-${k}`) * 0.8) * (1 + t * 1.6) * (1 - t);
        return <mesh key={k} position={[Math.cos(a) * r, 0.05 + t * 0.35 * sp, Math.sin(a) * r]} scale={s} geometry={sphere(1, 16, 12)} material={std(`dust:${color}`, { color, roughness: 1, transparent: true, opacity: 0.85 })} />;
      })}
    </group>
  );
};

// Feathers floating down with a sway
export const Feathers: React.FC<{ frame: number; at: number; origin: V3; count?: number; seed: string }> = ({ frame, at, origin, count = 8, seed }) => {
  const d = frame - at;
  if (d < 0 || d > 90) return null;
  const t = d / 30;
  return (
    <group position={origin}>
      {Array.from({ length: count }, (_, k) => {
        const a = random(`${seed}-a-${k}`) * Math.PI * 2;
        const burst = Math.min(1, t * 3) * (0.4 + random(`${seed}-r-${k}`) * 0.6);
        const fall = Math.max(0, t - 0.25) * 0.55;
        const sway = Math.sin(t * 5 + k) * 0.12;
        return (
          <mesh key={k} position={[Math.cos(a) * burst + sway, 0.2 + burst * 0.5 - fall, Math.sin(a) * burst]} rotation={[Math.sin(t * 4 + k) * 0.8, a, Math.cos(t * 3 + k) * 0.6]} scale={[0.05, 0.012, 0.13]} geometry={sphere(1, 12, 8)} material={k % 2 ? M.pigeonLight() : M.pigeon()} />
        );
      })}
    </group>
  );
};

// Merged geometry helper for many small rocks (re-export to keep imports tidy)
export const mergedRocks = (key: string, n: number) =>
  custom(`rocks:${key}`, () => {
    const r = rng(key);
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.DodecahedronGeometry(0.1 + r() * 0.08, 0);
      g.translate((r() - 0.5) * 2, 0, (r() - 0.5) * 2);
      parts.push(g);
    }
    return mergeGeoms(parts);
  });

export const Box: React.FC<{ position: V3; size: V3; color: string }> = ({ position, size, color }) => <mesh position={position} geometry={box(...size)} material={paint(color, 0.6)} castShadow />;
