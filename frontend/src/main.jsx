import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Глобальный слой: шрифты, взаимодействие, анимации, маркерные выделения.
const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap&subset=cyrillic');
  * { box-sizing: border-box; margin: 0; }
  html { -webkit-font-smoothing: antialiased; }
  ::selection { background: #DCEEEB; }

  button, input, textarea, a { transition: background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .12s ease, opacity .15s ease, color .15s ease; }

  :focus { outline: none; }
  :focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(14,110,100,.35) !important; border-radius: 10px; }

  button:not(:disabled) { cursor: pointer; }
  button:not(:disabled):active { transform: translateY(1px) scale(.995); }
  .btn-primary:not(:disabled) { box-shadow: 0 2px 0 rgba(24,36,32,.25); }
  .btn-primary:not(:disabled):hover { filter: brightness(1.12); box-shadow: 0 3px 8px rgba(14,110,100,.35); }
  .btn-ghost:not(:disabled):hover { background: rgba(24,36,32,.06) !important; }
  .opt:not(:disabled):hover { border-color: #182420 !important; transform: translateX(2px); }
  .navtab:hover { color: #0E6E64 !important; }
  .card-link:hover { box-shadow: 0 6px 18px rgba(24,36,32,.10); transform: translateY(-1px); }

  input:focus, textarea:focus { border-color: #0E6E64 !important; box-shadow: 0 0 0 3px rgba(14,110,100,.15); background: #FFFFFF !important; }
  a:hover { text-decoration: underline; }

  /* Маркерное выделение — жёлтый штрих, как в бумажном журнале */
  .hl {
    background: linear-gradient(100deg, rgba(255,222,89,.0) 0%, rgba(255,222,89,.85) 4%, rgba(255,222,89,.65) 92%, rgba(255,222,89,.0) 100%);
    padding: 2px 10px 3px;
    border-radius: 4px;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }

  /* Появление контента */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .fade-up { animation: fadeUp .35s ease both; }
  .fade-up-1 { animation: fadeUp .35s ease .05s both; }
  .fade-up-2 { animation: fadeUp .35s ease .1s both; }
  .fade-up-3 { animation: fadeUp .35s ease .15s both; }
  @keyframes revealIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  .reveal-in { animation: revealIn .3s ease both; }
  @media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation: none !important; transition: none !important; } }

  @media (max-width: 480px) { main { padding: 14px !important; } }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(<App />)
