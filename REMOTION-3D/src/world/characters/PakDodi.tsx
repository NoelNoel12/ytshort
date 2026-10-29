import React from "react";
import * as THREE from "three";
import { M, paint, std } from "../materials";
import { capsule, circle, cone, custom, rbox, sphere, torus } from "../geom";
import { blink, glance } from "../../anim";
import { EXPRESSIONS, POSES, type Expression, type Pose } from "./rig";

type V3 = [number, number, number];

// Open-front vest shell (sphere band with a gap at the front)
const vestGeo = () => custom("dodiVest", () => new THREE.SphereGeometry(0.445, 48, 24, Math.PI / 2 + 0.42, Math.PI * 2 - 0.84, 0.55, 1.75));
const stripeGeo = (y: number) => custom(`dodiStripe:${y}`, () => new THREE.SphereGeometry(0.452, 48, 4, Math.PI / 2 + 0.42, Math.PI * 2 - 0.84, y, 0.12));
const halfDisc = (r: number) => custom(`halfdisc:${r}`, () => new THREE.CircleGeometry(r, 32, Math.PI, Math.PI));

const Mouth: React.FC<{ e: Expression }> = ({ e }) => {
  switch (e.mouth) {
    case "grin":
      return (
        <group>
          <mesh geometry={halfDisc(0.085)} material={M.mouth()} />
          <mesh position={[0, -0.045, 0.002]} geometry={halfDisc(0.045)} material={paint("#E0746E", 0.6)} />
          <mesh position={[0, -0.005, 0.003]} geometry={rbox(0.12, 0.022, 0.005, 0.002)} material={paint("#FFFFFF", 0.4)} />
        </group>
      );
    case "open":
      return <mesh scale={[1, 1.2, 1]} geometry={circle(0.06)} material={M.mouth()} />;
    case "o":
      return <mesh scale={[0.85, 1.15, 1]} geometry={circle(0.045)} material={M.mouth()} />;
    case "flat":
      return <mesh rotation={[0, 0, Math.PI / 2]} geometry={capsule(0.014, 0.08, 4, 10)} material={M.mouth()} />;
    case "frown":
      return <mesh position={[0, -0.04, 0]} geometry={torus(0.06, 0.015, 8, 24, Math.PI)} material={M.mouth()} />;
    case "wavy":
      return (
        <group>
          {[-1, 0, 1].map((k) => (
            <mesh key={k} position={[k * 0.035, (k % 2 ? 1 : -1) * 0.006, 0]} rotation={[0, 0, (k % 2 ? 1 : -1) * 0.6 + Math.PI / 2]} geometry={capsule(0.012, 0.03, 4, 8)} material={M.mouth()} />
          ))}
        </group>
      );
    case "smile":
    default:
      return <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI]} geometry={torus(0.065, 0.016, 8, 24, Math.PI)} material={M.mouth()} />;
  }
};

export type DodiProps = {
  frame: number;
  position?: V3;
  rotY?: number;
  scale?: number;
  pose?: Pose;
  expr?: Expression;
  squash?: [number, number];
  walk?: { legL: number; legR: number; kneeL: number; kneeR: number; bob: number } | null;
  lookAt?: number; // extra head yaw
  rightHand?: React.ReactNode;
  leftHand?: React.ReactNode;
  seed?: string;
};

export const PakDodi: React.FC<DodiProps> = ({ frame, position = [0, 0, 0], rotY = 0, scale = 1, pose = POSES.idle, expr = EXPRESSIONS.neutral, squash = [1, 1], walk = null, lookAt = 0, rightHand, leftHand, seed = "dodi" }) => {
  // Idle life: breathing, blinking, glance
  const breath = Math.sin((frame / 30) * Math.PI * 2 * 0.35);
  const lid = blink(frame, seed);
  const look = glance(frame, 3, 170) * 0.12;
  const p = pose;
  const bob = walk ? walk.bob : 0;
  const legL = p.legL + (walk?.legL ?? 0);
  const legR = p.legR + (walk?.legR ?? 0);
  const kneeL = p.kneeL + (walk?.kneeL ?? 0);
  const kneeR = p.kneeR + (walk?.kneeR ?? 0);
  // Arms counter-swing while walking
  const swing = walk ? -walk.legL * 0.6 : 0;
  const eyeY = Math.max(0.06, expr.eyeY * lid);
  // Follow-through on the helmet from head motion
  const helmetLag = Math.sin((frame / 30) * 5) * 0.015 * (walk ? 2 : 0.6);

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[scale * squash[0], scale * squash[1], scale * squash[0]]}>
      {/* Contact shadow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={circle(0.62)} material={M.blob()} renderOrder={2} />
      <group position={[0, p.lift + bob, 0]}>
        {/* Legs */}
        {([
          [0.17, legL, kneeL],
          [-0.17, legR, kneeR],
        ] as [number, number, number][]).map(([x, hip, knee], k) => (
          <group key={k} position={[x, 0.58, 0]} rotation={[hip, 0, 0]}>
            <mesh position={[0, -0.14, 0]} geometry={capsule(0.125, 0.16, 8, 20)} material={M.pants()} castShadow />
            <group position={[0, -0.28, 0]} rotation={[knee, 0, 0]}>
              <mesh position={[0, -0.1, 0]} geometry={capsule(0.11, 0.12, 8, 20)} material={M.pants()} castShadow />
              <mesh position={[0, -0.25, 0.06]} geometry={rbox(0.21, 0.12, 0.32, 0.05)} material={M.shoe()} castShadow />
            </group>
          </group>
        ))}
        {/* Torso pivots at the hips */}
        <group position={[0, 0.56, 0]} rotation={p.torso}>
          <group scale={[1 + breath * 0.012, 1 + breath * 0.018, 1 + breath * 0.012]}>
            <mesh position={[0, 0.36, 0]} scale={[1, 1.08, 0.9]} geometry={sphere(0.42, 48, 32)} material={M.shirt()} castShadow receiveShadow />
            <mesh position={[0, 0.36, 0]} scale={[1, 1.08, 0.9]} geometry={vestGeo()} material={M.vest()} castShadow />
            <mesh position={[0, 0.36, 0]} scale={[1, 1.08, 0.9]} geometry={stripeGeo(1.25)} material={M.reflective()} />
            <mesh position={[0, 0.36, 0]} scale={[1, 1.08, 0.9]} geometry={stripeGeo(1.65)} material={M.reflective()} />
            {/* Belt */}
            <mesh position={[0, 0.06, 0]} geometry={torus(0.34, 0.04, 10, 40)} rotation={[Math.PI / 2, 0, 0]} material={paint("#3A2A1E", 0.6)} />
            <mesh position={[0, 0.06, 0.37]} geometry={rbox(0.11, 0.08, 0.03, 0.01)} material={M.steel()} />
          </group>
          {/* Arms */}
          {([
            [0.43, p.armL, p.elbowL, 1, leftHand],
            [-0.43, p.armR, p.elbowR, -1, rightHand],
          ] as [number, V3, number, number, React.ReactNode][]).map(([x, rot, elbow, side, held], k) => (
            <group key={k} position={[x, 0.64, 0]} rotation={[rot[0] + (k === 0 ? swing : -swing), rot[1], rot[2] + side * 0.12]}>
              <mesh position={[0, -0.04, 0]} geometry={sphere(0.13, 24, 16)} material={M.shirt()} castShadow />
              <mesh position={[0, -0.15, 0]} geometry={capsule(0.1, 0.16, 8, 20)} material={M.shirt()} castShadow />
              <group position={[0, -0.27, 0]} rotation={[-elbow, 0, 0]}>
                <mesh position={[0, -0.1, 0]} geometry={capsule(0.08, 0.14, 8, 20)} material={M.skin()} castShadow />
                <group position={[0, -0.24, 0]}>
                  <mesh geometry={sphere(0.1, 24, 18)} material={M.skin()} castShadow />
                  <mesh position={[side * -0.06, 0.02, 0.05]} rotation={[0.4, 0, side * 0.6]} geometry={capsule(0.035, 0.05, 4, 10)} material={M.skin()} />
                  {held}
                </group>
              </group>
            </group>
          ))}
          {/* Head pivots at the neck */}
          <group position={[0, 0.86, 0]} rotation={[p.head[0], p.head[1] + look + lookAt, p.head[2]]}>
            <mesh position={[0, 0.02, 0]} geometry={capsule(0.11, 0.06, 6, 16)} material={M.skin()} />
            <group position={[0, 0.3, 0]}>
              <mesh scale={[1, 0.96, 0.95]} geometry={sphere(0.33, 48, 32)} material={M.skin()} castShadow receiveShadow />
              {/* Ears */}
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.32, -0.02, -0.02]} scale={[0.5, 1, 0.8]} geometry={sphere(0.08, 16, 12)} material={M.skin()} />
              ))}
              {/* Eyes */}
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.11, 0.04, 0.295]} rotation={[0, s * 0.33, 0]}>
                  <mesh scale={[expr.eye, eyeY * expr.eye * 1.15, 0.5]} geometry={sphere(0.045, 20, 14)} material={M.eye()} />
                  {eyeY > 0.5 && <mesh position={[0.014, 0.018 * expr.eye, 0.02]} geometry={sphere(0.013 * (expr.sparkle ? 1.6 : 1), 10, 8)} material={M.eyeShine()} />}
                  {expr.sparkle && eyeY > 0.5 && <mesh position={[-0.012, -0.014, 0.022]} geometry={sphere(0.008, 8, 6)} material={M.eyeShine()} />}
                </group>
              ))}
              {/* Brows */}
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.115, 0.135 + expr.browY, 0.29]} rotation={[0.2, s * 0.3, Math.PI / 2 + s * expr.brow]} geometry={capsule(0.018, 0.07, 4, 10)} material={paint("#3B2618", 0.7)} />
              ))}
              {/* Nose, moustache, cheeks */}
              <mesh position={[0, -0.03, 0.32]} scale={[1.1, 0.9, 1]} geometry={sphere(0.055, 20, 14)} material={std("nose", { color: "#E3A77A", roughness: 0.6 })} />
              <mesh position={[0, -0.09, 0.305]} rotation={[0.35, 0, Math.PI / 2]} scale={[1, 1.6, 0.7]} geometry={capsule(0.026, 0.07, 6, 12)} material={paint("#3B2618", 0.75)} />
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.19, -0.06, 0.25]} rotation={[0, s * 0.62, 0]} scale={[1, 0.75, 0.25]} geometry={sphere(0.065, 16, 12)} material={M.blush()} visible={expr.blush > 0.2} />
              ))}
              <group position={[0, -0.155, 0.296]} rotation={[0.45, 0, 0]}>
                <Mouth e={expr} />
              </group>
              {expr.sweat && (
                <group position={[0.27, 0.12, 0.2]}>
                  <mesh geometry={sphere(0.035, 16, 12)} material={std("sweat", { color: "#8FD3FF", roughness: 0.1, transparent: true, opacity: 0.85 })} />
                  <mesh position={[0, 0.04, 0]} geometry={cone(0.033, 0.06, 16)} material={std("sweat", { color: "#8FD3FF", roughness: 0.1, transparent: true, opacity: 0.85 })} />
                </group>
              )}
              {/* Helmet with lagging wobble */}
              <group position={[0, 0.1, -0.01]} rotation={[helmetLag, 0, helmetLag * 0.6]}>
                <mesh scale={[1.02, 0.9, 1.04]} geometry={custom("helmetDome", () => new THREE.SphereGeometry(0.355, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2))} material={M.helmet()} castShadow />
                <mesh position={[0, 0.0, 0.04]} scale={[1, 1, 1.12]} geometry={custom("helmetBrim", () => new THREE.CylinderGeometry(0.4, 0.41, 0.03, 48))} material={M.helmet()} castShadow />
                <mesh rotation={[0, Math.PI / 2, 0]} scale={[1.04, 0.9, 1]} geometry={torus(0.345, 0.03, 10, 40, Math.PI)} material={M.helmet()} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
