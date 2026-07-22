// Дизайн-токены «лабораторный журнал» — палитра C из прототипа.
// Правило проекта: новые цвета вне палитры не вводить.
export const C = {
  paper: '#f6f4ee',
  grid: '#e3dfd3',
  ink: '#26241f',
  inkSoft: '#5c584e',
  teal: '#1f6f6b',
  tealSoft: '#e3efee',
  marker: '#e0b13e',
  markerSoft: '#f7ecd2',
  danger: '#a4442e',
  card: '#fffdf8',
  line: '#d8d3c4',
}

export const fonts = {
  sans: "'IBM Plex Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

export const gridBg = {
  backgroundColor: C.paper,
  backgroundImage:
    `linear-gradient(${C.grid} 1px, transparent 1px),` +
    `linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
  backgroundSize: '24px 24px',
}
