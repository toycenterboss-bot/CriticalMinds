// Кураторский раздел: группы, дашборд (сводка, автофлаги, карточки участников).
// Только метаданные — содержание практик не приходит из API вообще.
import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { C, fonts, inputStyle } from '../tokens.js'
import { Btn, Card, Tag } from '../components/ui.jsx'

const flagBg = { risk: C.redSoft, warn: C.markerSoft, info: C.paper }
const flagBorder = { risk: C.red, warn: C.marker, info: C.grid }

const fmtDate = (d) => (d ? new Date(d).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const fmtMin = (sec) => (sec == null ? '—' : `${Math.max(1, Math.round(sec / 60))} мин`)

function MemberCard({ m }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</span>
        <span style={{ fontFamily: fonts.mono, fontSize: 11.5, color: C.inkSoft }}>
          активность: {fmtDate(m.last_activity_at)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, margin: '10px 0 8px', flexWrap: 'wrap' }}>
        {m.lessons.length ? m.lessons.map((l) => {
          const tooFast = l.duration_sec != null && l.duration_sec <= 300
          const done = l.completed_at != null
          return (
            <div key={l.lesson_id} style={{
              fontFamily: fonts.mono, fontSize: 11.5, padding: '5px 9px', borderRadius: 7,
              background: done ? (tooFast ? C.markerSoft : C.tealSoft) : C.paper,
              border: `1px solid ${done ? (tooFast ? C.marker : C.teal) : C.grid}`,
              color: C.ink,
            }}>
              Урок {l.week}.{l.ord} · {done ? `${fmtMin(l.duration_sec)}${tooFast ? ' ⚠' : ''}` : 'начат'}
            </div>
          )
        }) : <span style={{ fontSize: 12.5, color: C.inkSoft }}>уроки не начаты</span>}
      </div>

      <div style={{ display: 'flex', gap: 14, fontFamily: fonts.mono, fontSize: 12, color: C.inkSoft, flexWrap: 'wrap' }}>
        <span>дневник: <b style={{ color: m.journal_count ? C.teal : C.red }}>{m.journal_count}</b> зап.</span>
        <span>к встрече: <b style={{ color: C.ink }}>{m.shared_count}</b></span>
        <span>прогнозы: <b style={{ color: m.predictions_count ? C.teal : C.red }}>{m.predictions_count}</b></span>
        <span>оффлайн: <b style={{ color: C.ink }}>{m.materials_done}</b></span>
        <span>квиз: <b style={{ color: m.quiz_total == null ? C.red : C.teal }}>{m.quiz_total == null ? '—' : `${m.quiz_hits}/${m.quiz_total}`}</b></span>
      </div>
    </Card>
  )
}

export default function Curator() {
  const [groups, setGroups] = useState([])
  const [dash, setDash] = useState(null)
  const [name, setName] = useState('')
  const [invite, setInvite] = useState(null)

  const load = () => api('/curator/groups').then(setGroups).catch(() => {})
  useEffect(load, [])

  const openDash = async (g) => setDash(await api(`/curator/groups/${g.id}/dashboard`))

  const createGroup = async (e) => {
    e.preventDefault()
    await api('/curator/groups', {
      method: 'POST',
      body: JSON.stringify({ name, start_date: new Date().toISOString() }),
    })
    setName('')
    load()
  }

  const makeInvite = async (groupId) => {
    const data = await api(`/curator/groups/${groupId}/invites`, { method: 'POST' })
    setInvite(data.url)
  }

  return (
    <div className="fade-up" style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: C.ink, color: C.white, borderRadius: 12, padding: '12px 16px', fontSize: 13, lineHeight: 1.55 }}>
        <b>Вы видите активность, но не содержание.</b> Тексты дневников и формулировки прогнозов
        участников приватны — доступны только факты и количество. Это условие честности их записей.
      </div>

      {dash ? (
        <>
          <button onClick={() => setDash(null)} style={{ background: 'none', border: 'none', color: C.teal, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: fonts.sans }}>← Мои группы</button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, alignSelf: 'flex-start' }}>
            <span className="hl">{dash.group.name} · неделя {dash.week}</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              [`${dash.members.length}`, 'участников'],
              [`${dash.members.filter((m) => m.quiz_total != null).length}/${dash.members.length}`, 'прошли квиз недели'],
              [`${dash.members.reduce((s, m) => s + m.lessons.filter((l) => l.completed_at).length, 0)}`, 'уроков пройдено'],
              [`${dash.members.reduce((s, m) => s + m.journal_count, 0)}`, 'записей в дневниках'],
            ].map(([v, l], i) => (
              <Card key={i} style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 20, fontWeight: 600, color: C.teal }}>{v}</div>
                <div style={{ fontSize: 11.5, color: C.inkSoft }}>{l}</div>
              </Card>
            ))}
          </div>

          {/* Барометр группы: только агрегат, k-анонимность на бэкенде */}
          {dash.mood && (
            <Card style={{ borderLeft: `4px solid ${C.marker}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Барометр группы</div>
                {dash.mood.today_avg != null && (
                  <span style={{ fontFamily: fonts.mono, fontSize: 13, color: C.inkSoft }}>
                    сегодня: <b style={{ color: C.teal, fontSize: 16 }}>
                      {['⛈', '🌧', '⛅', '🌤', '☀️'][Math.round(dash.mood.today_avg) - 1]} {dash.mood.today_avg}
                    </b> / 5 ({dash.mood.today_count} отв.)
                    {dash.mood.week_avg != null && ` · неделя: ${dash.mood.week_avg}`}
                    {dash.mood.prev_week_avg != null && ` · прошлая: ${dash.mood.prev_week_avg}`}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: '8px 0 0' }}>{dash.mood.summary}</p>
            </Card>
          )}

          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Зона внимания</div>
            {dash.flags.length ? dash.flags.map((f, i) => (
              <div key={i} style={{ background: flagBg[f.level], borderLeft: `3.5px solid ${flagBorder[f.level]}`, borderRadius: '0 8px 8px 0', padding: '9px 12px', margin: '6px 0', fontSize: 13.5, lineHeight: 1.45 }}>
                {f.message}
              </div>
            )) : <p style={{ fontSize: 13.5, color: C.inkSoft }}>Флагов нет — группа идёт в темпе.</p>}
            <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
              Флаги строятся автоматически по метаданным: скорость прохождения, паузы в активности,
              отсутствие практик. Рекомендация: реагировать личным разговором, а не в общем чате.
            </p>
          </Card>

          <div style={{ fontWeight: 700, fontSize: 15 }}>Участники — {dash.members.length}</div>
          {dash.members.map((m) => <MemberCard key={m.user_id} m={m} />)}
          {!dash.members.length && (
            <p style={{ fontSize: 13.5, color: C.inkSoft }}>
              Пока никого. Отправьте ссылку-приглашение — участники появятся здесь.
            </p>
          )}
          <div>
            <Btn small variant="ghost" onClick={() => makeInvite(dash.group.id)}>ссылка-приглашение участника</Btn>
          </div>
          {invite && (
            <p style={{ fontFamily: fonts.mono, fontSize: 12, background: C.tealSoft, padding: 10, borderRadius: 8, wordBreak: 'break-all' }}>
              {invite}<br />
              <span style={{ color: C.inkSoft }}>Одноразовая, живёт 72 часа. Передайте лично.</span>
            </p>
          )}
        </>
      ) : (
        <>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, alignSelf: 'flex-start' }}>
            <span className="hl">Мои группы</span>
          </h2>
          {groups.map((g) => (
            <Card key={g.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 15.5 }}>{g.name}</strong>
                  <div style={{ fontFamily: fonts.mono, fontSize: 12, color: C.inkSoft, marginTop: 3 }}>
                    неделя {g.current_week} · участников: {g.members_count}
                  </div>
                </div>
                <Btn small onClick={() => openDash(g)}>Дашборд</Btn>
              </div>
            </Card>
          ))}
          {!groups.length && <p style={{ fontSize: 14, color: C.inkSoft }}>Групп пока нет — создайте первую.</p>}
          <form onSubmit={createGroup} style={{ display: 'flex', gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} required
                   placeholder="название новой группы" style={{ ...inputStyle, flex: 1 }} />
            <Btn type="submit">создать</Btn>
          </form>
        </>
      )}
    </div>
  )
}
