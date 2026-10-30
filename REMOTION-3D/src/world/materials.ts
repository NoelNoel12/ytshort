// Material cache. Every material is created once and shared.
import * as THREE from "three";
import { theme } from "../theme";
import { aoSkirtTexture, aoWallTexture, asphaltTexture, blobTexture, brickMaps, concreteTexture, dirtTexture, fabricTexture, grassTexture, plasterTexture, roofTileMaps, soilTexture, woodTexture } from "./textures";

const cache = new Map<string, THREE.Material>();

const get = <T extends THREE.Material>(key: string, make: () => T): T => {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const m = make();
  cache.set(key, m);
  return m;
};

const C = theme.colors;

export const std = (key: string, p: THREE.MeshStandardMaterialParameters) => get(`std:${key}`, () => new THREE.MeshStandardMaterial(p));
export const phys = (key: string, p: THREE.MeshPhysicalMaterialParameters) => get(`phys:${key}`, () => new THREE.MeshPhysicalMaterial(p));

// Painted or plastic surface with a given colour (roughness tuned per use)
export const paint = (color: string, roughness = 0.55, metalness = 0) => std(`paint:${color}:${roughness}:${metalness}`, { color, roughness, metalness });

export const M = {
  grass: () =>
    get("grass", () => {
      const t = grassTexture().clone();
      t.repeat.set(10, 10);
      t.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    }),
  grassPatch: () => std("grassPatch", { map: grassTexture(), roughness: 0.95 }),
  dirt: () => std("dirt", { map: dirtTexture(), roughness: 1 }),
  asphalt: () =>
    get("asphalt", () => {
      const t = asphaltTexture().clone();
      t.repeat.set(8, 1);
      t.needsUpdate = true;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 });
    }),
  asphaltW: () => std("asphaltW", { map: asphaltTexture(), roughness: 0.92 }),
  concrete: () => std("concrete", { map: concreteTexture(), roughness: 0.9 }),
  curb: () => std("curb", { color: "#D9D3C7", roughness: 0.85 }),
  soil: () => std("soil", { map: soilTexture(), roughness: 1 }),
  soilDark: () => std("soilDark", { map: soilTexture(), color: "#8a7a70", roughness: 1 }),
  // Use with world-UV geometry (about 3 m per tile)
  plaster: (base: string = C.wallCream) => std(`plaster:${base}`, { map: plasterTexture(`plaster:${base}`, base), roughness: 0.9 }),
  wood: () => std("wood", { map: woodTexture(), roughness: 0.7 }),
  woodDark: () => std("woodDark", { map: woodTexture("woodDark", "#7A5232", "#55361E"), roughness: 0.75 }),
  woodLight: () => std("woodLight", { map: woodTexture("woodLight", "#D4A373", "#B07F52", 3), roughness: 0.65 }),
  woodCounter: () => std("woodCounter", { map: woodTexture("woodCounter", "#C08552", "#94603A", 5, false), roughness: 0.45 }),
  clayRoof: () => std("clayRoof", { color: C.clayRoof, roughness: 0.7 }),
  // Tiled roof, use with world-UV geometry (ROOF_TILE_WORLD)
  roofTiles: (base: string) =>
    get(`roofTiles:${base}`, () => {
      const { color, normal } = roofTileMaps(base, base);
      return new THREE.MeshStandardMaterial({ map: color, normalMap: normal, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.62 });
    }),
  brick: (base = "#B4543A") =>
    get(`brick:${base}`, () => {
      const { color, normal } = brickMaps(base, base);
      return new THREE.MeshStandardMaterial({ map: color, normalMap: normal, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.85 });
    }),
  clayRoofDark: () => std("clayRoofDark", { color: "#A9502F", roughness: 0.75 }),
  windowGlass: () => std("windowGlass", { color: "#3E5A66", roughness: 0.12, metalness: 0.3, envMapIntensity: 1.2 }),
  gold: () => std("gold", { color: "#F0AE22", roughness: 0.3, metalness: 0.88, envMapIntensity: 1.25, emissive: "#4A2E00", emissiveIntensity: 0.15 }),
  coin: () => std("coin", { color: "#F3B52E", roughness: 0.3, metalness: 0.88, envMapIntensity: 1.25, emissive: "#4A2E00", emissiveIntensity: 0.15 }),
  interestRed: () => std("interestRed", { color: C.interestRed, roughness: 0.62, metalness: 0 }),
  jarGlass: () =>
    phys("jarGlass", {
      color: "#E8F6FF",
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.6,
    }),
  boxGlass: () =>
    phys("boxGlass", {
      color: "#DFF3FF",
      roughness: 0.04,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide,
      clearcoat: 1,
      envMapIntensity: 1.5,
    }),
  steel: () => std("steel", { color: "#B8BEC6", roughness: 0.35, metalness: 0.8 }),
  darkMetal: () => std("darkMetal", { color: "#3A3F47", roughness: 0.45, metalness: 0.6 }),
  rubber: () => std("rubber", { color: "#26282C", roughness: 0.9 }),
  skin: () => std("skin", { color: "#EDB98C", roughness: 0.62 }),
  blush: () => std("blush", { color: "#F28C8C", roughness: 0.7, transparent: true, opacity: 0.85 }),
  eye: () => std("eye", { color: "#1A1A1E", roughness: 0.25 }),
  eyeShine: () => std("eyeShine", { color: "#FFFFFF", roughness: 0.2, emissive: "#ffffff", emissiveIntensity: 0.6 }),
  mouth: () => std("mouth", { color: "#6B2A2A", roughness: 0.6 }),
  helmet: () => std("helmet", { color: C.helmetYellow, roughness: 0.28, metalness: 0.05, envMapIntensity: 1.1 }),
  vest: () => std("vest", { map: fabricTexture("vest", C.vestOrange), roughness: 0.75 }),
  reflective: () => std("reflective", { color: "#E9EEF2", roughness: 0.3, metalness: 0.4, emissive: "#555b60", emissiveIntensity: 0.2 }),
  shirt: () => std("shirt", { map: fabricTexture("shirt", "#5E9BD6"), roughness: 0.8 }),
  pants: () => std("pants", { map: fabricTexture("pants", "#3F4A5C"), roughness: 0.85 }),
  shoe: () => std("shoe", { color: "#5A3B26", roughness: 0.6 }),
  pigeon: () => std("pigeon", { color: "#8F98A6", roughness: 0.75 }),
  pigeonLight: () => std("pigeonLight", { color: "#C3CAD4", roughness: 0.75 }),
  pigeonDark: () => std("pigeonDark", { color: "#5E6674", roughness: 0.75 }),
  pigeonNeck: () => std("pigeonNeck", { color: "#5F8F7A", roughness: 0.35, metalness: 0.35, envMapIntensity: 1.2 }),
  beak: () => std("beak", { color: "#F2B33D", roughness: 0.45 }),
  orangeFoot: () => std("orangeFoot", { color: "#E9844A", roughness: 0.6 }),
  leaf: () => std("leaf", { color: "#4F9A3E", roughness: 0.8, side: THREE.DoubleSide }),
  leafLight: () => std("leafLight", { color: "#6DB54C", roughness: 0.8, side: THREE.DoubleSide }),
  palmLeaf: () => std("palmLeaf", { color: "#5C9E3F", roughness: 0.75, side: THREE.DoubleSide }),
  bananaLeaf: () => std("bananaLeaf", { color: "#7DBE4F", roughness: 0.7, side: THREE.DoubleSide }),
  bark: () => std("bark", { map: woodTexture("bark", "#8C6A4F", "#6A4E38", 1), roughness: 0.95 }),
  palmTrunk: () => std("palmTrunk", { color: "#9C8468", roughness: 0.95 }),
  cloud: () => std("cloud", { color: "#FFFFFF", roughness: 1, emissive: "#ffffff", emissiveIntensity: 0.18, fog: false }),
  mountain: () => std("mountain", { color: "#8FB1C9", roughness: 1 }),
  cable: () => std("cable", { color: "#23262B", roughness: 0.6 }),
  money: (c: string) => std(`money:${c}`, { color: c, roughness: 0.75 }),
  paper: () => std("paper", { color: "#F7F2E6", roughness: 0.85 }),
  envelope: () => std("envelope", { color: "#F3DFB4", roughness: 0.8 }),
  bag: (c: string) => std(`bag:${c}`, { map: fabricTexture(`bag:${c}`, c), roughness: 0.85 }),
  aoSkirt: () =>
    get("aoSkirt", () => new THREE.MeshBasicMaterial({ map: aoSkirtTexture(), transparent: true, depthWrite: false, color: "#000000", polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, toneMapped: false })),
  aoWall: () =>
    get("aoWall", () => new THREE.MeshBasicMaterial({ map: aoWallTexture(), transparent: true, depthWrite: false, color: "#000000", polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, toneMapped: false })),
  shadowBoard: () => get("shadowBoard", () => new THREE.MeshBasicMaterial({ color: "#16111A", transparent: true, opacity: 0.72, depthWrite: false, toneMapped: false })),
  blob: () =>
    get(
      "blob",
      () =>
        new THREE.MeshBasicMaterial({
          map: blobTexture(),
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
          color: "#000000",
          toneMapped: false,
        }),
    ),
};

// Gold-like metals use a warm studio environment in every mood
export const goldMaterials = (): THREE.MeshStandardMaterial[] => [M.gold(), M.coin()] as THREE.MeshStandardMaterial[];

// Only these materials get image-based reflections. IBL on every surface costs about 1 s per frame
// in software GL, and diffuse surfaces get their ambient from the hemisphere light instead.
export const reflectiveMaterials = (): THREE.MeshStandardMaterial[] =>
  [std("cabinSteel", { color: "#C7CDD6", roughness: 0.32, metalness: 0.85, envMapIntensity: 1.3 }), M.jarGlass(), M.boxGlass(), M.steel(), M.darkMetal(), M.helmet(), M.windowGlass(), M.pigeonNeck(), std("shades", { color: "#121318", roughness: 0.08, metalness: 0.7 })] as THREE.MeshStandardMaterial[];
