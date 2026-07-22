// Калибровочный квиз — перенос из прототипа, работает через API.
import React, { useState } from 'react'
import { api } from '../api.js'
import { C, fonts, inputStyle } from '../tokens.js'
import { Btn, Card, Tag } from './ui.jsx'

export default function Quiz({ week, questions, onDone }) {
  const [answers, setAnswers] = useState(questions.map(() => ({ lo: '', hi: '' })))
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const submit = async () => {
    setError(null)
    try {
      const res = await api('/me/quiz', {
        method: 'POST',
        body: JSON.stringify({
          week,
          answers: questions.map((q, i) => ({
            question_id: q.id, lo: +answers[i].lo, hi: +answers[i].hi,
          })),
        }),
      })
      setResult(res)
    } catch (e) { setError(e.message) }
  }

  const resFor = (qid) => result?.results.find((r) => r.question_id === qid)

  return (
    <Card>
      <Tag color={C.marker} text={C.ink}>Калибровочный квиз</Tag>
      <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: '12px 0' }}>
        Для каждого вопроса дайте интервал, в который истинный ответ попадёт <b>с уверенностью 90%</b>.
        Цель — не угадать точно, а честно откалиброваться: при 90% вы должны попадать в 4–5 случаях из 5.
      </p>
      {questions.map((q, i) => {
        const r = resFor(q.id)
        return (
          <div key={q.id} style={{ margin: '12px 0', padding: '12px 14px', background: r ? (r.hit ? C.tealSoft : C.redSoft) : C.paper, borderRadius: 10 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>{q.question}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: fonts.mono, fontSize: 14 }}>
              <input disabled={!!result} value={answers[i].lo}
                     onChange={(e) => { const a = [...answers]; a[i] = { ...a[i], lo: e.target.value.replace(/[^\d]/g, '') }; setAnswers(a) }}
                     placeholder="от" style={{ ...inputStyle, width: 90, fontFamily: fonts.mono }} />
              —
              <input disabled={!!result} value={answers[i].hi}
                     onChange={(e) => { const a = [...answers]; a[i] = { ...a[i], hi: e.target.value.replace(/[^\d]/g, '') }; setAnswers(a) }}
                     placeholder="до" style={{ ...inputStyle, width: 90, fontFamily: fonts.mono }} />
              {r && <span style={{ marginLeft: 'auto', fontWeight: 600, color: C.teal }}>= {r.answer}</span>}
            </div>
          </div>
        )
      })}
      {error && <p style={{ color: C.red, fontSize: 13 }}>{error}</p>}
      {!result ? (
        <Btn disabled={answers.some((a) => !a.lo || !a.hi)} onClick={submit}>Проверить</Btn>
      ) : (
        <div>
          <div style={{ background: C.ink, color: C.white, borderRadius: 12, padding: '16px 20px', margin: '8px 0 14px' }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 13, opacity: 0.7 }}>ПОПАДАНИЙ ПРИ ЗАЯВЛЕННЫХ 90%</div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>
              {result.hits} из {result.total}{' '}
              <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.8 }}>= {Math.round((result.hits / result.total) * 100)}%</span>
            </div>
            <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
              {result.hits >= 4
                ? 'Отличная калибровка — либо широкие честные интервалы, либо эрудиция. Проверим на следующих квизах.'
                : 'Типичный результат: уверенность «90%» на деле работает как 40–60%. Это не про знания — это про ширину интервалов. Сверхуверенность лечится только такими сверками.'}
            </div>
          </div>
          <Btn onClick={onDone}>Готово</Btn>
        </div>
      )}
    </Card>
  )
}
