// Дизайн-токены «лабораторный журнал» — палитра C из прототипа, БЕЗ изменений.
// Правило проекта: новые цвета вне палитры не вводить.
export const C = {
  paper: '#F3F5F4',
  grid: '#DCE3E1',
  ink: '#182420',
  inkSoft: '#4B5B55',
  teal: '#0E6E64',
  tealSoft: '#DCEEEB',
  marker: '#FFDE59',
  markerSoft: '#FFF3D6',
  red: '#C2492F',
  redSoft: '#F9E3DC',
  white: '#FFFFFF',
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

export const inputStyle = {
  fontFamily: fonts.sans, fontSize: 14.5, padding: '10px 14px',
  border: `1.5px solid ${C.grid}`, borderRadius: 10, background: C.paper,
  width: '100%', boxSizing: 'border-box',
}
