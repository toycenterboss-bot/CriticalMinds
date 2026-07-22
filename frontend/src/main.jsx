import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap&subset=cyrillic');
  * { box-sizing: border-box; margin: 0; }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(<App />)
