#!/bin/bash
# 用法: tools/snap.sh out.png  pixel@3 paper@3 ...  （横向拼接）
set -e
D=/tmp/mvssr; OUT=$1; shift
cd "$(dirname "$0")/.."
node_modules/.bin/esbuild tools/ssr.jsx --bundle --platform=node --jsx=automatic --loader:.js=jsx --outfile=$D/ssr.cjs --log-level=error
rm -f $D/*.svg $D/*.png
node $D/ssr.cjs $D "$@"
python3 -c "
import cairosvg,sys
for f in sys.argv[1:]: cairosvg.svg2png(url=f,write_to=f[:-4]+'.png',output_width=405,output_height=720)
" $(for j in "$@"; do th=${j%@*}; t=${j#*@}; printf "$D/%s_%.2f.svg " $th $t; done)
convert $(for j in "$@"; do th=${j%@*}; t=${j#*@}; printf "$D/%s_%.2f.png " $th $t; done) +append "$OUT"
