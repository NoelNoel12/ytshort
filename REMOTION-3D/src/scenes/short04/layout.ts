// Shared positions for Short 04 (world units, metres)
import { BLD, SHAFT_CX, SHAFT_CZ, TOWER, floorY } from "../../world/short04/Building";
import { CABIN } from "../../world/short04/Lift";

type V3 = [number, number, number];

export const GROUND = BLD.groundY;
export const CAB: V3 = [SHAFT_CX, GROUND, SHAFT_CZ]; // cabin floor centre on the ground floor
export const CAB_MID: V3 = [SHAFT_CX, GROUND + CABIN.h / 2, SHAFT_CZ];
export const RING_Z = -7.55; // rings fly just in front of the cut so walls never hide them
export const TOWER_TOP: V3 = [TOWER.pos[0], TOWER.h - 0.9, TOWER.pos[2] + 0.4];
export const CABIN_HIT: V3 = [BLD.shaft.x1 + 0.35, GROUND + 1.6, RING_Z]; // where rings meet the lift
export const PHONE_EAR = { position: [-0.033, -0.038, 0.027] as V3, rotation: [-2.597, 0.472, 0.459] as V3, scale: 2.3 };
export const PHONE_HAND = { position: [0.02, -0.02, 0.06] as V3, rotation: [0.2, Math.PI / 2, 0] as V3, scale: 2.0 };
export { floorY, BLD, SHAFT_CX, SHAFT_CZ };

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// Quadratic Bezier
export const bez = (a: V3, c: V3, b: V3, t: number): V3 => lerp3(lerp3(a, c, t), lerp3(c, b, t), t);

// Subtitle keep-out box for Pak Dodi: knees up to the helmet, arms included
export const dodiBox = (p: V3, s = 1): { box: [V3, V3] } => ({
  box: [
    [p[0] - 0.5 * s, p[1] + 0.45 * s, p[2] - 0.38 * s],
    [p[0] + 0.5 * s, p[1] + 2.02 * s, p[2] + 0.38 * s],
  ],
});

// Signal HUD (bars, call icon) floats at head height beside Dodi, in front of the cabin opening
export const HUD_X = 0.95;
export const hudPos = (side: 1 | -1, cabY = GROUND, x0 = CAB[0]): V3 => [x0 + side * HUD_X, cabY + 1.55, CAB[2] + 1.15];
export const hudVol = (side: 1 | -1, cabY = GROUND, x0 = CAB[0], icon = false) => {
  const p = hudPos(side, cabY, x0);
  return { c: [p[0], p[1] + (icon ? 0.35 : 0.2), p[2]] as V3, r: icon ? 0.55 : 0.42 };
};
