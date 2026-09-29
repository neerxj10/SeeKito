'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'

type Attempt = { id: string; question: string; concept_id: string; is_correct: boolean; difficulty: string; used_hint: boolean; response_time_ms: number | null; submitted_at: string; submitted_answer: unknown }
export default function HistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [selected, setSelected] = useState<Attempt | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { fetch('/api/attempts').then((response) => response.json()).then((body) => { if (!body.success) throw new Error(body.error); setAttempts(body.attempts) }).catch((reason) => setError(reason.message)) }, [])
  return <AppShell eyebrow="Attempt history" title="See the trail." description="Immutable attempt records show what happened over time, separate from your current learner state."><div className="progress-page-inner">{error ? <div className="inline-error">Unable to load your attempt history. Please try again.</div> : <section className="history-card"><div className="history-table"><div className="history-row history-heading"><span>Date</span><span>Question</span><span>Result</span><span>Difficulty</span><span>Hint</span><span>Time</span></div>{attempts.map((attempt) => <button className="history-row" key={attempt.id} onClick={() => setSelected(attempt)}><span>{new Date(attempt.submitted_at).toLocaleString()}</span><span>{attempt.question}</span><span className={attempt.is_correct ? 'result-correct' : 'result-incorrect'}>{attempt.is_correct ? 'Correct' : 'Incorrect'}</span><span>{attempt.difficulty}</span><span>{attempt.used_hint ? 'Yes' : 'No'}</span><span>{attempt.response_time_ms ?? '—'} ms</span></button>)}</div>{selected && <div className="history-detail"><button className="close-button" onClick={() => setSelected(null)}>×</button><p className="eyebrow">Attempt detail</p><h2>{selected.question}</h2><p>Your submitted answer: <strong>{String(selected.submitted_answer)}</strong></p><p className={selected.is_correct ? 'result-correct' : 'result-incorrect'}>{selected.is_correct ? 'Correct' : 'Incorrect'}</p></div>}{!attempts.length && <p className="muted">No attempts recorded yet.</p>}</section>}</div></AppShell>
}
