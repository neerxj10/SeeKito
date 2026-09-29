'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Icon } from '@/components/seekito/SeekitoUI'

type Concept = { id: string; name: string; difficulty: string }
type Question = { id: string; concept: Concept; question: string; options: string[]; difficulty: string; questionType: 'MCQ' | 'SHORT_ANSWER'; hintAvailable: boolean; explanation: string }
type Result = { isCorrect: boolean; evidence: string[]; result: { explanation: string; difficulty: string; usedHint: boolean } }

export default function PracticePage() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [conceptId, setConceptId] = useState('')
  const [question, setQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [hintCount, setHintCount] = useState(0)
  const [startedAt, setStartedAt] = useState(new Date().toISOString())
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [startedAtMs, setStartedAtMs] = useState(Date.now())
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionAnswered, setSessionAnswered] = useState(0)

  useEffect(() => { fetch('/api/concepts').then((response) => response.json()).then((body) => { if (!body.success) throw new Error(body.error); setConcepts(body.concepts); if (body.concepts[0]) setConceptId(body.concepts[0].id) }).catch((reason) => setError(reason.message)) }, [])
  useEffect(() => { if (!conceptId) return; setQuestion(null); setResult(null); setHint(null); setHintCount(0); setAnswer(''); fetch(`/api/questions?conceptId=${conceptId}`).then((response) => response.json()).then((body) => { if (!body.success) throw new Error(body.error); const next = body.questions[0] as Question | undefined; setQuestion(next ?? null); setStartedAt(new Date().toISOString()); setStartedAtMs(Date.now()) }).catch((reason) => setError(reason.message)) }, [conceptId])

  const options = useMemo(() => Array.isArray(question?.options) ? question.options : [], [question])
  async function requestHint() { if (!question) return; const response = await fetch(`/api/questions/${question.id}/hint`, { method: 'POST' }); const body = await response.json(); if (!response.ok) return setError(body.error); setHint(body.hint); setHintCount((value) => value + 1) }
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!question || !answer) return; setLoading(true); setError(null); const response = await fetch('/api/attempts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ questionId: question.id, submittedAnswer: answer, usedHint: hintCount > 0, hintCount, responseTimeMs: Date.now() - startedAtMs, startedAt }) }); const body = await response.json(); setLoading(false); if (!response.ok) return setError(body.error); setResult(body as Result); setSessionAnswered((value) => value + 1); if (body.isCorrect) setSessionCorrect((value) => value + 1) }

  return <AppShell eyebrow="Practice session" title={question?.concept.name ?? 'Practice Session'} description="Use the evidence from each attempt to build stronger recall."><div className="practice-reference-page">
    {error && <div className="inline-error">{error}</div>}
    <div className="practice-session-top"><Link href="/student" className="practice-back"><span>←</span> Practice: {question?.concept.name ?? 'Concept'}</Link><div className="practice-session-status"><span className="difficulty-badge">{question?.difficulty ?? '—'}</span><span>Q {sessionAnswered + 1} of 8 · Streak {sessionCorrect}</span></div></div>
    <div className="practice-session-progress" aria-label="Practice progress">{Array.from({ length: 8 }, (_, index) => <span key={index} className={index < sessionAnswered ? index < sessionCorrect ? 'is-correct' : 'is-current' : ''} />)}</div>
    <section className="practice-session-grid">
      <section className="practice-question-card">{!question ? <p className="muted">No active question available for this concept.</p> : result ? <div className="practice-result"><p className={result.isCorrect ? 'result-correct' : 'result-incorrect'}>{result.isCorrect ? 'Correct' : 'Incorrect'}</p><h2>{question.question}</h2><div className={result.isCorrect ? 'practice-feedback is-success' : 'practice-feedback is-error'}><Icon name={result.isCorrect ? 'check' : 'x'} /><span><strong>{result.isCorrect ? 'Correct.' : 'Not quite.'}</strong> {result.result.explanation}</span></div><p className="muted">Recorded evidence: {result.evidence.join(', ')}</p><button className="primary-button" onClick={() => setConceptId(conceptId)}>Try Another</button></div> : <form onSubmit={submit}><h2>{question.question}</h2>{options.length ? <div className="option-list">{options.map((option) => <label key={option}><input type="radio" name="answer" value={option} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>)}</div> : <input className="answer-input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" autoComplete="off" />}{hint && <div className="hint-box"><strong>Hint</strong><span>{hint}</span></div>}<div className="question-actions"><button type="button" className="secondary-button" onClick={requestHint} disabled={!question.hintAvailable}><Icon name="lightbulb" /> Hint {hintCount ? `(${hintCount} used)` : ''}</button><button type="submit" className="primary-button" disabled={loading || !answer}>{loading ? 'Submitting…' : 'Submit answer'}</button></div></form>}</section>
      <aside className="practice-session-side"><section className="session-score-card"><p className="eyebrow">SESSION</p><strong>{sessionCorrect} / {sessionAnswered || 0}</strong><span>correct</span><b>{question?.concept.name ?? 'Concept'} · Evidence updates after submit</b></section>{hint ? <section className="practice-hint-card"><h3><Icon name="spark" /> Seekito Hint</h3><p>{hint}</p><button className="primary-button" onClick={() => setHint(null)}>Got it</button></section> : <section className="practice-hint-card is-empty"><h3><Icon name="spark" /> Need a hint?</h3><p>Hints are recorded as evidence and never change the server-side assessment result.</p><button className="secondary-button" onClick={requestHint} disabled={!question?.hintAvailable}>Show hint</button></section>}</aside>
    </section>
    <label className="practice-concept-picker" htmlFor="concept">Concept <select id="concept" value={conceptId} onChange={(event) => setConceptId(event.target.value)}>{concepts.map((concept) => <option key={concept.id} value={concept.id}>{concept.name}</option>)}</select></label>
  </div></AppShell>
}
