import React, { useState } from 'react'
import { C, fonts, inputStyle } from '../tokens.js'
import { Btn, Card } from '../components/ui.jsx'

export default function Login({ onLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div style={{ maxWidth: 380, margin: '64px auto 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontFamily: fonts.mono, fontWeight: 600, fontSize: 34, letterSpacing: '-.02em', color: C.ink }}>
          ОПТИКА<span style={{ color: C.teal }}>_</span>
        </div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
          прибор для наблюдения за собственным мышлением
        </div>
      </div>
      <Card style={{ padding: 26 }}>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password) }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} type="email" placeholder="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <input style={inputStyle} type="password" placeholder="пароль" value={password}
                 onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>}
          <Btn type="submit">войти</Btn>
        </form>
        <p style={{ marginTop: 14, fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
          Нет аккаунта? Попросите у куратора ссылку-приглашение.
        </p>
      </Card>
    </div>
  )
}
