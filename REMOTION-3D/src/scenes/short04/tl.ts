// Short 04 timeline bindings (cue, wordFrame) for its scenes
import raw04 from "../../../data/short-04.timeline.json";
import { makeTimeline } from "../../timeline";

export const { TL, cue, wordFrame, sceneRange } = makeTimeline(raw04);
