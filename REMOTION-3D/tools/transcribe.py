"""Word-level transcription with faster-whisper.

Usage: python transcribe.py <audio> <out.json> [--model DIR] [--prompt TEXT]
"""
import argparse
import json
import subprocess
import sys
import time

import numpy as np

from faster_whisper import WhisperModel


def load_audio(path: str, sr: int = 16000) -> np.ndarray:
    # Decode with system ffmpeg (avoids PyAV version issues)
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("out")
    ap.add_argument("--model", required=True)
    ap.add_argument("--prompt", default=None)
    ap.add_argument("--lang", default="id")
    ap.add_argument("--beam", type=int, default=5)
    args = ap.parse_args()

    t0 = time.time()
    model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=4)
    segments, info = model.transcribe(
        load_audio(args.audio),
        language=args.lang,
        beam_size=args.beam,
        word_timestamps=True,
        vad_filter=False,
        condition_on_previous_text=True,
        initial_prompt=args.prompt,
    )
    words = []
    segs = []
    for s in segments:
        segs.append({"start": s.start, "end": s.end, "text": s.text.strip()})
        for w in s.words or []:
            words.append(
                {
                    "text": w.word.strip(),
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "prob": round(w.probability, 3),
                }
            )
    out = {
        "model": args.model,
        "language": info.language,
        "duration": info.duration,
        "elapsedSec": round(time.time() - t0, 1),
        "segments": segs,
        "words": [w for w in words if w["text"]],
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"words={len(out['words'])} elapsed={out['elapsedSec']}s", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
