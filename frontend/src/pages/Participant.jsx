// Кабинет участника: Главная, Уроки, Дневник, Прогнозы, Встреча.
// Перенос интерфейса прототипа, данные — через API.
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

export default function Participant({ me }) {
  const [tab, setTab] = useState('home')
  const [lessons, setLessons] = useState([])
  const [activeLesson, setActiveLesson] = useState(null)
  const [journal, setJournal] = useState([])
  const [preds, setPreds] = useState([])
  const [calibration, setCalibration] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [newPred, setNewPred] = useState({ text: '', conf: 70 })
  const [newEntry, setNewEntry] = useState({ decision: '', args: '', expect: '', conf: 70, shared: false })
  const [journalErr, setJournalErr] = useState(null)
  const [predErr, setPredErr] = useState(null)

  const reload = useCallback(() => {
    api('/me/lessons').then(setLessons).catch(() => {})
    api('/me/journal').then(setJournal).catch(() => {})
    api('/me/predictions').then(setPreds).catch(() => {})
    api('/me/calibration').then(setCalibration).catch(() => {})
    api('/me/quiz/current').then(setQuiz).catch(() => {})
  }, [])
  useEffect(reload, [reload])

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

  const doneCount = lessons.filter((l) => l.completed).length
  const weekLessons = lessons.filter((l) => l.week === me.current_week)
  const nextLesson = weekLessons.find((l) => !l.completed && l.available)

  const tabs = [
    ['home', 'Главная'], ['lessons', 'Уроки'], ['journal', 'Дневник'],
    ['preds', 'Прогнозы'], ['meet', 'Встреча'],
  ]

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 80 }}>
      {/* ГЛАВНАЯ */}
      {tab === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ background: C.ink, color: C.white, border: 'none' }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 12, opacity: 0.65, letterSpacing: '.06em' }}>МОЯ КАЛИБРОВКА</div>
            <p style={{ fontSize: 13.5, opacity: 0.85, lineHeight: 1.5, margin: '6px 0 12px' }}>
              Главная метрика курса: совпадает ли ваша уверенность с реальностью.
            </p>
            <div style={{ background: C.white, borderRadius: 10, padding: 10 }}>
              <CalibrationChart points={calibration} />
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Tag>Сегодня</Tag>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>
                  {nextLesson ? `Урок ${nextLesson.ord}: ${nextLesson.title}` : 'Уроки недели пройдены'}
                </div>
                <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>
                  {nextLesson ? '≈ 10–15 минут' : 'Дальше — встреча группы'}
                </div>
              </div>
              {nextLesson && <Btn onClick={() => openLesson(nextLesson)}>Начать</Btn>}
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              [`${doneCount}/${weekLessons.length || 3}`, 'урока недели'],
              [journal.length, 'записей в дневнике'],
              [preds.length, 'прогнозов'],
            ].map(([v, l], i) => (
              <Card key={i} style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 22, fontWeight: 600, color: C.teal }}>{v}</div>
                <div style={{ fontSize: 11.5, color: C.inkSoft }}>{l}</div>
              </Card>
            ))}
          </div>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Калибровочный квиз недели</div>
                <div style={{ fontSize: 13, color: C.inkSoft }}>
                  {quiz?.attempted ? `Сдан: ${quiz.hits} из ${quiz.total}` : '5 вопросов · интервалы 90% · 4 минуты'}
                </div>
              </div>
              {!quiz?.attempted && quiz?.questions?.length > 0 && (
                <Btn variant="ghost" small onClick={() => { setShowQuiz(true); setTab('preds') }}>Пройти</Btn>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* УРОКИ */}
      {tab === 'lessons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeLesson ? (
            <>
              <button onClick={() => setActiveLesson(null)} style={{ background: 'none', border: 'none', color: C.teal, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: fonts.sans }}>← Все уроки</button>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{activeLesson.title}</h2>
              <LessonPlayer lesson={activeLesson} onJournal={addJournal} onDone={finishLesson} />
            </>
          ) : (
            <>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Модуль 1 · Наблюдение за мышлением</h2>
              {lessons.map((l) => (
                <Card key={l.id} style={{ opacity: l.available ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: fonts.mono, fontSize: 11, color: C.inkSoft }}>НЕДЕЛЯ {l.week} · УРОК {l.ord}</div>
                      <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 3 }}>{l.title}</div>
                    </div>
                    {l.completed ? <Tag>Пройден ✓</Tag>
                      : !l.available ? <Tag color={C.grid} text={C.inkSoft}>Позже</Tag>
                      : <Btn small onClick={() => openLesson(l)}>Открыть</Btn>}
                  </div>
                </Card>
              ))}
              <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>
                Уроки открываются по неделям программы. Полная карта: 36 уроков, 4 модуля, 12 недель.
              </p>
            </>
          )}
        </div>
      )}

      {/* ДНЕВНИК */}
      {tab === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Дневник решений</h2>
          <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, lineHeight: 1.5 }}>
            Личный. Никому не виден. На встречу попадает только то, что вы явно пометите «поделиться».
          </p>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={newEntry.decision} onChange={(e) => setNewEntry({ ...newEntry, decision: e.target.value })} placeholder="Какое решение принимаю" style={inputStyle} />
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

      {/* ПРОГНОЗЫ */}
      {tab === 'preds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Прогнозы и калибровка</h2>
          {showQuiz && quiz && !quiz.attempted ? (
            <Quiz week={quiz.week} questions={quiz.questions} onDone={() => { setShowQuiz(false); reload() }} />
          ) : (
            <>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Встреча недели {CARD1.week}</h2>
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
              onClick={() => { setTab(id); setActiveLesson(null); setShowQuiz(false) }}
              style={{
                flex: 1, padding: '13px 4px 15px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: fonts.sans, fontSize: 12.5,
                fontWeight: tab === id ? 700 : 500,
                color: tab === id ? C.teal : C.inkSoft,
                borderTop: tab === id ? `2.5px solid ${C.teal}` : '2.5px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
