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
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', borderBottom: `1px solid ${C.line}`, background: C.card,
      }}>
        <span style={{ fontFamily: fonts.mono, fontWeight: 500, color: C.teal }}>
          ОПТИКА<span style={{ color: C.inkSoft }}> · прибор для наблюдения за мышлением</span>
        </span>
        {me && (
          <span style={{ fontFamily: fonts.mono, fontSize: 13, color: C.inkSoft }}>
            {me.name} · {me.role}{' '}
            <button onClick={handleLogout} style={{
              marginLeft: 12, border: `1px solid ${C.line}`, background: 'transparent',
              fontFamily: fonts.mono, cursor: 'pointer', padding: '4px 10px', color: C.ink,
            }}>выйти</button>
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
