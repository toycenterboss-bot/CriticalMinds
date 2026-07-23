// Оболочка MVP: логин, приём инвайта, ролевой роутинг.
// Следующая итерация: перенос движка уроков и практик из prototype/optika_prototype.jsx.
import React, { useEffect, useState } from 'react'
import { api, hasToken, login, logout } from './api.js'
import { C, fonts, gridBg } from './tokens.js'
import Login from './pages/Login.jsx'
import Join from './pages/Join.jsx'
import Participant from './pages/Participant.jsx'
import Curator from './pages/Curator.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)
  const joinToken = new URLSearchParams(window.location.search).get('token')
  const isJoin = window.location.pathname === '/join' && joinToken

  const loadMe = async () => {
    try { setMe(await api('/me')) } catch { setMe(null) }
  }

  useEffect(() => { if (hasToken()) loadMe() }, [])

  const handleLogin = async (email, password) => {
    setError(null)
    try { await login(email, password); await loadMe() }
    catch (e) { setError(e.message) }
  }

  const handleLogout = async () => { await logout(); setMe(null) }

  const shell = (content) => (
    <div style={{ ...gridBg, minHeight: '100vh', fontFamily: fonts.sans, color: C.ink }}>
      {/* Приборная панель: тёмная шапка с фирменным знаком */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 24px', background: C.ink,
        borderBottom: `3px solid ${C.teal}`,
        boxShadow: '0 2px 12px rgba(24,36,32,.25)',
      }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: fonts.mono, fontWeight: 600, fontSize: 20, letterSpacing: '-.02em', color: C.white }}>
            ОПТИКА<span style={{ color: C.marker }}>_</span>
          </span>
          <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>
            прибор для наблюдения за мышлением
          </span>
        </span>
        {me && (
          <span style={{ fontFamily: fonts.mono, fontSize: 13, color: 'rgba(255,255,255,.75)' }}>
            {me.name}
            <button onClick={handleLogout} style={{
              marginLeft: 14, border: '1px solid rgba(255,255,255,.35)', borderRadius: 8,
              background: 'transparent', fontFamily: fonts.mono, padding: '4px 12px',
              color: 'rgba(255,255,255,.85)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.12)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >выйти</button>
          </span>
        )}
      </header>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>{content}</main>
    </div>
  )

  if (isJoin) return shell(<Join token={joinToken} onDone={loadMe} />)
  if (!me) return shell(<Login onLogin={handleLogin} error={error} />)
  if (me.role === 'superadmin') return shell(<Admin me={me} />)
  if (me.role === 'curator') return shell(<Curator me={me} />)
  return shell(<Participant me={me} />)
}
