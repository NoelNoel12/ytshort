import React from "react";
import { Composition } from "remotion";
import { WorldTest } from "./compositions/WorldTest";
import { CharacterTest } from "./compositions/CharacterTest";
import { PropsTest } from "./compositions/PropsTest";
import { Short02 } from "./compositions/Short02";
import { TL } from "./timeline";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Short02" component={Short02} durationInFrames={TL.durationInFrames} fps={TL.fps} width={1080} height={1920} defaultProps={{ hideText: false, lockCamera: null, freezeAt: null }} />
      <Composition id="PropsTest" component={PropsTest} durationInFrames={6} fps={30} width={1080} height={1920} />
      <Composition id="CharacterTest" component={CharacterTest} durationInFrames={9} fps={30} width={1080} height={1920} />
      <Composition id="WorldTest" component={WorldTest} durationInFrames={6} fps={30} width={1080} height={1920} />
    </>
  );
};
