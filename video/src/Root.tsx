import React from "react";
import { Composition } from "remotion";
import { MailTrackerDemo } from "./MailTrackerDemo";

// Total: 1070 frames @ 30fps = 35.7 seconds
// 170 + 160 + 120 + 230 + 130 + 210 + 170 = 1190 — 6 transitions × 20 frames = 1070
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MailTrackerDemo"
      component={MailTrackerDemo}
      durationInFrames={1070}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
