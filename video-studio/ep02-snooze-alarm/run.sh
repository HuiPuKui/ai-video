#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -x ".venv/bin/python" ]; then
  echo ">>> Creating Python 3 venv and installing numpy, playwright..."
  /opt/homebrew/bin/python3 -m venv .venv
  .venv/bin/pip install -q numpy playwright
fi

echo ">>> [1/3] Building pure-music beat-locked audio & extracting real orchestral accents..."
.venv/bin/python src/build_audio.py

echo ">>> [2/3] Rendering 4 cover ratios & QA keyframes..."
.venv/bin/python src/render.py qa

echo ">>> [3/3] Rendering full 1080x1920 30fps H.264 video..."
.venv/bin/python src/render.py video

echo ""
echo "✅ EP02 PURE-MUSIC BEAT-SYNCED VERSION DONE!"
ls -lh output/
