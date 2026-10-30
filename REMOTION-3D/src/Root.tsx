import React from "react";
import { Composition } from "remotion";
import { WorldTest } from "./compositions/WorldTest";
import { CharacterTest } from "./compositions/CharacterTest";
import { PropsTest } from "./compositions/PropsTest";
import { BuildingTest } from "./compositions/BuildingTest";
import { PoseTest } from "./compositions/PoseTest";
import { Short02 } from "./compositions/Short02";
import { TL } from "./timeline";
import { Short04 } from "./compositions/Short04";
import { TL as TL04 } from "./scenes/short04/tl";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Short04" component={Short04} durationInFrames={TL04.durationInFrames} fps={TL04.fps} width={1080} height={1920} defaultProps={{ hideText: false, lockCamera: null, freezeAt: null }} />
      <Composition id="Short02" component={Short02} durationInFrames={TL.durationInFrames} fps={TL.fps} width={1080} height={1920} defaultProps={{ hideText: false, lockCamera: null, freezeAt: null }} />
      <Composition id="PoseTest" component={PoseTest} durationInFrames={6} fps={30} width={1080} height={1920} />
      <Composition id="BuildingTest" component={BuildingTest} durationInFrames={4} fps={30} width={1080} height={1920} />
      <Composition id="PropsTest" component={PropsTest} durationInFrames={6} fps={30} width={1080} height={1920} />
      <Composition id="CharacterTest" component={CharacterTest} durationInFrames={9} fps={30} width={1080} height={1920} />
      <Composition id="WorldTest" component={WorldTest} durationInFrames={6} fps={30} width={1080} height={1920} />
    </>
  );
};
