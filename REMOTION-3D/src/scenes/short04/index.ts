import type { SceneDef } from "../types";
import type { SfxCue } from "../../sfx/types";
import { S1, S1_SFX } from "./S1Hook";
import { S2, S2_SFX } from "./S2Call";
import { S3, S3_SFX } from "./S3Conductor";
import { S4, S4_SFX } from "./S4Faraday";
import { S5, S5_SFX } from "./S5Repeater";
import { S6, S6_SFX } from "./S6Shaft";
import { S7, S7_SFX } from "./S7Nuance";
import { S8, S8_SFX } from "./S8Tips";
import { S9, S9_SFX } from "./S9Cta";
import { TL } from "./tl";
import { framed } from "../../world/CameraRig";

// Recomposition per scene (dolly-back k, lens shift s) found with scripts/fitFraming.ts so that
// subtitles clear Dodi from the knees up, the signal HUD and the key props
const FRAMING: Record<string, [number, number]> = {
  S2: [1.3, 0.1],
  S3: [1.35, 0],
  S4: [1.05, 0.09],
  S5: [1.15, 0],
  S6: [1.35, 0.03],
  S8: [1.4, 0],
  S9: [1.1, 0.05],
};

export const SCENES_04: SceneDef[] = [S1, S2, S3, S4, S5, S6, S7, S8, S9].map((d) => (FRAMING[d.id] ? { ...d, camera: framed(d.camera, ...FRAMING[d.id]) } : d));

// Transition sounds follow each scene's hand-over: whoosh on whips, wing flaps on fly-bys
const transitions: SfxCue[] = SCENES_04.flatMap((s, i) => {
  if (i >= TL.scenes.length - 1) return [];
  const cut = TL.scenes[i].toFrame;
  if (s.out === "whip") return [{ at: cut - 5, name: "whoosh", volume: 0.3 }];
  if (s.out === "flyby") return [{ at: cut - 8, name: "flap", volume: 0.32 }, { at: cut - 6, name: "whoosh", volume: 0.18 }];
  return [];
});

export const SFX_04: SfxCue[] = [...S1_SFX, ...S2_SFX, ...S3_SFX, ...S4_SFX, ...S5_SFX, ...S6_SFX, ...S7_SFX, ...S8_SFX, ...S9_SFX, ...transitions].sort((a, b) => a.at - b.at);
