// Движок урока — прямой перенос из прототипа.
// Урок приходит из API: {id, week, ord, title, steps}. Шесть типов шагов:
// hookNumber | hookChoice | concept | check | firstEntry | transfer
import React, { useState } from 'react'
import { C, fonts, inputStyle } from '../tokens.js'
import { Btn, Card, Tag } from './ui.jsx'

export default function LessonPlayer({ lesson, onDone, onJournal }) {
  const [step, setStep] = useState(0)
  const [numAns, setNumAns] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [choice, setChoice] = useState(null)
  const [checkSel, setCheckSel] = useState({})
  const [checkDone, setCheckDone] = useState(false)
  const [entry, setEntry] = useState({ decision: '', args: '', expect: '', conf: 70 })
  const [entrySaved, setEntrySaved] = useState(false)
  const [entryErr, setEntryErr] = useState(null)
  const [freeText, setFreeText] = useState('')

  const s = lesson.steps[step]
  const next = () => {
    setRevealed(false); setChoice(null); setCheckSel({}); setCheckDone(false)
    setNumAns(''); setFreeText(''); setEntryErr(null)
    if (step < lesson.steps.length - 1) setStep(step + 1)
    else onDone()
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Tag>Урок {lesson.ord} · шаг {step + 1}/{lesson.steps.length}</Tag>
        <div style={{ display: 'flex', gap: 4 }}>
          {lesson.steps.map((_, i) => (
            <div key={i} style={{ width: 22, height: 4, borderRadius: 2, background: i <= step ? C.teal : C.grid }} />
          ))}
        </div>
      </div>

      {s.type === 'hookNumber' && (
        <div>
          <Tag color={C.marker} text={C.ink}>Крючок</Tag>
          <p style={{ fontSize: 16, lineHeight: 1.55, margin: '12px 0' }}>{s.prompt}</p>
          {!revealed ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={numAns}
                onChange={(e) => setNumAns(e.target.value.replace(/[^\d]/g, ''))}
                placeholder={s.placeholder}
                style={{ fontFamily: fonts.mono, fontSize: 18, padding: '10px 14px', border: `1.5px solid ${C.ink}`, borderRadius: 10, width: 110, background: C.paper }}
              />
              <Btn onClick={() => setRevealed(true)} disabled={!numAns}>Ответить</Btn>
            </div>
          ) : (
            <div>
              <div style={{ background: Number(numAns) === s.correct ? C.tealSoft : C.markerSoft, borderLeft: `4px solid ${Number(numAns) === s.correct ? C.teal : C.marker}`, padding: '12px 16px', borderRadius: '0 10px 10px 0', fontSize: 15, lineHeight: 1.55 }}>
                {Number(numAns) === s.correct ? s.revealCorrect : s.revealTrap}
              </div>
              <div style={{ marginTop: 14 }}><Btn onClick={next}>Дальше</Btn></div>
            </div>
          )}
        </div>
      )}

      {s.type === 'hookChoice' && (
        <div>
          <Tag color={C.marker} text={C.ink}>Крючок</Tag>
          <p style={{ fontSize: 16, lineHeight: 1.55, margin: '12px 0' }}>{s.prompt}</p>
          {choice === null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.options.map((o, i) => (
                <button key={i} onClick={() => setChoice(i)} style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${C.grid}`, background: C.white, fontSize: 14.5, cursor: 'pointer', fontFamily: fonts.sans }}>
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ background: C.markerSoft, borderLeft: `4px solid ${C.marker}`, padding: '12px 16px', borderRadius: '0 10px 10px 0', fontSize: 15, lineHeight: 1.55 }}>
                {s.reveal}
              </div>
              <div style={{ marginTop: 14 }}><Btn onClick={next}>Дальше</Btn></div>
            </div>
          )}
        </div>
      )}

      {s.type === 'hookText' && (
        <div>
          <Tag color={C.marker} text={C.ink}>Крючок</Tag>
          <p style={{ fontSize: 16, lineHeight: 1.55, margin: '12px 0', whiteSpace: 'pre-line' }}>{s.prompt}</p>
          {!revealed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)}
                        placeholder={s.placeholder} rows={4} style={inputStyle} />
              <div><Btn onClick={() => setRevealed(true)} disabled={freeText.trim().length < 5}>Готово</Btn></div>
            </div>
          ) : (
            <div>
              <div style={{ background: C.markerSoft, borderLeft: `4px solid ${C.marker}`, padding: '12px 16px', borderRadius: '0 10px 10px 0', fontSize: 15, lineHeight: 1.55 }}>
                {s.reveal}
              </div>
              <div style={{ marginTop: 14 }}><Btn onClick={next}>Дальше</Btn></div>
            </div>
          )}
        </div>
      )}

      {s.type === 'concept' && (
        <div>
          <Tag>Концепт</Tag>
          <h3 style={{ fontFamily: fonts.sans, fontWeight: 700, fontSize: 17, margin: '12px 0', color: C.ink }}>{s.title}</h3>
          {s.body.split('\n\n').map((p, i) => (
            <p key={i} style={{ fontSize: 15, lineHeight: 1.62, color: C.ink, margin: '0 0 12px' }}>{p}</p>
          ))}
          <Btn onClick={next}>Понятно, дальше</Btn>
        </div>
      )}

      {s.type === 'check' && (() => {
        const isRight = (o, i) => !!checkSel[i] === o.ok
        const rightCount = s.options.filter((o, i) => isRight(o, i)).length
        return (
          <div>
            <Tag>Проверка</Tag>
            <p style={{ fontSize: 15.5, fontWeight: 600, margin: '12px 0' }}>{s.prompt}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.options.map((o, i) => {
                const sel = checkSel[i]
                const right = isRight(o, i)
                // Разметка после проверки — однозначная:
                //  · верный вариант: зелёный, «✓ верно» (пропущенный верный — красный «✗ пропущен»)
                //  · выбранный неверный: красный, «✗ лишний»
                //  · невыбранный неверный: нейтральный, без пометки
                // Цвет и подпись ВСЕГДА про ответ пользователя, не про «правильность
                // варианта вообще»: зелёное = вы здесь были правы, красное = ошиблись.
                let border = `1.5px solid ${sel ? C.ink : C.grid}`
                let bg = sel ? C.paper : C.white
                let mark = ''
                let markColor = C.inkSoft
                if (checkDone) {
                  if (s.labels) {
                    const chosen = sel ? s.labels[0] : s.labels[1]
                    const correct = o.ok ? s.labels[0] : s.labels[1]
                    border = `2px solid ${right ? C.teal : C.red}`
                    bg = right ? C.tealSoft : C.redSoft
                    mark = right
                      ? `ваш ответ: ${chosen} ✓`
                      : `ваш ответ: ${chosen} ✗ · верно: ${correct}`
                    markColor = right ? C.teal : C.red
                  } else if (o.ok && sel) {
                    border = `2px solid ${C.teal}`; bg = C.tealSoft
                    mark = 'ваш ответ: выбран ✓'; markColor = C.teal
                  } else if (o.ok && !sel) {
                    border = `2px solid ${C.red}`; bg = C.redSoft
                    mark = 'ваш ответ: не выбран ✗ · надо было выбрать'; markColor = C.red
                  } else if (!o.ok && sel) {
                    border = `2px solid ${C.red}`; bg = C.redSoft
                    mark = 'ваш ответ: выбран ✗ · выбирать не стоило'; markColor = C.red
                  } else {
                    border = `2px solid ${C.teal}`; bg = C.tealSoft
                    mark = 'ваш ответ: не выбран ✓'; markColor = C.teal
                  }
                }
                return (
                  <div key={i}>
                    <button
                      onClick={() => !checkDone && setCheckSel({ ...checkSel, [i]: !sel })}
                      style={{
                        width: '100%', textAlign: 'left', padding: '11px 15px', borderRadius: 10, fontSize: 14.5, cursor: 'pointer',
                        fontFamily: fonts.sans, border, background: bg,
                      }}
                    >
                      {!s.labels && (
                        <span style={{ fontFamily: fonts.mono, marginRight: 8, color: sel ? C.teal : C.inkSoft }}>
                          {sel ? '■' : '▢'}
                        </span>
                      )}
                      {o.t}
                      <span style={{ float: 'right', fontFamily: fonts.mono, fontSize: 11, fontWeight: 600, color: markColor, marginLeft: 8 }}>
                        {checkDone ? mark : s.labels ? (sel ? s.labels[0] : s.labels[1]) : ''}
                      </span>
                    </button>
                    {checkDone && (
                      <p style={{ fontSize: 13, color: C.inkSoft, margin: '5px 4px 0', lineHeight: 1.5 }}>{o.fb}</p>
                    )}
                  </div>
                )
              })}
            </div>
            {s.labels && !checkDone && (
              <p style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 8 }}>
                Нажатие переключает: {s.labels[0]} / {s.labels[1]}. Отметьте все как «{s.labels[0]}», что считаете фактами.
              </p>
            )}
            {checkDone && (
              <div style={{ marginTop: 12, fontFamily: fonts.mono, fontSize: 13, fontWeight: 600, color: rightCount === s.options.length ? C.teal : C.red }}>
                Верно: {rightCount} из {s.options.length}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              {!checkDone ? <Btn onClick={() => setCheckDone(true)}>Проверить</Btn> : <Btn onClick={next}>Дальше</Btn>}
            </div>
          </div>
        )
      })()}

      {s.type === 'firstEntry' && (
        <div>
          <Tag>Практика</Tag>
          <p style={{ fontSize: 15.5, fontWeight: 600, margin: '12px 0' }}>{s.prompt}</p>
          {!entrySaved ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={entry.decision} onChange={(e) => setEntry({ ...entry, decision: e.target.value })} placeholder="Какое решение принимаю" style={inputStyle} />
              <textarea value={entry.args} onChange={(e) => setEntry({ ...entry, args: e.target.value })} placeholder="Ключевые аргументы (2–3)" rows={2} style={inputStyle} />
              <input value={entry.expect} onChange={(e) => setEntry({ ...entry, expect: e.target.value })} placeholder="Чего ожидаю в результате" style={inputStyle} />
              <label style={{ fontFamily: fonts.mono, fontSize: 13, color: C.inkSoft }}>
                Уверенность: <b style={{ color: C.teal }}>{entry.conf}%</b>
                <input type="range" min="50" max="99" value={entry.conf} onChange={(e) => setEntry({ ...entry, conf: +e.target.value })} style={{ width: '100%', accentColor: C.teal }} />
              </label>
              {entryErr && <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{entryErr}</p>}
              <Btn disabled={!entry.decision} onClick={async () => {
                setEntryErr(null)
                try {
                  await onJournal({ ...entry, tag: 'Урок 3 · первая запись' })
                  setEntrySaved(true)
                } catch (err) { setEntryErr(err.message) }
              }}>
                Сохранить в дневник
              </Btn>
            </div>
          ) : (
            <div>
              <div style={{ background: C.tealSoft, borderLeft: `4px solid ${C.teal}`, padding: '12px 16px', borderRadius: '0 10px 10px 0', fontSize: 15 }}>
                Записано. Через несколько недель эта запись станет материалом для аудита — и вы удивитесь, читая её.
              </div>
              <div style={{ marginTop: 14 }}><Btn onClick={next}>Дальше</Btn></div>
            </div>
          )}
        </div>
      )}

      {s.type === 'transfer' && (
        <div>
          <Tag color={C.ink} text={C.white}>Перенос в жизнь</Tag>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: '12px 0' }}>{s.prompt}</p>
          {s.journalTag && (
            <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 12 }}>
              Вечером приложение напомнит и предложит записать наблюдение в дневник с меткой «{s.journalTag}».
            </p>
          )}
          <Btn onClick={next}>Завершить урок</Btn>
        </div>
      )}
    </Card>
  )
}
