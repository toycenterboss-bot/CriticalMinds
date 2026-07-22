import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { C, fonts } from '../tokens.js'

export default function Admin() {
  const [groups, setGroups] = useState([])
  const [invite, setInvite] = useState(null)

  useEffect(() => { api('/admin/groups').then(setGroups).catch(() => {}) }, [])

  const inviteCurator = async () => {
    const data = await api('/admin/curator-invites', { method: 'POST' })
    setInvite(data.url)
  }

  return (
    <div>
      <h1 style={{ fontFamily: fonts.mono, fontSize: 20, marginBottom: 16 }}>
        Администрирование
      </h1>
      <button onClick={inviteCurator} style={{
        padding: '8px 16px', background: C.teal, color: C.card, border: 'none',
        fontFamily: fonts.mono, cursor: 'pointer', marginBottom: 16,
      }}>ссылка-приглашение куратора</button>
      {invite && (
        <p style={{ fontFamily: fonts.mono, fontSize: 12, background: C.tealSoft,
                    padding: 10, wordBreak: 'break-all', marginBottom: 16 }}>
          {invite}
        </p>
      )}
      <h2 style={{ fontFamily: fonts.mono, fontSize: 16, margin: '16px 0 10px' }}>
        Все группы
      </h2>
      {groups.length === 0 && <p style={{ color: C.inkSoft }}>Групп пока нет.</p>}
      {groups.map((g) => (
        <div key={g.id} style={{ background: C.card, border: `1px solid ${C.line}`,
                                 padding: 14, marginBottom: 8, display: 'flex',
                                 justifyContent: 'space-between' }}>
          <strong>{g.name}</strong>
          <span style={{ fontFamily: fonts.mono, fontSize: 13, color: C.inkSoft }}>
            неделя {g.current_week} · участников: {g.members_count}
          </span>
        </div>
      ))}
    </div>
  )
}
