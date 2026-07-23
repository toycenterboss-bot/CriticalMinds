import React, { useEffect, useState } from 'react'
import { acceptInvite, api } from '../api.js'
import { C, fonts, inputStyle } from '../tokens.js'
import { Btn, Card, Tag } from '../components/ui.jsx'

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

  if (error && !info) return <p style={{ color: C.red, textAlign: 'center', marginTop: 60 }}>{error}</p>
  if (!info) return <p style={{ color: C.inkSoft, textAlign: 'center', marginTop: 60 }}>Проверяю приглашение…</p>

  return (
    <div style={{ maxWidth: 420, margin: '48px auto 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: fonts.mono, fontWeight: 600, fontSize: 30, letterSpacing: '-.02em', color: C.ink }}>
          ОПТИКА<span style={{ color: C.teal }}>_</span>
        </div>
      </div>
      <Card style={{ padding: 26 }}>
        <div style={{ marginBottom: 6 }}>
          <Tag>{info.role === 'curator' ? 'приглашение куратора' : 'приглашение участника'}</Tag>
        </div>
        {info.group_name && (
          <p style={{ color: C.inkSoft, fontSize: 14, margin: '6px 0 14px' }}>Группа: <b style={{ color: C.ink }}>{info.group_name}</b></p>
        )}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} placeholder="имя" value={form.name} required autoFocus
                 onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={inputStyle} type="email" placeholder="email" value={form.email} required
                 onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input style={inputStyle} type="password" placeholder="пароль (мин. 10 символов)"
                 minLength={10} value={form.password} required
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>}
          <Btn type="submit">создать аккаунт</Btn>
        </form>
      </Card>
    </div>
  )
}
