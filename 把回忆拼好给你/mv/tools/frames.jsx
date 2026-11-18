import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MVFrame } from '../src/MV'
import fs from 'fs'
const [, , out, theme, a, b, fps] = process.argv
let n = 0
for (let t = +a; t < +b; t += 1 / +fps) {
  const svg = renderToStaticMarkup(<MVFrame theme={theme} t={t} width={1080} />)
  fs.writeFileSync(`${out}/f${String(n++).padStart(5, '0')}.svg`, svg.replace(/font-family:[^;"]*/g, 'font-family:Noto Serif CJK SC').replace(/font-family="[^"]*"/g, 'font-family="monospace"'))
}
