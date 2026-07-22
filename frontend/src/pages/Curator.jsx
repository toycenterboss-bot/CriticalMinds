import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { C, fonts } from '../tokens.js'

export default function Curator() {
  const [groups, setGroups] = useState([])
  const [name, setName] = useState('')
  const [invite, setInvite] = useState(null)

  const load = () => api('/curator/groups').then(setGroups).catch(() => {})
  useEffect(load, [])

  const createGroup = async (e) => {
    e.preventDefault()
    await api('/curator/groups', { method: 'POST', body: JSON.stringify({ name }) })
    setName('')
    load()
  }

  const makeInvite = async (groupId) => {
    const data = await api(`/curator/groups/${groupId}/invites`, { method: 'POST' })
    setInvite(data.url)
  }

  return (
    <div>
      <div style={{
        background: C.markerSoft, border: `1px solid ${C.marker}`, padding: '10px 14px',
        marginBottom: 20, fontSize: 13, fontFamily: fonts.mono,
      }}>
        Вы видите активность, но не содержание: тексты дневников и формулировки
        прогнозов участников недоступны никому, включая вас.
      </div>

      <h1 style={{ fontFamily: fonts.mono, fontSize: 20, marginBottom: 16 }}>Мои группы</h1>
      {groups.map((g) => (
        <div key={g.id} style={{ background: C.card, border: `1px solid ${C.line}`,
                                 padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{g.name}</strong>
            <span style={{ fontFamily: fonts.mono, fontSize: 13, color: C.inkSoft }}>
              неделя {g.current_week} · участников: {g.members_count}
            </span>
          </div>
          <button onClick={() => makeInvite(g.id)} style={{
            marginTop: 10, padding: '6px 12px', border: `1px solid ${C.teal}`,
            background: 'transparent', color: C.teal, fontFamily: fonts.mono,
            cursor: 'pointer',
          }}>ссылка-приглашение участника</button>
        </div>
      ))}
      {invite && (
        <p style={{ fontFamily: fonts.mono, fontSize: 12, background: C.tealSoft,
                    padding: 10, wordBreak: 'break-all', marginBottom: 16 }}>
          {invite}<br />
          <span style={{ color: C.inkSoft }}>
            Одноразовая, живёт 72 часа. Передайте лично.
          </span>
        </p>
      )}
      <form onSubmit={createGroup} style={{ marginTop: 20, display: 'flex', gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} required
               placeholder="название новой группы"
               style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.line}`,
                        background: C.card, fontFamily: fonts.sans }} />
        <button type="submit" style={{ padding: '8px 16px', background: C.teal,
                                       color: C.card, border: 'none',
                                       fontFamily: fonts.mono, cursor: 'pointer' }}>
          создать
        </button>
      </form>
    </div>
  )
}
