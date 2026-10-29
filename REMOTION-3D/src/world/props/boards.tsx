// Sign boards: FLAT, EFEKTIF, percentage boards (data-driven heights), crackable board.
import React, { useMemo } from "react";
import * as THREE from "three";
import { M, paint, std } from "../materials";
import { box, custom, rbox, rboxW } from "../geom";
import { cachedTexture } from "../textures";
import { textTexture, type TextSpec } from "./text";

type V3 = [number, number, number];

// Soft diagonal highlight used for the "discount shine" sweep
const shineTexture = () =>
  cachedTexture(
    "shine",
    256,
    256,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.45, "rgba(255,255,255,0.0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.85)");
      g.addColorStop(0.55, "rgba(255,255,255,0.0)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { srgb: false },
  );

export type BoardProps = {
  position?: V3;
  rotation?: V3;
  scale?: number | V3;
  w: number;
  h: number; // face height (data-driven for % boards)
  text: TextSpec & { key: string };
  frame?: string; // frame colour
  posts?: number; // post height below the board (0 = no posts)
  shine?: number; // -1..2 sweep position, outside 0..1 is hidden
  wood?: boolean;
  glow?: number; // emissive lift on the face
};

export const Board: React.FC<BoardProps> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, w, h, text, frame = "#6B4528", posts = 0.9, shine = -1, wood = false, glow = 0 }) => {
  const aspect = w / h;
  const tex = textTexture(`${text.key}:${aspect.toFixed(2)}`, { w: 1024, h: Math.round(1024 / aspect), ...text });
  const shineMat = useMemo(() => std("shineMat", { map: shineTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false } as THREE.MeshStandardMaterialParameters), []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {posts > 0 &&
        [-1, 1].map((s) => <mesh key={s} position={[s * w * 0.32, posts / 2, -0.06]} geometry={rbox(0.12, posts + 0.25, 0.12, 0.03)} material={M.woodDark()} castShadow />)}
      <group position={[0, posts + h / 2, 0]}>
        <mesh geometry={wood ? rboxW(w + 0.14, h + 0.14, 0.12, 0.04, 1.6) : rbox(w + 0.14, h + 0.14, 0.12, 0.04)} material={wood ? M.wood() : paint(frame, 0.5)} castShadow receiveShadow />
        <mesh position={[0, 0, 0.062]} geometry={box(w, h, 0.004)}>
          <meshStandardMaterial map={tex} roughness={wood ? 0.75 : 0.45} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={glow} />
        </mesh>
        {shine > 0 && shine < 1 && (
          <mesh position={[(shine - 0.5) * w * 1.6, 0, 0.07]} rotation={[0, 0, -0.35]} geometry={box(w * 0.7, h * 1.6, 0.001)} material={shineMat} renderOrder={4} />
        )}
      </group>
    </group>
  );
};

// A percentage board that cracks down the middle and falls apart
export const CrackBoard: React.FC<{ position?: V3; w: number; h: number; text: TextSpec & { key: string }; crack: number; fall: number; posts?: number }> = ({ position = [0, 0, 0], w, h, text, crack, fall, posts = 0.9 }) => {
  const tex = textTexture(`${text.key}:${(w / h).toFixed(2)}`, { w: 1024, h: Math.round((1024 * h) / w), ...text });
  const halves = useMemo(
    () =>
      [0, 1].map((k) => {
        const t = tex.clone();
        t.repeat.set(0.5, 1);
        t.offset.set(k * 0.5, 0);
        t.needsUpdate = true;
        return new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 });
      }),
    [tex],
  );
  const crackGeo = custom(`crack:${w}:${h}`, () => {
    // Jagged crack strip as a thin extruded zigzag
    const s = new THREE.Shape();
    const n = 9;
    const a = 0.035;
    const t = 0.012;
    s.moveTo(t, h / 2);
    for (let i = 1; i <= n; i++) s.lineTo((i % 2 ? a : -a) + t, h / 2 - (h * i) / n);
    for (let i = n; i >= 0; i--) s.lineTo((i % 2 ? a : -a) - t, h / 2 - (h * i) / n);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  });
  const g = 9.8 * 0.35;
  return (
    <group position={position}>
      {[-1, 1].map((s, k) => {
        const tf = fall;
        const dx = s * tf * 0.6;
        const dy = -g * tf * tf * 0.9;
        const rz = s * tf * 1.2;
        return (
          <group key={s} position={[s * w * 0.25 + dx, posts + h / 2 + Math.max(dy, -(posts + h / 2) + 0.1), 0]} rotation={[tf * 0.3, 0, -rz]}>
            <mesh geometry={rboxW(w / 2 + 0.07, h + 0.14, 0.12, 0.03, 1.6)} material={M.wood()} castShadow />
            <mesh position={[0, 0, 0.062]} geometry={box(w / 2, h, 0.004)} material={halves[k]} />
            {fall === 0 && posts > 0 && <mesh position={[s * w * 0.07, -h / 2 - posts / 2, -0.06]} geometry={rbox(0.12, posts + 0.25, 0.12, 0.03)} material={M.woodDark()} castShadow />}
          </group>
        );
      })}
      {crack > 0 && fall === 0 && (
        <mesh position={[0, posts + h / 2, 0.075]} scale={[1, crack, 1]} geometry={crackGeo} material={paint("#2A1A10", 0.8)} />
      )}
    </group>
  );
};
