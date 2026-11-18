// 三套美术方向：同一分镜、同一节奏编排，只换视觉语言
export const THEMES = {
  pixel: {
    id: 'pixel',
    name: '像素星夜',
    en: 'PIXEL NIGHT',
    pitch: '8-bit 星空像素风，Clawd 原生像素造型；画面像一台会做梦的老掌机，所有运动落在像素网格上，按拍点“咔哒”跳帧。',
    look: 'pixel',
    font: '"Zpix","Fusion Pixel","Microsoft YaHei","PingFang SC","Noto Sans CJK SC","Noto Serif CJK SC",sans-serif',
    star: 'square', spark: 'square', snap: 6,
    sky: {
      night: ['#14102B', '#3B2A63'], dawn: ['#2A1F55', '#C86A8C'], sea: ['#0E2B44', '#2F7E8F'],
      warm: ['#2E1B44', '#7E4A86'], deep: ['#0A0A1A', '#1F1838'], rose: ['#2B0F25', '#8E2F4E'],
    },
    ground: '#120E24', ground2: '#221A3D', moon: '#FFE7A8', sea: ['#1E5C78', '#2E8C9E', '#7FD3D6'],
    ink: '#FFF4D6', inkDim: 'rgba(255,244,214,0.32)', accent: '#FFC94A', heart: '#FF4F7A',
    lyric: { size: 64, weight: 700, track: 6, shadow: '#000', box: true },
  },
  paper: {
    id: 'paper',
    name: '纸间回忆',
    en: 'PAPER MEMORY',
    pitch: '剪纸拼贴 + 拍立得，契合“把回忆拼好”。暖调纸纹、层叠投影、手写歌词条；角色是白边贴纸，镜头像在桌面上翻相册。',
    look: 'paper',
    font: '"LXGW WenKai","霞鹜文楷","STKaiti","KaiTi","Noto Serif CJK SC","Noto Serif CJK SC",serif',
    star: 'paperstar', spark: 'confetti', snap: 0,
    sky: {
      night: ['#3D3266', '#8C7BB8'], dawn: ['#6E5C9E', '#F2B5A7'], sea: ['#3F7C93', '#A6D8D4'],
      warm: ['#7A5A8E', '#E8B8C4'], deep: ['#2A2440', '#5A4E78'], rose: ['#6B2E4A', '#E58FA6'],
    },
    ground: '#2E2448', ground2: '#4A3C6B', moon: '#FFF1C9', sea: ['#4E9AAE', '#7DC3C6', '#D7F0EA'],
    ink: '#3A2C3E', inkDim: 'rgba(58,44,62,0.28)', accent: '#F2A541', heart: '#E8476A',
    lyric: { size: 62, weight: 600, track: 4, shadow: 'none', strip: '#FFF8EE' },
  },
  neon: {
    id: 'neon',
    name: '霓虹时差',
    en: 'NEON TIME-LAG',
    pitch: '深夜霓虹线稿，角色是发光描边；每一拍都在“通电”，副歌烟花用光轨粒子爆开，转场带 RGB 错位，最“动感”的一套。',
    look: 'neon',
    font: '"HarmonyOS Sans SC","Microsoft YaHei UI","PingFang SC","Noto Sans CJK SC","Noto Serif CJK SC",sans-serif',
    star: 'cross', spark: 'streak', snap: 0,
    sky: {
      night: ['#05030D', '#140C2E'], dawn: ['#0A0620', '#3A0F45'], sea: ['#020A14', '#06283A'],
      warm: ['#0B0418', '#2A0B33'], deep: ['#000000', '#0A0614'], rose: ['#0D0208', '#3D0820'],
    },
    ground: '#05030D', ground2: '#120A26', moon: '#FFE3F0', sea: ['#0BD3E8', '#3A7BFF', '#B98CFF'],
    ink: '#FFFFFF', inkDim: 'rgba(255,255,255,0.18)', accent: '#7CF7FF', heart: '#FF3D7F',
    lyric: { size: 60, weight: 300, track: 10, shadow: 'glow' },
  },
}
export const THEME_LIST = ['pixel', 'paper', 'neon']
