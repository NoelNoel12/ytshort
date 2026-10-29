// Shared set positions for Short 02 scenes (world units, metres)
import { DESK } from "../../world/props/desk";
import { SPOTS } from "../../world/Kampung";

type V3 = [number, number, number];

export const ROAD_Y = 0.06;
export const DESK_POS: V3 = [0, ROAD_Y, 0.4];
export const DESK_TOP = ROAD_Y + DESK.h + 0.08;
export const STAGE: V3 = [SPOTS.stage[0], ROAD_Y, SPOTS.stage[2]];
export const GARDEN: V3 = SPOTS.garden;
// Porch floor of Pak Dodi's house (porch slab top is 0.4 above ground)
export const PORCH: V3 = [SPOTS.dodiHouse[0], 0.4, SPOTS.dodiHouse[2] + 2.6 + 1.3];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
