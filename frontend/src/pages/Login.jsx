import React, { useState } from 'react'
import { C, fonts } from '../tokens.js'

const input = {
  width: '100%', padding: '10px 12px', marginBottom: 12,
  border: `1px solid ${C.line}`, background: C.card,
  fontFamily: fonts.sans, fontSize: 15,
}

export default function Login({ onLogin, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div style={{ maxWidth: 380, margin: '80px auto', background: C.card,
                  border: `1px solid ${C.line}`, padding: 28 }}>
      <h1 style={{ fontFamily: fonts.mono, fontSize: 18, marginBottom: 20 }}>Вход</h1>
      <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password) }}>
        <input style={input} type="email" placeholder="email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <input style={input} type="password" placeholder="пароль" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button type="submit" style={{
          width: '100%', padding: '10px 0', background: C.teal, color: C.card,
          border: 'none', fontFamily: fonts.mono, fontSize: 15, cursor: 'pointer',
        }}>войти</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13, color: C.inkSoft }}>
        Нет аккаунта? Попросите у куратора ссылку-приглашение.
      </p>
    </div>
  )
}
