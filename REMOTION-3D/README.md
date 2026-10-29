# REMOTION-3D: Noel Menjawab Shorts (3D stylized)

Remotion + Three.js pipeline for vertical Shorts (1080x1920, 30 fps). One persistent `ThreeCanvas`, a shared kampung diorama, reusable characters (Pak Dodi, Tuti) and props, scenes driven by word timings from the voice-over.

## Folder layout (ROOT is the folder above this one)

```
ROOT/
  AUDIO/30 Oktober 2026/Bunga Flat.mp3     VO, never modified
  ASSETS/REFERENCES/                       reference videos, read only
  FINAL OUTPUT/30 Oktober 2026/            renders (never overwritten, version tag bumps)
  skrip-short-02-bunga-flat.md             script, source of truth for VO text
  REMOTION-3D/
    data/videos.ts                         one entry per Short (paths, scene types, label anchors)
    data/short-02.*.json                   pipeline output (script, words, timeline, audio)
    scripts/                               pipeline, checks, renders
    src/theme.ts                           colours, fonts, safe zones, caption rules
    src/anim.ts                            spring presets (snappy, bouncy, heavy), helpers
    src/finance.ts                         every on-screen number and data-driven 3D size
    src/world/                             sky, ground, buildings, nature, street, materials
    src/world/characters/                  Pak Dodi, Tuti, poses and expressions
    src/world/props/                       desk, boards, money, jar, scale, mixer, bubbles
    src/scenes/short02/                    S1 to S9
    src/components/TextLayers.tsx          subtitles, labels, title card, end card
    tools/transcribe.py                    faster-whisper word timestamps
```

## Setup

```
npm install
```

Whisper (word timestamps): Python 3.10+ with `faster-whisper`.

```
python -m venv tools/venv
tools/venv/Scripts/pip install faster-whisper      (Windows)
tools/venv/bin/pip install faster-whisper          (macOS, Linux)
```

Put a CTranslate2 Whisper model in `tools/whisper-small-ct2` (or set `WHISPER_MODEL`). A larger model (medium) can be used the same way. `WHISPER_PY` overrides the Python path.

Browser and GL: `remotion.config.ts` uses the container Chrome on Linux. On Windows leave `REMOTION_BROWSER` unset and set `REMOTION_GL=angle` to use the GPU (much faster than SwiftShader).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Remotion Studio (compositions Short02, PropsTest, CharacterTest, WorldTest) |
| `npm run data` | prepareAudio, transcribe, parseScript, refineCaptions, alignScenes, checkFinance |
| `npm run verify` | checkFinance plus pre-render verifySync |
| `npm run verify:sync` | caption pages vs silencedetect, action triggers vs word times |
| `npm run check:flicker` | locked-camera and moving-camera flicker checks per scene |
| `npm run still:check` | stills at start, middle, end of every scene plus a contact sheet |
| `npm run render:preview` | half-resolution preview to `out/` |
| `npm run render:one` | final MP4 to FINAL OUTPUT, then verifySync on the file |
| `npm run render:all` | every video in `data/videos.ts` |

Post-render check on any file: `npx tsx scripts/verifySync.ts short-02 --video "path.mp4"` (add `--stills` for 10 mid-word stills).

## Adding the next Short

1. Add an entry to `data/videos.ts` (script, audio, output, sceneTypeMap).
2. `npx tsx scripts/data.ts short-03`.
3. Write scenes in `src/scenes/short03/` using `cue("S1", 0)` for every Aksi trigger (verifySync checks that each one is wired).
4. Register a composition in `src/Root.tsx`.
