import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { C, fonts } from '../tokens.js'

export default function Participant({ me }) {
  const [lessons, setLessons] = useState([])
  useEffect(() => { api('/me/lessons').then(setLessons).catch(() => {}) }, [])

  return (
    <div>
      <h1 style={{ fontFamily: fonts.mono, fontSize: 20, marginBottom: 4 }}>
        Неделя {me.current_week}
      </h1>
      <p style={{ color: C.inkSoft, marginBottom: 20 }}>
        {me.group_name ? `Группа «${me.group_name}»` : 'Вы пока не в группе'}
      </p>
      {lessons.map((l) => (
        <div key={l.id} style={{
          background: C.card, border: `1px solid ${C.line}`, padding: 16,
          marginBottom: 10, display: 'flex', justifyContent: 'space-between',
          opacity: l.available ? 1 : 0.45,
        }}>
          <span>
            <span style={{ fontFamily: fonts.mono, color: C.teal, marginRight: 10 }}>
              {l.week}.{l.ord}
            </span>
            {l.title}
          </span>
          <span style={{ fontFamily: fonts.mono, fontSize: 13,
                         color: l.completed ? C.teal : C.inkSoft }}>
            {l.completed ? '✓ пройден' : l.available ? 'открыт' : 'закрыт'}
          </span>
        </div>
      ))}
      <p style={{ marginTop: 24, fontSize: 13, color: C.inkSoft }}>
        Плеер уроков, дневник, трекер прогнозов и график калибровки переносятся
        из прототипа следующей итерацией.
      </p>
    </div>
  )
}
