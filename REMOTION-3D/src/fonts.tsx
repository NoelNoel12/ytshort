import React from "react";
import { continueRender, delayRender, staticFile } from "remotion";

// Local fonts (SIL OFL, from @fontsource). Loaded once per tab.
const FACES = [
  { family: "Plus Jakarta Sans", weight: "700", file: "fonts/plus-jakarta-sans-latin-700-normal.woff2" },
  { family: "Plus Jakarta Sans", weight: "800", file: "fonts/plus-jakarta-sans-latin-800-normal.woff2" },
  { family: "Baloo 2", weight: "700", file: "fonts/baloo-2-latin-700-normal.woff2" },
  { family: "Baloo 2", weight: "800", file: "fonts/baloo-2-latin-800-normal.woff2" },
];

let ready: Promise<void> | null = null;
let isReady = false;

export const fontsReady = (): Promise<void> => {
  if (ready) return ready;
  if (typeof document === "undefined") return Promise.resolve();
  const handle = delayRender("Loading fonts");
  ready = Promise.all(
    FACES.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format("woff2")`, { weight: f.weight });
      await face.load();
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
    }),
  )
    .then(() => {
      isReady = true;
      continueRender(handle);
    })
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
  return ready;
};

export const areFontsReady = () => isReady;

// Kick off immediately when the bundle loads
fontsReady();

// Renders children only after fonts are loaded (sign textures draw text into canvases)
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ok, setOk] = React.useState(areFontsReady());
  const [handle] = React.useState(() => (areFontsReady() ? null : delayRender("FontGate")));
  React.useEffect(() => {
    if (!ok) fontsReady().then(() => setOk(true));
  }, [ok]);
  React.useEffect(() => {
    if (ok && handle !== null) continueRender(handle);
  }, [ok, handle]);
  return ok ? <>{children}</> : null;
};
