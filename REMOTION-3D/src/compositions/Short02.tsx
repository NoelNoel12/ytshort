import React from "react";
import { ShortVideo, type ShortProps } from "./ShortVideo";
import { SCENES_02 } from "../scenes/short02";
import { TL, cue } from "../timeline";

// Short 02 keeps the look it was published with (dark chips, title band, no SFX)
export const Short02: React.FC<ShortProps> = (props) => <ShortVideo {...props} tl={TL} scenes={SCENES_02} endCardAt={cue("S9", 2)} textStyle="chips" />;
