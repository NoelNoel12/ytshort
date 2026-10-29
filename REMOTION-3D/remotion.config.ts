import { Config } from "@remotion/cli/config";

// Headless Chrome shipped with the container (remotion.media is not reachable here).
// On Windows, delete this line or set REMOTION_BROWSER to your own Chrome path.
const browser =
  process.env.REMOTION_BROWSER ??
  (process.platform === "linux"
    ? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"
    : undefined);
if (browser) Config.setBrowserExecutable(browser);

// WebGL: swangle = ANGLE on SwiftShader (no GPU). Use "angle" on a machine with a GPU.
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as "angle" | "swangle") ?? "swangle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY ?? 2));
Config.setTimeoutInMilliseconds(240000);
Config.setEntryPoint("src/index.ts");
