'use client'

import { useState } from 'react'
import { RoleShell } from '@/components/layout/RoleShell'

const profiles = { Alex: [true, false, true, false, false], Priya: [true, true, true, true, true] }

export default function TeacherSimulationPage() {
  const [left, setLeft] = useState('Alex')
  const [right, setRight] = useState('Priya')
  function summary(values: boolean[]) { const correct = values.filter(Boolean).length; const mastery = Math.max(0, correct * 20 - (values.length - correct) * 15); return { correct, mastery, action: mastery < 40 ? 'REMEDIATE' : mastery < 80 ? 'PRACTICE' : 'ADVANCE' } }
  const first = summary(profiles[left as keyof typeof profiles]); const second = summary(profiles[right as keyof typeof profiles])
  return <RoleShell role="teacher" eyebrow="Teacher console" title="Replay lab" description="Compare how the same concept produces different next actions from different evidence."><div className="simulation-page"><section className="teacher-proof-card"><p className="eyebrow">ADAPTIVE ENGINE COMPARISON</p><h2>Same concept. Different evidence. Different action.</h2><p>Use this replay to demonstrate that Seekito does not recommend the same path to every learner.</p><div className="simulation-selects"><label>Learner A<select value={left} onChange={(event) => setLeft(event.target.value)}><option>Alex</option><option>Priya</option></select></label><label>Learner B<select value={right} onChange={(event) => setRight(event.target.value)}><option>Alex</option><option>Priya</option></select></label></div></section><div className="simulation-grid"><SimulationCard name={left} values={profiles[left as keyof typeof profiles]} result={first} /><SimulationCard name={right} values={profiles[right as keyof typeof profiles]} result={second} /></div></div></RoleShell>
}

function SimulationCard({ name, values, result }: { name: string; values: boolean[]; result: { correct: number; mastery: number; action: string } }) { return <section className="teacher-proof-card simulation-card"><p className="eyebrow">{name.toUpperCase()} · FRACTIONS</p><h2>{result.action}</h2><div className="simulation-metrics"><strong>{result.mastery}%<small>estimated mastery</small></strong><strong>{result.correct}/{values.length}<small>correct answers</small></strong></div><div className="simulation-evidence">{values.map((correct, index) => <span key={index} className={correct ? 'is-correct' : 'is-wrong'}>{correct ? '✓' : '×'} Q{index + 1}</span>)}</div><p className="muted">{result.action === 'ADVANCE' ? 'Strong independent evidence supports moving forward.' : 'Recent errors reduce mastery and keep the learner in supported practice.'}</p></section> }
