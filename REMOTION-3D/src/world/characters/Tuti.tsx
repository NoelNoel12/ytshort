import React from "react";
import { M, paint, std } from "../materials";
import * as THREE from "three";
import { capsule, circle, cone, custom, cyl, rbox, sphere } from "../geom";
import { blink } from "../../anim";

type V3 = [number, number, number];

export type TutiProps = {
  frame: number;
  position?: V3;
  rotY?: number;
  scale?: number;
  peck?: number; // 0..1 head down
  flap?: number; // 0..1 wing amount
  headTurn?: number;
  bodyTilt?: number; // x tilt (forward lean)
  roll?: number; // z roll (falling)
  sunglasses?: boolean;
  squash?: [number, number];
  eyesWide?: boolean;
  shadow?: boolean;
  tuck?: boolean; // legs folded (flying)
  seed?: string;
};

// Grey pigeon with layered feathers. Does not talk.
export const Tuti: React.FC<TutiProps> = ({ frame, position = [0, 0, 0], rotY = 0, scale = 1, peck = 0, flap = 0, headTurn = 0, bodyTilt = 0, roll = 0, sunglasses = false, squash = [1, 1], eyesWide = false, shadow = true, tuck = false, seed = "tuti" }) => {
  const lid = blink(frame, seed, 45, 100);
  const breath = Math.sin((frame / 30) * Math.PI * 2 * 0.8) * 0.02;
  // Idle head bob, the pigeon way
  const bobHead = Math.sin((frame / 30) * Math.PI * 2 * 0.6) * 0.012;
  const wing = flap > 0 ? Math.sin((frame / 30) * Math.PI * 2 * 6) * 0.9 * flap + 0.4 * flap : 0;
  const eyeS = eyesWide ? 1.4 : 1;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[scale * squash[0], scale * squash[1], scale * squash[0]]}>
      {shadow && <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={circle(0.24)} material={M.blob()} renderOrder={2} />}
      <group rotation={[bodyTilt, 0, roll]}>
        {/* Legs */}
        {!tuck && [-1, 1].map((s) => (
          <group key={s} position={[s * 0.05, 0.07, 0.02]}>
            <mesh geometry={cyl(0.012, 0.012, 0.12, 10)} material={M.orangeFoot()} />
            {[-0.5, 0, 0.5].map((a) => (
              <mesh key={a} position={[Math.sin(a) * 0.03, -0.055, Math.cos(a) * 0.03]} rotation={[Math.PI / 2, 0, -a]} geometry={capsule(0.008, 0.04, 4, 8)} material={M.orangeFoot()} />
            ))}
          </group>
        ))}
        <group position={[0, 0.25, 0]} scale={[1 + breath, 1 + breath, 1]}>
          {/* Body and belly */}
          <mesh scale={[1, 0.92, 1.3]} geometry={sphere(0.15, 40, 28)} material={M.pigeon()} castShadow receiveShadow />
          <mesh position={[0, -0.03, 0.06]} scale={[0.85, 0.8, 1.0]} geometry={sphere(0.14, 32, 24)} material={M.pigeonLight()} />
          {/* Wings with two dark bars, hinged at the shoulder */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.12, 0.04, 0.0]} rotation={[0, 0, s * (0.12 + wing)]}>
              <group position={[s * 0.02, -0.02, -0.04]}>
                <mesh scale={[0.32, 0.55, 1.15]} geometry={sphere(0.13, 28, 20)} material={M.pigeonDark()} castShadow />
                {[0.03, -0.05].map((zz) => (
                  <mesh key={zz} position={[s * 0.035, -0.01, zz]} rotation={[0, 0, s * 0.3]} geometry={rbox(0.012, 0.05, 0.03, 0.005)} material={paint("#2C3038", 0.7)} />
                ))}
              </group>
            </group>
          ))}
          {/* Tail fan */}
          {[-0.35, -0.17, 0, 0.17, 0.35].map((a, k) => (
            <group key={k} position={[0, 0.0, -0.17]} rotation={[0.45, a, 0]}>
              <mesh position={[0, 0, -0.07]} scale={[0.35, 0.12, 1]} geometry={sphere(0.085, 16, 10)} material={k % 2 ? M.pigeon() : M.pigeonDark()} castShadow />
              <mesh position={[0, 0, -0.14]} scale={[0.3, 0.1, 0.35]} geometry={sphere(0.08, 12, 8)} material={paint("#2C3038", 0.7)} />
            </group>
          ))}
          {/* Neck with iridescent ring, head */}
          <group position={[0, 0.1 + bobHead, 0.12]} rotation={[peck * 1.1, headTurn, 0]}>
            <mesh position={[0, 0.02, -0.01]} scale={[0.92, 1.1, 0.9]} geometry={sphere(0.08, 28, 20)} material={M.pigeonNeck()} />
            <group position={[0, 0.1, 0.03]}>
              <mesh geometry={sphere(0.075, 32, 24)} material={M.pigeon()} castShadow />
              {/* Beak and cere */}
              <mesh position={[0, -0.01, 0.1]} rotation={[Math.PI / 2, 0, 0]} geometry={cone(0.018, 0.06, 16)} material={M.beak()} />
              <mesh position={[0, 0.0, 0.07]} scale={[1, 0.7, 0.8]} geometry={sphere(0.018, 12, 8)} material={paint("#EEF0F2", 0.5)} />
              {/* Eyes */}
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.05, 0.02, 0.045]} rotation={[0, s * 0.9, 0]}>
                  <mesh scale={[eyeS, eyeS * Math.max(0.1, lid), 0.6]} geometry={sphere(0.02, 14, 10)} material={paint("#E9844A", 0.4)} />
                  <mesh position={[0, 0, 0.01]} scale={[eyeS, eyeS * Math.max(0.1, lid), 0.6]} geometry={sphere(0.012, 12, 8)} material={M.eye()} />
                </group>
              ))}
              {sunglasses && (
                <group position={[0, 0.025, 0]}>
                  {[-1, 1].map((s) => (
                    <mesh key={s} position={[s * 0.058, 0, 0.045]} rotation={[0, s * 0.9, 0]} geometry={custom("shadesLens", () => new THREE.CylinderGeometry(0.03, 0.03, 0.012, 24).rotateX(Math.PI / 2))} material={std("shades", { color: "#121318", roughness: 0.08, metalness: 0.7 })} />
                  ))}
                  <mesh position={[0, 0.0, 0.078]} rotation={[0, 0, Math.PI / 2]} geometry={capsule(0.006, 0.05, 4, 8)} material={M.darkMetal()} />
                </group>
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
