// Signal props: rings, bars, phone, call icon, charges, antennas, cable, repeater, ghost sheet. All generic, no logos.
import React, { useMemo } from "react";
import * as THREE from "three";
import { M, paint, std } from "../materials";
import { box, capsule, custom, cyl, rbox, sphere, torus } from "../geom";
import { textTexture } from "../props/text";

type V3 = [number, number, number];

// ---------- signal rings ----------
const ringMats = new Map<string, THREE.MeshStandardMaterial>();
const ringMat = (color: string) => {
  let m = ringMats.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 1.1, transparent: true, depthWrite: false, roughness: 0.4, toneMapped: false, side: THREE.DoubleSide });
    ringMats.set(color, m);
  }
  return m;
};

// One expanding ring travelling along a direction (opacity is quantised so materials are shared)
export const Ring: React.FC<{ position: V3; dir: V3; radius: number; opacity: number; color?: string; tube?: number }> = ({ position, dir, radius, opacity, color = "#7FE3FF", tube = 0.05 }) => {
  const q = useMemo(() => new THREE.Quaternion(), []);
  if (opacity <= 0.01 || radius <= 0.01) return null;
  q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...dir).normalize());
  // Quantise opacity so materials are shared (no per-frame material creation)
  const bucket = Math.max(1, Math.min(10, Math.round(opacity * 10)));
  const key = `${color}:${bucket}`;
  let m = ringMats.get(key);
  if (!m) {
    m = ringMat(color).clone();
    m.opacity = bucket / 10;
    ringMats.set(key, m);
  }
  return <mesh position={position} quaternion={q} scale={[radius, radius, radius]} geometry={torus(1, tube, 10, 56)} material={m} />;
};

// ---------- signal bars ----------
// Four rounded bars; `level` 0..4 (fractions animate the next bar), lit bars glow
export const SignalBars: React.FC<{ position: V3; level: number; scale?: number; shake?: number; rotY?: number; frame?: number }> = ({ position, level, scale = 1, shake = 0, rotY = 0, frame = 0 }) => {
  const on = std("barOn", { color: "#7CF29A", emissive: "#4FE07A", emissiveIntensity: 0.9, roughness: 0.35 });
  const off = std("barOff", { color: "#5D6470", roughness: 0.6, transparent: true, opacity: 0.55 });
  const jitter = shake ? Math.sin(frame * 2.7) * 0.03 * shake : 0;
  return (
    <group position={position} rotation={[0, rotY, jitter * 3]} scale={scale}>
      <mesh position={[0, -0.05, 0]} geometry={rbox(0.78, 0.05, 0.12, 0.02)} material={paint("#2B2F36", 0.5)} />
      {[0, 1, 2, 3].map((k) => {
        const h = 0.14 + k * 0.1;
        const lit = Math.max(0, Math.min(1, level - k));
        return (
          <group key={k} position={[-0.27 + k * 0.18, 0, 0]}>
            <mesh position={[0, h / 2, 0]} geometry={rbox(0.12, h, 0.1, 0.03)} material={off} />
            {lit > 0.01 && <mesh position={[0, (h * lit) / 2, 0.006]} scale={[1.05, lit, 1.05]} geometry={rbox(0.12, h, 0.1, 0.03)} material={on} />}
          </group>
        );
      })}
    </group>
  );
};

// ---------- phone ----------
export const Phone: React.FC<{ position?: V3; rotation?: V3; scale?: number; bars?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, bars = 4 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={rbox(0.09, 0.18, 0.015, 0.012)} material={paint("#1F2228", 0.3, 0.3)} castShadow />
    <mesh position={[0, 0, 0.0085]} geometry={box(0.08, 0.165, 0.002)} material={std("phoneScreen", { color: "#2E3B55", emissive: "#5FA8E8", emissiveIntensity: 0.6, roughness: 0.2 })} />
    {[0, 1, 2, 3].map((k) => (
      <mesh key={k} position={[-0.025 + k * 0.012, 0.06 + k * 0.003, 0.0105]} geometry={box(0.008, 0.008 + k * 0.006, 0.001)} material={k < bars ? std("phoneBarOn", { color: "#FFFFFF", emissive: "#FFFFFF", emissiveIntensity: 0.8 }) : std("phoneBarOff", { color: "#5D6470" })} />
    ))}
  </group>
);

// Handset icon that flips into a red cross when the call drops
export const CallIcon: React.FC<{ position: V3; dropped: number; scale?: number }> = ({ position, dropped, scale = 1 }) => {
  const green = std("callGreen", { color: "#3BD16F", emissive: "#2BB55A", emissiveIntensity: 0.6, roughness: 0.4 });
  const red = std("callRed", { color: "#FF4D4D", emissive: "#E02A2A", emissiveIntensity: 0.7, roughness: 0.4 });
  const flip = Math.min(1, dropped * 2);
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cyl(0.2, 0.2, 0.06, 40)} material={dropped > 0.5 ? red : green} />
      <group position={[0, 0, 0.04]} rotation={[0, flip * Math.PI, 0]}>
        {dropped <= 0.5 ? (
          <group rotation={[0, 0, -0.6]}>
            <mesh rotation={[0, 0, Math.PI / 2]} geometry={capsule(0.03, 0.14, 4, 12)} material={paint("#FFFFFF", 0.4)} />
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.09, -0.03, 0]} geometry={capsule(0.035, 0.03, 4, 12)} material={paint("#FFFFFF", 0.4)} />
            ))}
          </group>
        ) : (
          [-1, 1].map((s) => <mesh key={s} rotation={[0, 0, s * 0.78]} geometry={capsule(0.03, 0.18, 4, 12)} material={paint("#FFFFFF", 0.4)} />)
        )}
      </group>
    </group>
  );
};

// ---------- charges ----------
export const Charge: React.FC<{ position: V3; r?: number; color?: string; glow?: number }> = ({ position, r = 0.07, color = "#7FD8FF", glow = 1 }) => (
  <group position={position}>
    <mesh geometry={sphere(r, 20, 14)} material={std(`charge:${color}`, { color, emissive: color, emissiveIntensity: 1.2 * glow, roughness: 0.3, toneMapped: false } as THREE.MeshStandardMaterialParameters)} />
    <mesh geometry={sphere(r * 1.9, 16, 12)} material={std(`chargeHalo:${color}`, { color, emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.18, depthWrite: false } as THREE.MeshStandardMaterialParameters)} />
  </group>
);

// ---------- antennas, cable, repeater ----------
// Long roof antenna (yagi style) that turns to catch the tower signal
export const RoofAntenna: React.FC<{ position: V3; yaw: number; glow?: number }> = ({ position, yaw, glow = 0 }) => (
  <group position={position}>
    <mesh position={[0, 0.9, 0]} geometry={cyl(0.05, 0.07, 1.8, 16)} material={M.steel()} castShadow />
    <group position={[0, 1.8, 0]} rotation={[0, yaw, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} geometry={cyl(0.035, 0.035, 2.2, 12)} material={M.steel()} castShadow />
      {[-0.9, -0.5, -0.1, 0.3, 0.7].map((z, k) => (
        <mesh key={z} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} geometry={cyl(0.02, 0.02, 0.9 - k * 0.1, 10)} material={M.steel()} castShadow />
      ))}
      <mesh position={[0, 0, 1.15]} geometry={sphere(0.09, 16, 12)} material={std("antTip", { color: "#FFD23F", emissive: "#FFB000", emissiveIntensity: 0.4 + glow * 1.4 })} />
    </group>
  </group>
);

// Orange cable that crawls along a path; `progress` 0..1 draws part of the tube
export const Cable: React.FC<{ id: string; points: V3[]; progress: number; radius?: number }> = ({ id, points, progress, radius = 0.06 }) => {
  const geo = custom(`cable04:${id}`, () => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.1);
    return new THREE.TubeGeometry(curve, 240, radius, 12, false);
  });
  // Tube indices run along the length: draw only the first part
  const total = geo.index!.count;
  const segs = 240;
  const per = total / segs;
  const n = Math.max(0, Math.min(segs, Math.round(progress * segs))) * per;
  const mat = std("cableOrange", { color: "#FF8A3D", emissive: "#FF6A1A", emissiveIntensity: 0.35, roughness: 0.4 });
  if (n <= 0) return null;
  geo.setDrawRange(0, n);
  return <mesh geometry={geo} material={mat} castShadow />;
};

// Small dome antenna that lights up and sends new rings
export const IndoorAntenna: React.FC<{ position: V3; on: number; upsideDown?: boolean }> = ({ position, on, upsideDown = true }) => (
  <group position={position} rotation={[upsideDown ? Math.PI : 0, 0, 0]}>
    <mesh geometry={cyl(0.18, 0.2, 0.05, 32)} material={paint("#F4F1E8", 0.4)} castShadow />
    <mesh position={[0, 0.06, 0]} scale={[1, 0.6, 1]} geometry={sphere(0.14, 24, 12)} material={std("domeAnt", { color: "#EFF6FF", emissive: "#7FE3FF", emissiveIntensity: on * 1.3, roughness: 0.3 })} />
  </group>
);

// Wall panel antenna fixed in the shaft
export const ShaftAntenna: React.FC<{ position: V3; rotY?: number; on?: number }> = ({ position, rotY = 0, on = 1 }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh geometry={rbox(0.12, 0.7, 0.32, 0.04)} material={paint("#F4F1E8", 0.45)} castShadow />
    <mesh position={[0.065, 0.25, 0]} geometry={sphere(0.035, 12, 8)} material={std("shaftAntLed", { color: "#7CF29A", emissive: "#4FE07A", emissiveIntensity: on * 1.5 })} />
  </group>
);

// Repeater box with a blinking LED
export const Repeater: React.FC<{ position: V3; rotY?: number; blink: number }> = ({ position, rotY = 0, blink }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh geometry={rbox(0.5, 0.36, 0.18, 0.05)} material={paint("#EDEFF2", 0.4)} castShadow />
    {[-0.15, 0.15].map((x) => (
      <mesh key={x} position={[x, 0.3, 0]} geometry={cyl(0.015, 0.015, 0.3, 10)} material={M.darkMetal()} />
    ))}
    <mesh position={[0.15, -0.08, 0.095]} geometry={sphere(0.03, 12, 8)} material={std("repLed", { color: "#7CF29A", emissive: "#4FE07A", emissiveIntensity: 0.3 + blink * 2.2, toneMapped: false } as THREE.MeshStandardMaterialParameters)} />
  </group>
);

// ---------- wooden label ----------
export const WoodLabel: React.FC<{ position?: V3; rotation?: V3; scale?: number; text: string; w?: number; h?: number; posts?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, text, w = 2.4, h = 0.6, posts = 0 }) => {
  const tex = textTexture(`wood04:${text}:${(w / h).toFixed(2)}`, { text, w: 1024, h: Math.round((1024 * h) / w), bg: "#E2B47E", fg: "#4A2E1A", border: "#8A5A33", radius: 40, size: 260 });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {posts > 0 && [-1, 1].map((s) => <mesh key={s} position={[s * w * 0.35, -h / 2 - posts / 2, -0.04]} geometry={rbox(0.1, posts, 0.1, 0.03)} material={M.woodDark()} castShadow />)}
      <mesh geometry={rbox(w + 0.12, h + 0.12, 0.1, 0.04)} material={M.wood()} castShadow />
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
    </group>
  );
};

// ---------- ghost sheet for Tuti ----------
export const GhostSheet: React.FC<{ position: V3; scale?: number; opacity?: number; sway?: number }> = ({ position, scale = 1, opacity = 1, sway = 0 }) => {
  const geo = custom("ghostSheet", () => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = 0.62 * (1 - t);
      const r = t < 0.35 ? Math.sin((t / 0.35) * Math.PI * 0.5) * 0.24 : 0.24 + (t - 0.35) * 0.18;
      pts.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    const g = new THREE.LatheGeometry(pts, 48);
    // Wavy hem
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) < 0.08) {
        const a = Math.atan2(p.getZ(i), p.getX(i));
        p.setY(i, p.getY(i) + Math.sin(a * 6) * 0.04);
      }
    }
    g.computeVertexNormals();
    return g;
  });
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FBFBFD", roughness: 0.8, transparent: true, side: THREE.DoubleSide }), []);
  mat.opacity = opacity;
  mat.depthWrite = opacity > 0.95;
  return (
    <group position={position} scale={scale} rotation={[0, 0, sway * 0.12]}>
      <mesh geometry={geo} material={mat} castShadow={opacity > 0.5} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, 0.42, 0.205]} scale={[1, 1.3, 0.4]} geometry={sphere(0.035, 12, 8)} material={M.eye()} visible={opacity > 0.2} />
      ))}
    </group>
  );
};
