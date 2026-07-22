// График калибровки (SVG) — перенос из прототипа, данные из GET /me/calibration:
// [{declared, actual, n, source: 'quiz'|'predictions'}]
import React from 'react'
import { C, fonts } from '../tokens.js'

export default function CalibrationChart({ points }) {
  const quizPts = points.filter((p) => p.source === 'quiz')
  const buckets = points.filter((p) => p.source === 'predictions')

  const W = 300, H = 190, pad = 34
  const x = (v) => pad + ((Math.max(v, 50) - 50) / 50) * (W - pad - 12)
  const yy = (v) => H - 26 - (v / 100) * (H - 26 - 14)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', background: C.white, borderRadius: 10 }}>
        {[50, 60, 70, 80, 90, 100].map((v) => (
          <g key={v}>
            <line x1={x(v)} y1={14} x2={x(v)} y2={H - 26} stroke={C.grid} strokeWidth="1" />
            <text x={x(v)} y={H - 10} fontSize="9" fontFamily={fonts.mono} fill={C.inkSoft} textAnchor="middle">{v}</text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={'h' + v}>
            <line x1={pad} y1={yy(v)} x2={W - 12} y2={yy(v)} stroke={C.grid} strokeWidth="1" />
            <text x={pad - 6} y={yy(v) + 3} fontSize="9" fontFamily={fonts.mono} fill={C.inkSoft} textAnchor="end">{v}</text>
          </g>
        ))}
        <line x1={x(50)} y1={yy(50)} x2={x(100)} y2={yy(100)} stroke={C.teal} strokeWidth="1.5" strokeDasharray="5 4" opacity=".55" />
        <text x={x(96)} y={yy(99)} fontSize="9" fontFamily={fonts.mono} fill={C.teal} textAnchor="end">идеал</text>
        {quizPts.map((p, i) => (
          <circle key={'q' + i} cx={x(p.declared)} cy={yy(p.actual)} r="5" fill={C.marker} stroke={C.ink} strokeWidth="1.2" />
        ))}
        {buckets.map((b, i) => (
          <rect key={'b' + i} x={x(b.declared) - 5} y={yy(b.actual) - 5} width="10" height="10" fill={C.teal} rx="2" />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontFamily: fonts.mono, fontSize: 11, color: C.inkSoft }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, background: C.marker, border: `1px solid ${C.ink}`, borderRadius: 9, marginRight: 5 }} />квизы (заявлено 90%)</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, background: C.teal, borderRadius: 2, marginRight: 5 }} />прогнозы</span>
      </div>
      {points.length === 0 && (
        <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 8 }}>
          Пока пусто. Пройдите калибровочный квиз и заведите первые прогнозы — точки появятся здесь.
          По горизонтали — насколько вы были уверены, по вертикали — как часто оказались правы.
          У откалиброванного человека точки лежат на пунктире.
        </p>
      )}
    </div>
  )
}
