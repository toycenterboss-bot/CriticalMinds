// Кабинет участника: Главная (калибровка, барометр, вехи), Уроки (листалка недель
// с гейтингом «уроки+квиз»), Дневник, Прогнозы (+турнир), Встреча.
import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { C, fonts, inputStyle } from '../tokens.js'
import { Btn, Card, Tag } from '../components/ui.jsx'
import LessonPlayer from '../components/LessonPlayer.jsx'
import CalibrationChart from '../components/CalibrationChart.jsx'
import Quiz from '../components/Quiz.jsx'
import { CARD1 } from '../data/meeting.js'

// Мягкая клиентская проверка (жёсткая — на бэкенде, schemas.clean_text)
export const validateEntry = (e) => {
  const d = (e.decision || '').trim()
  if (d.length < 8) return 'Решение: минимум 8 символов — опишите словами'
  if ([...d].filter((ch) => ch.toLowerCase() !== ch.toUpperCase()).length < 5)
    return 'Решение: похоже на набор символов — нужна осмысленная запись'
  return null
}

const MOODS = [
  [1, '⛈', 'гроза'], [2, '🌧', 'дождь'], [3, '⛅', 'переменно'],
  [4, '🌤', 'ясно'], [5, '☀️', 'солнце'],
]

// Заголовок раздела с маркерным выделением
const H = ({ children }) => (
  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, alignSelf: 'flex-start' }}>
    <span className="hl">{children}</span>
  </h2>
)

// Прогресс-кольцо недели: уроки + квиз как шаги
function Ring({ done, total, size = 92 }) {
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  const frac = total ? done / total : 0
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.grid} strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.teal} strokeWidth="7"
              strokeLinecap="round" strokeDasharray={c}
              strokeDashoffset={c * (1 - frac)}
              style={{ transition: 'stroke-dashoffset .6s ease' }} />
    </svg>
  )
}

// Карта программы: 12 недель одной строкой
function WeekMap({ weeks, current, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {weeks.map((w) => {
        const state = w.completed ? 'done' : w.unlocked ? 'open' : 'locked'
        return (
          <button key={w.week} onClick={() => onPick(w.week)} title={`Неделя ${w.week}`}
                  style={{
                    flex: 1, height: 26, borderRadius: 6, fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 600,
                    border: w.week === current ? `2px solid ${C.ink}` : `1.5px solid ${state === 'locked' ? C.grid : C.teal}`,
                    background: state === 'done' ? C.teal : state === 'open' ? C.tealSoft : C.white,
                    color: state === 'done' ? C.white : state === 'open' ? C.teal : C.inkSoft,
                    opacity: state === 'locked' ? 0.6 : 1,
                  }}>
            {state === 'done' ? '✓' : w.week}
          </button>
        )
      })}
    </div>
  )
}

const NAV_ICONS = {
  home: 'M3 10.5 10 4l7 6.5M5 9v7h10V9',
  lessons: 'M4 4h9a3 3 0 0 1 3 3v9H7a3 3 0 0 1-3-3V4Zm0 0v9a3 3 0 0 1 3 3',
  journal: 'M5 3h8l3 3v11H5V3Zm8 0v3h3M8 9h6M8 12h6',
  preds: 'M3 16 8 10l3 3 6-8M13 5h4v4',
  meet: 'M7 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm6 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 16c.5-3 2.5-4.5 4.5-4.5s4 1.5 4.5 4.5m.5-4.5c2 0 4 1.5 4.5 4.5',
}

export default function Participant({ me }) {
  const [tab, setTab] = useState('home')
  const [lessons, setLessons] = useState([])
  const [weeks, setWeeks] = useState([])
  const [viewWeek, setViewWeek] = useState(null)
  const [activeLesson, setActiveLesson] = useState(null)
  const [journal, setJournal] = useState([])
  const [preds, setPreds] = useState([])
  const [calibration, setCalibration] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [tournament, setTournament] = useState(null)
  const [mood, setMood] = useState(null)
  const [materials, setMaterials] = useState([])
  const [showQuiz, setShowQuiz] = useState(false)
  const [newPred, setNewPred] = useState({ text: '', conf: 70 })
  const [newEntry, setNewEntry] = useState({ decision: '', args: '', expect: '', conf: 70, shared: false })
  const [journalErr, setJournalErr] = useState(null)
  const [predErr, setPredErr] = useState(null)

  const reload = useCallback(() => {
    api('/me/lessons').then(setLessons).catch(() => {})
    api('/me/weeks').then(setWeeks).catch(() => {})
    api('/me/journal').then(setJournal).catch(() => {})
    api('/me/predictions').then(setPreds).catch(() => {})
    api('/me/calibration').then(setCalibration).catch(() => {})
    api('/me/quiz/current').then(setQuiz).catch(() => {})
    api('/me/tournament').then(setTournament).catch(() => {})
    api('/me/mood').then(setMood).catch(() => {})
    api('/me/materials').then(setMaterials).catch(() => {})
  }, [])
  useEffect(reload, [reload])

  const activeWeek = weeks.filter((w) => w.unlocked).map((w) => w.week).pop() || 1
  const shownWeek = viewWeek || activeWeek
  const ws = weeks.find((w) => w.week === shownWeek)
  const lastCompleted = weeks.filter((w) => w.completed).map((w) => w.week).pop() || null
  const lastCompletedWs = weeks.find((w) => w.week === lastCompleted)

  const openLesson = async (l) => {
    const full = await api(`/me/lessons/${l.id}`)
    await api(`/me/lessons/${l.id}/start`, { method: 'POST' })
    setActiveLesson(full)
    setTab('lessons')
  }

  const finishLesson = async () => {
    await api(`/me/lessons/${activeLesson.id}/complete`, { method: 'POST' })
    setActiveLesson(null)
    reload()
  }

  const addJournal = async (e) => {
    const clientErr = validateEntry(e)
    if (clientErr) throw new Error(clientErr)
    await api('/me/journal', {
      method: 'POST',
      body: JSON.stringify({
        decision: e.decision, args: e.args || null, expect: e.expect || null,
        confidence: e.conf, label: e.tag || 'запись', shared: !!e.shared,
      }),
    })
    reload()
  }

  const addPred = async () => {
    setPredErr(null)
    try {
      await api('/me/predictions', {
        method: 'POST',
        body: JSON.stringify({ text: newPred.text, confidence: newPred.conf }),
      })
      setNewPred({ text: '', conf: 70 })
      reload()
    } catch (err) { setPredErr(err.message) }
  }

  const resolvePred = async (id, outcome) => {
    await api(`/me/predictions/${id}/resolve`, {
      method: 'POST', body: JSON.stringify({ outcome }),
    })
    reload()
  }

  const setMoodScore = async (score) => {
    setMood(await api('/me/mood', { method: 'POST', body: JSON.stringify({ score }) }))
  }

  const weekLessons = lessons.filter((l) => l.week === shownWeek)
  const activeWeekLessons = lessons.filter((l) => l.week === activeWeek)
  const nextLesson = activeWeekLessons.find((l) => !l.completed)
  const activeWs = weeks.find((w) => w.week === activeWeek)

  const tabs = [
    ['home', 'Главная'], ['lessons', 'Уроки'], ['journal', 'Дневник'],
    ['preds', 'Прогнозы'], ['meet', 'Встреча'],
  ]

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 80 }}>
      {/* ГЛАВНАЯ */}
      {tab === 'home' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Вехи и пульс группы */}
          {lastCompletedWs && lastCompletedWs.i_was_first && lastCompletedWs.group_size > 1 && (
            <Card style={{ borderLeft: `4px solid ${C.marker}`, background: C.markerSoft }}>
              <b>🏁 Поздравляем — вы первым в группе завершили неделю {lastCompletedWs.week}!</b>
            </Card>
          )}
          {lastCompletedWs && !(lastCompletedWs.i_was_first && lastCompletedWs.group_size > 1) && (
            <Card style={{ borderLeft: `4px solid ${C.teal}` }}>
              <b>Неделя {lastCompletedWs.week} завершена ✓</b>
              {activeWeek > lastCompletedWs.week && ' Открыта неделя ' + activeWeek + '.'}
            </Card>
          )}
          {activeWs && activeWs.group_size > 1 && activeWs.group_completed > 0 && !activeWs.completed && (
            <Card style={{ padding: 12 }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 13, color: C.inkSoft }}>
                {activeWs.group_completed} из {activeWs.group_size} участников уже завершили неделю {activeWeek}
              </span>
            </Card>
          )}

          {/* Барометр настроения */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Как вы сегодня?</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft }}>
                  Куратор видит только среднее по группе, не ваш ответ
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {MOODS.map(([score, icon, label]) => (
                  <button key={score} title={label} onClick={() => setMoodScore(score)}
                          style={{
                            fontSize: 22, padding: '6px 8px', cursor: 'pointer', borderRadius: 10,
                            border: mood?.today === score ? `2px solid ${C.teal}` : `1.5px solid ${C.grid}`,
                            background: mood?.today === score ? C.tealSoft : C.white,
                          }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card style={{ background: C.ink, color: C.white, border: 'none' }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 12, opacity: 0.65, letterSpacing: '.06em' }}>МОЯ КАЛИБРОВКА</div>
            <p style={{ fontSize: 13.5, opacity: 0.85, lineHeight: 1.5, margin: '6px 0 12px' }}>
              Главная метрика курса: совпадает ли ваша уверенность с реальностью.
            </p>
            <div style={{ background: C.white, borderRadius: 10, padding: 10 }}>
              <CalibrationChart points={calibration} />
            </div>
          </Card>

          {/* HERO: текущая неделя с прогресс-кольцом */}
          <Card style={{ padding: 22 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
                <Ring done={(activeWs?.lessons_done || 0) + (activeWs?.quiz_attempted ? 1 : 0)}
                      total={(activeWs?.lessons_total || 3) + 1} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{activeWeek}</span>
                  <span style={{ fontFamily: fonts.mono, fontSize: 9, letterSpacing: '.1em', color: C.inkSoft }}>НЕДЕЛЯ</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: '.06em', color: C.inkSoft, textTransform: 'uppercase' }}>
                  Сегодня в программе
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, margin: '6px 0 2px', lineHeight: 1.3 }}>
                  {nextLesson ? `Урок ${nextLesson.ord}: ${nextLesson.title}`
                    : !activeWs?.quiz_attempted ? 'Уроки пройдены — остался квиз недели'
                    : 'Неделя завершена'}
                </div>
                <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 12 }}>
                  {nextLesson ? '≈ 10 минут' : !activeWs?.quiz_attempted ? '5 вопросов · 4 минуты' : 'Дальше — встреча группы'}
                </div>
                {nextLesson
                  ? <Btn onClick={() => openLesson(nextLesson)}>Начать урок</Btn>
                  : !activeWs?.quiz_attempted && quiz?.questions?.length > 0
                    ? <Btn onClick={() => { setShowQuiz(true); setTab('preds') }}>Пройти квиз</Btn>
                    : null}
              </div>
            </div>
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px dashed ${C.grid}` }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: '.08em', color: C.inkSoft, marginBottom: 7 }}>КАРТА ПРОГРАММЫ · 12 НЕДЕЛЬ</div>
              <WeekMap weeks={weeks} current={activeWeek} onPick={(w) => { setViewWeek(w); setTab('lessons') }} />
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              [`${activeWs ? activeWs.lessons_done : 0}/${activeWs ? activeWs.lessons_total : 3}`, `уроков недели ${activeWeek}`],
              [journal.length, 'записей в дневнике'],
              [preds.length, 'прогнозов'],
            ].map(([v, l], i) => (
              <Card key={i} style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 600, color: C.teal }}>{v}</div>
                <div style={{ fontSize: 11.5, color: C.inkSoft }}>{l}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* УРОКИ: листалка недель */}
      {tab === 'lessons' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeLesson ? (
            <>
              <button onClick={() => setActiveLesson(null)} style={{ background: 'none', border: 'none', color: C.teal, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: fonts.sans }}>← Все уроки</button>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{activeLesson.title}</h2>
              <LessonPlayer lesson={activeLesson} onJournal={addJournal} onDone={finishLesson} />
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button disabled={shownWeek <= 1} onClick={() => setViewWeek(shownWeek - 1)}
                        style={{ border: `1.5px solid ${C.grid}`, background: C.white, borderRadius: 10, padding: '8px 14px', cursor: shownWeek > 1 ? 'pointer' : 'default', fontFamily: fonts.mono, opacity: shownWeek > 1 ? 1 : 0.4 }}>←</button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: fonts.mono, fontWeight: 600, fontSize: 16 }}>
                    Неделя {shownWeek} / 12 {ws && !ws.unlocked && '🔒'}
                  </div>
                  <div style={{ fontSize: 12, color: C.inkSoft }}>
                    {ws?.completed ? 'завершена ✓'
                      : ws?.unlocked ? `уроки ${ws.lessons_done}/${ws.lessons_total}${ws.quiz_attempted ? ' · квиз ✓' : ' · квиз —'}`
                      : 'откроется после завершения предыдущей недели (уроки + квиз)'}
                  </div>
                </div>
                <button disabled={shownWeek >= 12} onClick={() => setViewWeek(shownWeek + 1)}
                        style={{ border: `1.5px solid ${C.grid}`, background: C.white, borderRadius: 10, padding: '8px 14px', cursor: shownWeek < 12 ? 'pointer' : 'default', fontFamily: fonts.mono, opacity: shownWeek < 12 ? 1 : 0.4 }}>→</button>
              </div>

              {weekLessons.map((l) => (
                <Card key={l.id} style={{ opacity: l.available ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: fonts.mono, fontSize: 11, color: C.inkSoft }}>УРОК {l.week}.{l.ord}</div>
                      <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 3 }}>{l.title}</div>
                    </div>
                    {l.completed ? <Tag>Пройден ✓</Tag>
                      : !l.available ? <Tag color={C.grid} text={C.inkSoft}>🔒</Tag>
                      : <Btn small onClick={() => openLesson(l)}>Открыть</Btn>}
                  </div>
                </Card>
              ))}

              {(() => {
                const mat = materials.find((m) => m.week === shownWeek)
                if (!mat || !ws?.unlocked) return null
                return (
                  <Card style={{ borderLeft: `4px solid ${C.inkSoft}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <div>
                        <Tag color={C.paper} text={C.inkSoft}>Оффлайн-задание</Tag>
                        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 8 }}>{mat.title}</div>
                      </div>
                      {mat.done && <Tag>Выполнено ✓</Tag>}
                    </div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.55, color: C.inkSoft, margin: '8px 0 10px' }}>{mat.body}</p>
                    {mat.links.map((lnk, i) => (
                      <div key={i} style={{ padding: '7px 0', borderTop: i > 0 ? `1px dashed ${C.grid}` : 'none' }}>
                        <a href={lnk.url} target="_blank" rel="noreferrer"
                           style={{ color: C.teal, fontWeight: 600, fontSize: 14 }}>
                          {lnk.title} ↗
                        </a>
                        {lnk.note && <div style={{ fontSize: 12.5, color: C.inkSoft }}>{lnk.note}</div>}
                      </div>
                    ))}
                    <div style={{ marginTop: 10 }}>
                      <Btn small variant={mat.done ? 'ghost' : 'primary'}
                           onClick={async () => { await api(`/me/materials/${mat.week}/done`, { method: 'POST' }); reload() }}>
                        {mat.done ? 'снять отметку' : 'отметить выполненным'}
                      </Btn>
                    </div>
                  </Card>
                )
              })()}

              {ws?.unlocked && !ws?.quiz_attempted && ws?.lessons_done === ws?.lessons_total && (
                <Card style={{ borderLeft: `4px solid ${C.marker}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b>Калибровочный квиз недели {shownWeek}</b>
                      <div style={{ fontSize: 13, color: C.inkSoft }}>Завершает неделю и открывает следующую</div>
                    </div>
                    <Btn small onClick={() => { setShowQuiz(true); setTab('preds') }}>Пройти</Btn>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ДНЕВНИК */}
      {tab === 'journal' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <H>Дневник решений</H>
          <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>
            Личный. Никому не виден. На встречу попадает только то, что вы явно пометите «поделиться».
          </p>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={newEntry.decision} onChange={(e) => setNewEntry({ ...newEntry, decision: e.target.value })} placeholder="Какое решение принимаю (мин. 8 символов)" style={inputStyle} />
              <textarea value={newEntry.args} onChange={(e) => setNewEntry({ ...newEntry, args: e.target.value })} placeholder="Ключевые аргументы (2–3)" rows={2} style={inputStyle} />
              <input value={newEntry.expect} onChange={(e) => setNewEntry({ ...newEntry, expect: e.target.value })} placeholder="Чего ожидаю" style={inputStyle} />
              <label style={{ fontFamily: fonts.mono, fontSize: 13, color: C.inkSoft }}>
                Уверенность: <b style={{ color: C.teal }}>{newEntry.conf}%</b>
                <input type="range" min="50" max="99" value={newEntry.conf} onChange={(e) => setNewEntry({ ...newEntry, conf: +e.target.value })} style={{ width: '100%', accentColor: C.teal }} />
              </label>
              <label style={{ fontSize: 13.5, display: 'flex', gap: 8, alignItems: 'center', color: C.inkSoft }}>
                <input type="checkbox" checked={newEntry.shared} onChange={(e) => setNewEntry({ ...newEntry, shared: e.target.checked })} style={{ accentColor: C.teal }} />
                Поделиться с группой на встрече
              </label>
              {journalErr && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{journalErr}</p>}
              <Btn disabled={!newEntry.decision} onClick={async () => {
                setJournalErr(null)
                try {
                  await addJournal({ ...newEntry, tag: 'запись' })
                  setNewEntry({ decision: '', args: '', expect: '', conf: 70, shared: false })
                } catch (err) { setJournalErr(err.message) }
              }}>
                Записать
              </Btn>
            </div>
          </Card>
          {journal.map((e) => {
            const [first, ...rest] = e.text.split('\n')
            return (
              <Card key={e.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <Tag>{e.label || 'запись'}</Tag>
                    {e.shared && <Tag color={C.markerSoft} text={C.ink}>к встрече</Tag>}
                  </span>
                  <span style={{ fontFamily: fonts.mono, fontSize: 11.5, color: C.inkSoft }}>
                    {new Date(e.created_at).toLocaleDateString('ru')}{e.confidence != null ? ` · ${e.confidence}%` : ''}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, margin: '8px 0 4px' }}>{first}</div>
                {rest.map((r, i) => <div key={i} style={{ fontSize: 13.5, color: C.inkSoft }}>{r}</div>)}
              </Card>
            )
          })}
          {!journal.length && <p style={{ fontSize: 14, color: C.inkSoft }}>Пока пусто. Первая запись создаётся в уроке 3 — или прямо здесь.</p>}
        </div>
      )}

      {/* ПРОГНОЗЫ + ТУРНИР */}
      {tab === 'preds' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <H>Прогнозы и калибровка</H>
          {showQuiz && quiz && !quiz.attempted ? (
            <Quiz week={quiz.week} questions={quiz.questions} onDone={() => { setShowQuiz(false); reload() }} />
          ) : (
            <>
              {/* Турнир недели: я — явно, остальные — точки без имён */}
              {tournament && (tournament.my_hits !== null || tournament.others_hits.length > 0) && (
                <Card>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    Турнир калибровки · неделя {tournament.week}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 10 }}>
                    Попадания при заявленных 90%. Вы — явно, остальные — без имён.
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    {Array.from({ length: tournament.total + 1 }, (_, h) => {
                      const others = tournament.others_hits.filter((x) => x === h).length
                      const isMe = tournament.my_hits === h
                      return (
                        <div key={h} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 3, minHeight: 64 }}>
                            {Array.from({ length: others }, (_, i) => (
                              <span key={i} style={{ width: 10, height: 10, borderRadius: 10, background: C.teal, opacity: 0.55 }} />
                            ))}
                            {isMe && (
                              <span style={{ fontFamily: fonts.mono, fontSize: 10, fontWeight: 600, background: C.marker, border: `1.5px solid ${C.ink}`, borderRadius: 8, padding: '2px 6px' }}>вы</span>
                            )}
                          </div>
                          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: C.inkSoft, borderTop: `1px solid ${C.grid}`, paddingTop: 4, marginTop: 4 }}>{h}</div>
                        </div>
                      )
                    })}
                  </div>
                  {tournament.my_hits === null && (
                    <p style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 8 }}>Вы ещё не сдали квиз этой недели — на поле только точки группы.</p>
                  )}
                </Card>
              )}

              <Card>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Новый прогноз</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={newPred.text} onChange={(e) => setNewPred({ ...newPred, text: e.target.value })} placeholder="Проверяемое событие: «релиз X выйдет до 15.08»" style={inputStyle} />
                  <label style={{ fontFamily: fonts.mono, fontSize: 13, color: C.inkSoft }}>
                    Вероятность, что сбудется: <b style={{ color: C.teal }}>{newPred.conf}%</b>
                    <input type="range" min="5" max="95" step="5" value={newPred.conf} onChange={(e) => setNewPred({ ...newPred, conf: +e.target.value })} style={{ width: '100%', accentColor: C.teal }} />
                  </label>
                  {predErr && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{predErr}</p>}
                  <Btn disabled={!newPred.text} onClick={addPred}>Поставить</Btn>
                </div>
              </Card>
              {preds.map((p) => (
                <Card key={p.id}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.text}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontFamily: fonts.mono, fontSize: 12.5, color: C.teal, fontWeight: 600 }}>{p.confidence}%</span>
                    {p.resolved_at === null ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn small variant="ghost" onClick={() => resolvePred(p.id, true)}>Сбылось</Btn>
                        <Btn small variant="ghost" onClick={() => resolvePred(p.id, false)}>Нет</Btn>
                      </div>
                    ) : (
                      <Tag color={p.outcome ? C.tealSoft : C.redSoft} text={p.outcome ? C.teal : C.red}>
                        {p.outcome ? 'Сбылось' : 'Не сбылось'}
                      </Tag>
                    )}
                  </div>
                </Card>
              ))}
              {!preds.length && <p style={{ fontSize: 14, color: C.inkSoft }}>Норма недели 1: 2–3 прогноза. Хороший прогноз через месяц можно однозначно проверить.</p>}
            </>
          )}
        </div>
      )}

      {/* ВСТРЕЧА */}
      {tab === 'meet' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <H>Встреча недели {CARD1.week}</H>
          <Card style={{ borderLeft: `4px solid ${C.teal}` }}>
            <Tag>Сценарная карточка ведущего</Tag>
            <div style={{ fontWeight: 700, fontSize: 17, margin: '10px 0 4px' }}>{CARD1.title}</div>
            <div style={{ fontSize: 13, color: C.inkSoft }}>{CARD1.lead}</div>
            <div style={{ background: C.markerSoft, borderRadius: 10, padding: '10px 14px', fontSize: 13.5, margin: '12px 0', lineHeight: 1.5 }}>
              <b>Цель:</b> {CARD1.goal}
            </div>
            {CARD1.timeline.map(([t, d], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < CARD1.timeline.length - 1 ? `1px dashed ${C.grid}` : 'none' }}>
                <span style={{ fontFamily: fonts.mono, fontSize: 12.5, color: C.teal, fontWeight: 600, minWidth: 44 }}>{t}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>{d}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 13, fontStyle: 'italic', color: C.inkSoft }}>
              Фраза-камертон, если группа зажата: {CARD1.phrase}
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Правила группы (оборот карточки)</div>
            {CARD1.rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', fontSize: 14 }}>
                <span style={{ fontFamily: fonts.mono, color: C.teal, fontWeight: 600 }}>{i + 1}</span>
                <span>{r}</span>
              </div>
            ))}
          </Card>
          <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
            «Что принести на встречу» — записи с пометкой «поделиться»: {journal.filter((e) => e.shared).length} шт.
          </p>
        </div>
      )}

      {/* НИЖНЯЯ НАВИГАЦИЯ */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.grid}`, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', maxWidth: 560, width: '100%' }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className="navtab"
              onClick={() => { setTab(id); setActiveLesson(null); setShowQuiz(false); setViewWeek(null) }}
              style={{
                flex: 1, padding: '9px 4px 11px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: fonts.sans, fontSize: 11.5,
                fontWeight: tab === id ? 700 : 500,
                color: tab === id ? C.teal : C.inkSoft,
                borderTop: tab === id ? `2.5px solid ${C.teal}` : '2.5px solid transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                   stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={NAV_ICONS[id]} />
              </svg>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
