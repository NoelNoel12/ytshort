import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { skyGradientTexture } from "./textures";
import { goldMaterials, reflectiveMaterials } from "./materials";

export type MoodName = "morning" | "dim" | "warm" | "golden";

export type Mood = {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sun: string;
  sunIntensity: number;
  sunDir: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  envIntensity: number;
  rim: string;
  rimIntensity: number;
  exposure: number;
};

export const MOODS: Record<MoodName, Mood> = {
  morning: {
    skyTop: "#4FA9EE",
    skyMid: "#8FCDF7",
    skyBottom: "#DDF3FF",
    fog: "#CFE8F6",
    fogNear: 30,
    fogFar: 210,
    sun: "#FFEBCC",
    sunIntensity: 3.8,
    sunDir: [0.55, 0.72, 0.6],
    hemiSky: "#DCEBF5",
    hemiGround: "#9A845F",
    hemiIntensity: 0.6,
    envIntensity: 0.4,
    rim: "#DDEEFF",
    rimIntensity: 0.9,
    exposure: 1.0,
  },
  dim: {
    skyTop: "#7E9BB5",
    skyMid: "#A9BDCC",
    skyBottom: "#D3DCE2",
    fog: "#BAC6CF",
    fogNear: 35,
    fogFar: 210,
    sun: "#F3E6D6",
    sunIntensity: 2.2,
    sunDir: [0.45, 0.7, 0.6],
    hemiSky: "#BFCBD6",
    hemiGround: "#6E6253",
    hemiIntensity: 0.6,
    envIntensity: 0.45,
    rim: "#C8D6E6",
    rimIntensity: 0.6,
    exposure: 0.92,
  },
  warm: {
    skyTop: "#5AA5E0",
    skyMid: "#A6D2EE",
    skyBottom: "#F5E6CC",
    fog: "#E7E2D2",
    fogNear: 40,
    fogFar: 240,
    sun: "#FFE1B5",
    sunIntensity: 3.6,
    sunDir: [0.6, 0.6, 0.5],
    hemiSky: "#E6EEF5",
    hemiGround: "#8A6E4E",
    hemiIntensity: 0.6,
    envIntensity: 0.4,
    rim: "#FFE6C2",
    rimIntensity: 1.0,
    exposure: 1.0,
  },
  golden: {
    skyTop: "#5E8CCB",
    skyMid: "#F3B784",
    skyBottom: "#FFE3B8",
    fog: "#F4D2A6",
    fogNear: 35,
    fogFar: 230,
    sun: "#FFB86B",
    sunIntensity: 3.4,
    sunDir: [0.85, 0.36, 0.42],
    hemiSky: "#FFD6A8",
    hemiGround: "#6B4A33",
    hemiIntensity: 0.55,
    envIntensity: 0.6,
    rim: "#FFC48A",
    rimIntensity: 1.4,
    exposure: 1.02,
  },
};

// Ambient that the scene-wide environment map used to provide
const HEMI_BOOST = 0.32;

// Procedural environment map from a gradient sky. Built once per mood, then cached.
const envCache = new Map<string, THREE.Texture>();
const buildEnv = (gl: THREE.WebGLRenderer, name: MoodName) => {
  const hit = envCache.get(name);
  if (hit) return hit;
  const m = MOODS[name];
  const scene = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyGradientTexture(`env:${name}`, m.skyTop, m.skyMid, m.hemiGround), side: THREE.BackSide }),
  );
  scene.add(sky);
  // Bright sun blob and a couple of soft window-like panels for nicer metal highlights
  const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(m.sun).multiplyScalar(6) }));
  sun.position.set(m.sunDir[0] * 40, m.sunDir[1] * 40, m.sunDir[2] * 40);
  scene.add(sun);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffffff").multiplyScalar(1.6), side: THREE.DoubleSide }));
  panel.position.set(-30, 18, -10);
  panel.lookAt(0, 0, 0);
  scene.add(panel);
  const pmrem = new THREE.PMREMGenerator(gl);
  const rt = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();
  envCache.set(name, rt.texture);
  return rt.texture;
};

// Warm studio environment for gold: bright cream above, dark brown below, a few soft key lights
let goldEnv: THREE.Texture | null = null;
const buildGoldEnv = (gl: THREE.WebGLRenderer) => {
  if (goldEnv) return goldEnv;
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: skyGradientTexture("env:gold", "#FFF4DC", "#C98A3A", "#2A1A0C"), side: THREE.BackSide })));
  for (const [x, y, z, s] of [
    [30, 25, 20, 10],
    [-35, 15, 10, 7],
    [5, 40, -30, 8],
  ]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#FFF1D0").multiplyScalar(3) }));
    l.position.set(x, y, z);
    scene.add(l);
  }
  const pmrem = new THREE.PMREMGenerator(gl);
  goldEnv = pmrem.fromScene(scene, 0.03).texture;
  pmrem.dispose();
  return goldEnv;
};

type Props = {
  mood: MoodName;
  // Shadow camera box, fixed per scene so shadow edges never swim
  focus: [number, number, number];
  shadowSize?: number;
  noEnv?: boolean;
};

export const Lighting: React.FC<Props> = ({ mood, focus, shadowSize = 14, noEnv = false }) => {
  const m = MOODS[mood];
  const { gl, scene } = useThree();
  const env = useMemo(() => buildEnv(gl, mood), [gl, mood]);

  useLayoutEffect(() => {
    scene.environment = null;
    for (const mat of reflectiveMaterials()) {
      const had = !!mat.envMap;
      mat.envMap = noEnv ? null : env;
      // Keep the per-mood strength the scene environment used to apply
      mat.userData.baseEnv ??= mat.envMapIntensity;
      mat.envMapIntensity = mat.userData.baseEnv * m.envIntensity;
      if (had !== !!mat.envMap) mat.needsUpdate = true;
    }
    const ge = buildGoldEnv(gl);
    for (const mat of goldMaterials()) {
      const want = noEnv ? null : ge;
      if (mat.envMap !== want) {
        mat.envMap = want;
        mat.needsUpdate = true;
      }
    }
    scene.fog = new THREE.Fog(m.fog, m.fogNear, m.fogFar);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = m.exposure;
  }, [env, gl, m, scene, noEnv]);

  const target = useMemo(() => {
    const o = new THREE.Object3D();
    return o;
  }, []);
  useLayoutEffect(() => {
    target.position.set(focus[0], focus[1], focus[2]);
    target.updateMatrixWorld();
  }, [focus, target]);

  const d = 45;
  const sunPos: [number, number, number] = [focus[0] + m.sunDir[0] * d, focus[1] + m.sunDir[1] * d, focus[2] + m.sunDir[2] * d];
  // Rim light from behind the usual camera direction
  const rimPos: [number, number, number] = [focus[0] - 12, focus[1] + 8, focus[2] - 20];

  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={[m.hemiSky, m.hemiGround, m.hemiIntensity + HEMI_BOOST]} />
      <directionalLight
        position={sunPos}
        target={target}
        color={m.sun}
        intensity={m.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
        shadow-radius={4}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />
      <directionalLight position={rimPos} target={target} color={m.rim} intensity={m.rimIntensity} />
    </>
  );
};
