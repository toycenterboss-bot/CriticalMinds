import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { C, fonts } from '../tokens.js'
import { Btn, Card, Tag } from '../components/ui.jsx'

export default function Admin() {
  const [groups, setGroups] = useState([])
  const [invite, setInvite] = useState(null)

  useEffect(() => { api('/admin/groups').then(setGroups).catch(() => {}) }, [])

  const inviteCurator = async () => {
    const data = await api('/admin/curator-invites', { method: 'POST' })
    setInvite(data.url)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h1 style={{ fontFamily: fonts.mono, fontSize: 20, fontWeight: 600, margin: 0 }}>
        Администрирование
      </h1>
      <div>
        <Btn onClick={inviteCurator}>ссылка-приглашение куратора</Btn>
      </div>
      {invite && (
        <p style={{ fontFamily: fonts.mono, fontSize: 12, background: C.tealSoft, padding: 10, borderRadius: 8, wordBreak: 'break-all' }}>
          {invite}<br />
          <span style={{ color: C.inkSoft }}>Одноразовая, живёт 72 часа. Передайте лично.</span>
        </p>
      )}
      <div style={{ fontWeight: 700, fontSize: 15 }}>Все группы</div>
      {groups.length === 0 && <p style={{ color: C.inkSoft, fontSize: 14 }}>Групп пока нет.</p>}
      {groups.map((g) => (
        <Card key={g.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 15.5 }}>{g.name}</strong>
            <span style={{ fontFamily: fonts.mono, fontSize: 12.5, color: C.inkSoft }}>
              неделя {g.current_week} · участников: {g.members_count}
            </span>
          </div>
        </Card>
      ))}
      <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
        Суперадмин видит только метаданные групп. Содержание практик участников недоступно никому.
      </p>
    </div>
  )
}
