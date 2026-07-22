import React, { useEffect, useState } from 'react'
import { acceptInvite, api } from '../api.js'
import { C, fonts } from '../tokens.js'

const input = {
  width: '100%', padding: '10px 12px', marginBottom: 12,
  border: `1px solid ${C.line}`, background: C.card,
  fontFamily: fonts.sans, fontSize: 15,
}

export default function Join({ token, onDone }) {
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    api(`/auth/invite-info?token=${encodeURIComponent(token)}`)
      .then(setInfo).catch((e) => setError(e.message))
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await acceptInvite({ token, ...form })
      window.history.replaceState(null, '', '/')
      await onDone()
    } catch (err) { setError(err.message) }
  }

  if (error && !info) return <p style={{ color: C.danger }}>{error}</p>
  if (!info) return <p>Проверяю приглашение…</p>

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', background: C.card,
                  border: `1px solid ${C.line}`, padding: 28 }}>
      <h1 style={{ fontFamily: fonts.mono, fontSize: 18, marginBottom: 8 }}>
        Приглашение: {info.role === 'curator' ? 'куратор' : 'участник'}
      </h1>
      {info.group_name && (
        <p style={{ color: C.inkSoft, marginBottom: 16 }}>Группа: {info.group_name}</p>
      )}
      <form onSubmit={submit}>
        <input style={input} placeholder="имя" value={form.name} required
               onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input style={input} type="email" placeholder="email" value={form.email} required
               onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input style={input} type="password" placeholder="пароль (мин. 10 символов)"
               minLength={10} value={form.password} required
               onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button type="submit" style={{
          width: '100%', padding: '10px 0', background: C.teal, color: C.card,
          border: 'none', fontFamily: fonts.mono, fontSize: 15, cursor: 'pointer',
        }}>создать аккаунт</button>
      </form>
    </div>
  )
}
