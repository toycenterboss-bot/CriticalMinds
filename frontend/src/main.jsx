import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Глобальный слой крафта: шрифты, focus-ring, ховеры, переходы.
// Палитра — только роли из tokens.js (C).
const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap&subset=cyrillic');
  * { box-sizing: border-box; margin: 0; }
  html { -webkit-font-smoothing: antialiased; }
  ::selection { background: #DCEEEB; }

  button, input, textarea, a { transition: background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .1s ease, opacity .15s ease; }

  :focus { outline: none; }
  :focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(14,110,100,.35) !important; border-radius: 10px; }

  button:not(:disabled) { cursor: pointer; }
  button:not(:disabled):active { transform: translateY(1px); }
  .btn-primary:not(:disabled):hover { filter: brightness(1.12); }
  .btn-ghost:not(:disabled):hover { background: rgba(24,36,32,.06) !important; }
  .opt:not(:disabled):hover { border-color: #182420 !important; }
  .navtab:hover { color: #0E6E64 !important; }

  input:focus, textarea:focus { border-color: #0E6E64 !important; box-shadow: 0 0 0 3px rgba(14,110,100,.15); background: #FFFFFF !important; }
  a:hover { text-decoration: underline; }

  @media (max-width: 480px) { main { padding: 14px !important; } }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(<App />)
