// Вкладка «Встреча»: карточки всех 12 недель, общий контекст (каркас, правила,
// памятка сбоев) и журнал прошедших встреч с регистрацией артефактов.
import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { C, fonts, inputStyle } from '../tokens.js'
import { Btn, Card, Tag } from './ui.jsx'

const H = ({ children }) => (
  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, alignSelf: 'flex-start' }}>
    <span className="hl">{children}</span>
  </h2>
)

export default function MeetingTab({ activeWeek, sharedCount }) {
  const [data, setData] = useState(null)
  const [logs, setLogs] = useState([])
  const [week, setWeek] = useState(activeWeek || 1)
  const [showLogForm, setShowLogForm] = useState(false)
  const [form, setForm] = useState({ facilitator: '', summary: '', agreements: '', held_at: '' })
  const [err, setErr] = useState(null)

  const load = () => {
    api('/me/meetings').then(setData).catch(() => {})
    api('/me/meeting-logs').then(setLogs).catch(() => {})
  }
  useEffect(load, [])
  useEffect(() => { setWeek(activeWeek || 1) }, [activeWeek])

  if (!data) return <p style={{ color: C.inkSoft }}>Загружаю сценарии встреч…</p>

  const card = data.cards.find((c) => c.week === week)
  const log = logs.find((l) => l.week === week)
  const loggedWeeks = new Set(logs.map((l) => l.week))

  const submitLog = async () => {
    setErr(null)
    try {
      await api('/me/meeting-logs', {
        method: 'POST',
        body: JSON.stringify({
          week, facilitator: form.facilitator, summary: form.summary,
          agreements: form.agreements || null, held_at: form.held_at || null,
        }),
      })
      setForm({ facilitator: '', summary: '', agreements: '', held_at: '' })
      setShowLogForm(false)
      load()
    } catch (e) { setErr(e.message) }
  }

  const arrow = (dir) => (
    <button disabled={dir < 0 ? week <= 1 : week >= 12}
            onClick={() => setWeek(week + dir)}
            style={{ border: `1.5px solid ${C.grid}`, background: C.white, borderRadius: 10, padding: '8px 14px', fontFamily: fonts.mono, opacity: (dir < 0 ? week > 1 : week < 12) ? 1 : 0.4 }}>
      {dir < 0 ? '←' : '→'}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <H>Встречи группы</H>

      {/* Листалка недель */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {arrow(-1)}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: fonts.mono, fontWeight: 600, fontSize: 16 }}>
            Встреча {week} / 12 {loggedWeeks.has(week) && <span style={{ color: C.teal }}>✓</span>}
          </div>
          <div style={{ fontSize: 12, color: C.inkSoft }}>
            {loggedWeeks.has(week) ? 'проведена и зарегистрирована'
              : week === activeWeek ? 'текущая неделя' : week < activeWeek ? 'прошедшая (не зарегистрирована)' : 'предстоящая'}
          </div>
        </div>
        {arrow(1)}
      </div>

      {/* Сценарная карточка */}
      {card && (
        <Card style={{ borderLeft: `4px solid ${C.teal}` }} key={week}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <Tag>Сценарная карточка ведущего</Tag>
            <span style={{ fontFamily: fonts.mono, fontSize: 11, color: C.inkSoft }}>показывается ведущему за 2 дня</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, margin: '10px 0 4px' }}>{card.title}</div>
          {card.special && <div style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>{card.special}</div>}
          <div style={{ background: C.markerSoft, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, margin: '12px 0', lineHeight: 1.5 }}>
            <b>Цель:</b> {card.goal}
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 12.5, fontWeight: 600, color: C.teal, marginBottom: 8 }}>
            Упражнение недели: {card.exercise}
          </div>
          {card.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < card.steps.length - 1 ? `1px dashed ${C.grid}` : 'none' }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 12.5, color: C.teal, fontWeight: 600, minWidth: 18 }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
          {card.tips?.length > 0 && (
            <div style={{ marginTop: 12, background: C.paper, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: '.06em', color: C.inkSoft, marginBottom: 4 }}>ВЕДУЩЕМУ</div>
              {card.tips.map((t, i) => (
                <p key={i} style={{ fontSize: 13, fontStyle: 'italic', color: C.inkSoft, margin: '4px 0', lineHeight: 1.5 }}>{t}</p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Подготовка */}
      <Card style={{ borderLeft: `4px solid ${C.marker}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Подготовка к встрече {week}</div>
        {card?.prep && <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: '0 0 8px' }}>{card.prep}</p>}
        <p style={{ fontSize: 13, color: C.inkSoft, margin: 0 }}>
          Ваши материалы «поделиться с группой»: <b style={{ color: C.ink }}>{sharedCount}</b> шт. (вкладка «Дневник»)
        </p>
      </Card>

      {/* Журнал встречи этой недели */}
      {log ? (
        <Card style={{ background: C.tealSoft, border: `1.5px solid ${C.teal}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Артефакт встречи {log.week} ✓</div>
            <span style={{ fontFamily: fonts.mono, fontSize: 12, color: C.inkSoft }}>
              {log.held_at} · вёл(а): {log.facilitator}
            </span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 8, whiteSpace: 'pre-line' }}>{log.summary}</div>
          {log.agreements && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.teal}` }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: '.06em', color: C.inkSoft, marginBottom: 4 }}>ДОГОВОРЁННОСТИ</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{log.agreements}</div>
            </div>
          )}
          <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 8, fontFamily: fonts.mono }}>записал(а): {log.author}</div>
        </Card>
      ) : week <= activeWeek && (
        <Card>
          {!showLogForm ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Встреча прошла?</div>
                <div style={{ fontSize: 13, color: C.inkSoft }}>Зарегистрируйте артефакт: дата, ведущий, выводы, договорённости — общий документ группы</div>
              </div>
              <Btn small onClick={() => setShowLogForm(true)}>зарегистрировать</Btn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Артефакт встречи {week}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input style={{ ...inputStyle, flex: 2, minWidth: 160 }} placeholder="кто вёл встречу"
                       value={form.facilitator} onChange={(e) => setForm({ ...form, facilitator: e.target.value })} />
                <input style={{ ...inputStyle, flex: 1, minWidth: 130 }} type="date"
                       value={form.held_at} onChange={(e) => setForm({ ...form, held_at: e.target.value })} />
              </div>
              <textarea style={inputStyle} rows={3} placeholder="Ключевые выводы: что заметили, что сработало, главные находки"
                        value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              <textarea style={inputStyle} rows={2} placeholder="Договорённости (опционально): что решили пробовать, кто владелец, сроки"
                        value={form.agreements} onChange={(e) => setForm({ ...form, agreements: e.target.value })} />
              {err && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{err}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn disabled={!form.facilitator || !form.summary} onClick={submitLog}>сохранить</Btn>
                <Btn variant="ghost" onClick={() => setShowLogForm(false)}>отмена</Btn>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Прошедшие встречи (другие недели) */}
      {logs.filter((l) => l.week !== week).length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Журнал встреч</div>
          {logs.filter((l) => l.week !== week).map((l) => (
            <button key={l.id} onClick={() => setWeek(l.week)}
                    style={{ display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: `1px dashed ${C.grid}`, padding: '8px 2px', fontFamily: fonts.sans, fontSize: 13.5 }}>
              <span><b style={{ fontFamily: fonts.mono, color: C.teal }}>№{l.week}</b> · {l.facilitator}</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 12, color: C.inkSoft }}>{l.held_at} →</span>
            </button>
          ))}
        </Card>
      )}

      {/* Общий контекст */}
      <details>
        <summary style={{ fontFamily: fonts.mono, fontSize: 13, fontWeight: 600, color: C.teal, cursor: 'pointer', padding: '4px 0' }}>
          Каркас встречи, правила группы и памятка сбоев
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Стандартный каркас (75–90 минут)</div>
            {data.common.frame.map(([t, d], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: i < data.common.frame.length - 1 ? `1px dashed ${C.grid}` : 'none' }}>
                <span style={{ fontFamily: fonts.mono, fontSize: 12, color: C.teal, fontWeight: 600, minWidth: 92 }}>{t}</span>
                <span style={{ fontSize: 13, lineHeight: 1.45 }}>{d}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Правила группы (оборот каждой карточки)</div>
            {data.common.rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: 13.5, lineHeight: 1.5 }}>
                <span style={{ fontFamily: fonts.mono, color: C.teal, fontWeight: 600 }}>{i + 1}</span>
                <span>{r}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Типовые сбои — что делать ведущему</div>
            {data.common.failures.map(([sym, act], i) => (
              <div key={i} style={{ padding: '7px 0', borderBottom: i < data.common.failures.length - 1 ? `1px dashed ${C.grid}` : 'none' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{sym}</div>
                <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.45 }}>→ {act}</div>
              </div>
            ))}
          </Card>
        </div>
      </details>
    </div>
  )
}
