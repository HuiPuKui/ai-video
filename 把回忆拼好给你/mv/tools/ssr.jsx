import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MVFrame } from '../src/MV'
import fs from 'fs'
const [, , out, ...jobs] = process.argv
for (const j of jobs) {
  const [theme, t] = j.split('@')
  const svg = renderToStaticMarkup(<MVFrame theme={theme} t={+t} width={1080} />)
  fs.writeFileSync(`${out}/${theme}_${(+t).toFixed(2)}.svg`, svg.replace(/font-family:[^;"]*/g, 'font-family:Noto Serif CJK SC').replace(/font-family="[^"]*"/g, 'font-family="monospace"'))
}
