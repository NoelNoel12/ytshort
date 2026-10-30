import React, { useMemo } from "react";
import { ShortVideo, type ShortProps } from "./ShortVideo";
import { SCENES_04, SFX_04 } from "../scenes/short04";
import { TL, cue } from "../scenes/short04/tl";
import { Kampung } from "../world/Kampung";
import { placeCaptions, type Overlay } from "../lib/captionPlacement";

// Title card (S1) and end card areas, so subtitles keep clear of them
export const TEXT_OVERLAYS: Overlay = (f) => [
  ...(f < TL.scenes[0].toFrame ? [{ x0: 0.05, x1: 0.88, y0: 0.095, y1: 0.215 }] : []),
  ...(TL.labels.some((l) => f >= l.fromFrame && f < l.toFrame) ? [{ x0: 0.05, x1: 0.88, y0: 0.135, y1: 0.225 }] : []),
  ...(f >= cue("S9", 2) ? [{ x0: 0.05, x1: 0.88, y0: 0.29, y1: 0.5 }] : []),
];

// Short 04 follows the newer rules: clean text (no boxes), subtitles clear of the action, sound effects
export const Short04: React.FC<ShortProps> = (props) => {
  const placement = useMemo(() => placeCaptions(TL, SCENES_04, 1, TEXT_OVERLAYS), []);
  return <ShortVideo {...props} tl={TL} scenes={SCENES_04} endCardAt={cue("S9", 2)} textStyle="clean" sfx={SFX_04} world={<Kampung variant="short04" />} captionBottoms={placement.bottoms} />;
};
