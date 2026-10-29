import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Kampung } from "../world/Kampung";
import { Lighting } from "../world/Lighting";
import { Sky } from "../world/Sky";
import { CameraRig, type CamShot } from "../world/CameraRig";
import { FontGate } from "../fonts";
import { Grade } from "../components/Grade";
import { CashierDesk, Calculator, FlipCalendar, InstallmentBox, InterestBlock, MiniCalendar, PrincipalBlock, DESK, INTEREST_H } from "../world/props/desk";
import { Board, CrackBoard } from "../world/props/boards";
import { Coin, Envelope, Jar, MoneyStack, Sack } from "../world/props/money";
import { AnswerCard, BalanceScale, CementMixer, CommentBubble, SoilBlock, SpeechBubble } from "../world/props/misc";
import { DISPLAY, VIS } from "../finance";
import { BOARD_STYLE } from "../world/props/styles";

// Showroom of every prop, viewed from several angles
const SHOTS: CamShot[] = [
  { pos: [0.5, 2.2, 5.5], target: [0, 1.2, 0], fov: 40 },
  { pos: [-4.2, 2.0, 4.8], target: [-4.2, 1.0, 0], fov: 42 },
  { pos: [4.5, 2.2, 5.2], target: [4.5, 1.1, 0], fov: 42 },
  { pos: [-8.5, 2.0, 4.6], target: [-8.5, 1.0, 0], fov: 42 },
  { pos: [8.8, 2.4, 5.4], target: [8.8, 1.2, 0], fov: 42 },
  { pos: [1.5, 1.0, 3.0], target: [0, 1.15, 0], fov: 36 },
];

export const PropsTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const shot = SHOTS[Math.min(SHOTS.length - 1, frame)];
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} shadows="percentage" gl={{ antialias: true }}>
        <FontGate>
          <CameraRig {...shot} />
          <Lighting mood="morning" focus={[0, 0, 0]} shadowSize={14} />
          <Sky mood="morning" frame={frame} />
          <Kampung />
          {/* Centre: desk, calculator, FLAT board */}
          <CashierDesk position={[0, 0.06, 0]} />
          <Calculator position={[-0.35, 0.06 + DESK.h + 0.13, 0.05]} rotation={[0.25, 0.2, 0]} line={`${DISPLAY.loan} x ${DISPLAY.flatMonthly}`} on={1} />
          <Board position={[0.62, 0.06 + DESK.h + 0.08, 0.1]} w={0.62} h={0.3} posts={0.12} text={{ key: "flat", text: "FLAT", ...BOARD_STYLE.flat }} shine={0.5} />
          {/* Left: installment box with blocks, flip calendar */}
          <InstallmentBox position={[-4.2, 0.06, 0]} />
          <PrincipalBlock position={[-4.2, 0.16, 0]} />
          <InterestBlock position={[-4.2, 0.16 + VIS.principalBlockH, 0]} />
          <FlipCalendar position={[-2.9, 0.06, -0.4]} page={5.4} />
          {/* Right: percentage boards, jar */}
          <CrackBoard position={[3.6, 0.06, 0]} w={1.0} h={VIS.boardFlatH * 0.6} text={{ key: "b12", text: DISPLAY.flatYearly, ...BOARD_STYLE.wood }} crack={0.7} fall={0} />
          <Board position={[5.0, 0.06, 0]} w={1.2} h={VIS.boardEffectiveH * 0.6} wood text={{ key: "b21", text: DISPLAY.effectiveYearlyShort, ...BOARD_STYLE.red }} />
          <Jar position={[6.4, 0.06, 0.3]} fill={0.5} />
          {/* Far left: sacks, envelopes, money */}
          <Sack position={[-9.2, 0.06, 0]} label="ADMIN" color="#7CC3E8" />
          <Sack position={[-8.3, 0.06, 0.2]} label="ASURANSI" color="#F2B632" scale={0.95} />
          <Sack position={[-7.4, 0.06, 0]} color="#D9B98C" />
          <Envelope position={[-8.6, 0.09, 1.1]} rotation={[0, 0.2, 0]} label="JAN" />
          <MoneyStack position={[-7.5, 0.06, 1.0]} count={4} />
          <Coin position={[-8.0, 0.08, 1.3]} />
          <MiniCalendar position={[-9.3, 0.36, 1.2]} label={DISPLAY.flatMonthly} month={0} />
          {/* Far right: molen, scale, bubbles, card */}
          <CementMixer position={[8.0, 0.06, -0.3]} rotY={-0.4} spin={0.5} />
          <BalanceScale position={[9.8, 0.06, 0.2]} tilt={0.22} />
          <SpeechBubble position={[8.6, 2.8, 0]} text="EFEKTIF?" />
          <CommentBubble position={[10.2, 2.6, 0]} icon="heart" />
          <AnswerCard position={[7.0, 2.4, 0.4]} check={1} />
          <SoilBlock position={[0, 0, -8]} />
          <mesh position={[-4.2, 0.16 + VIS.principalBlockH + INTEREST_H + 0.3, 0]} />
        </FontGate>
      </ThreeCanvas>
      <Grade mood="morning" />
    </AbsoluteFill>
  );
};
