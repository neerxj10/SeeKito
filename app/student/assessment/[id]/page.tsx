'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

type Question = { id: string; concept: { id: string; name: string }; question: string; options: string[]; difficulty: string; questionType: 'MCQ' | 'SHORT_ANSWER'; hintAvailable: boolean }
type Submission = { isCorrect: boolean; result: { explanation: string; difficulty: string; usedHint: boolean } }
type LearnerState = { mastery: number; confidence: number } | null

export default function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const [conceptId, setConceptId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [hintCount, setHintCount] = useState(0)
  const [startedAt, setStartedAt] = useState(new Date().toISOString())
  const [startedAtMs, setStartedAtMs] = useState(Date.now())
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [learnerState, setLearnerState] = useState<LearnerState>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const isDiagnostic = searchParams.get('diagnostic') === '1'

  useEffect(() => {
    params.then(({ id }) => {
      setConceptId(id)
      return fetch(`/api/questions?conceptId=${id}`)
    }).then((response) => response.json()).then((body) => {
      if (!body.success) throw new Error(body.error)
      setQuestions((body.questions as Question[]).slice(0, isDiagnostic ? 5 : undefined))
    }).catch((reason) => setError(reason.message)).finally(() => setLoading(false))
  }, [params])

  const question = questions[index]
  const score = useMemo(() => Object.values(submissions).filter((submission) => submission.isCorrect).length, [submissions])

  useEffect(() => {
    if (!completed || !isDiagnostic) return
    const saved = localStorage.getItem('seekito-onboarding-profile')
    if (!saved) return
    try {
      const profile = JSON.parse(saved) as Record<string, unknown>
      profile.diagnosticStatus = 'completed'
      profile.diagnosticCompletedAt = new Date().toISOString()
      localStorage.setItem('seekito-onboarding-profile', JSON.stringify(profile))
    } catch {
      // Preserve the assessment result even if an old local profile is invalid.
    }
  }, [completed, isDiagnostic])

  function resetQuestion(nextIndex: number) {
    setIndex(nextIndex)
    setAnswer('')
    setHint(null)
    setHintCount(0)
    setStartedAt(new Date().toISOString())
    setStartedAtMs(Date.now())
  }

  async function requestHint() {
    if (!question) return
    const response = await fetch(`/api/questions/${question.id}/hint`, { method: 'POST' })
    const body = await response.json()
    if (!response.ok) return setError(body.error)
    setHint(body.hint)
    setHintCount((value) => value + 1)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!question || !answer || submitting) return
    setSubmitting(true)
    setError(null)
    const response = await fetch('/api/attempts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ questionId: question.id, submittedAnswer: answer, usedHint: hintCount > 0, hintCount, responseTimeMs: Date.now() - startedAtMs, startedAt, attemptContext: isDiagnostic ? 'diagnostic' : 'practice' }) })
    const body = await response.json()
    if (!response.ok) { setError(body.error); setSubmitting(false); return }
    setSubmissions((current) => ({ ...current, [question.id]: body as Submission }))
    if (index === questions.length - 1) {
      setCompleted(true)
      const stateResponse = await fetch(`/api/learner-state/${conceptId}`)
      const stateBody = await stateResponse.json()
      if (stateBody.success) setLearnerState(stateBody.state)
    } else resetQuestion(index + 1)
    setSubmitting(false)
  }

  return <AppShell eyebrow="Assessment workspace" title={question?.concept.name ?? 'Concept assessment'} description="Each response becomes evidence for your learner state. Hints are recorded separately from independent success.">
    <div className="assessment-page-inner">
      {error && <div className="inline-error">{error}</div>}
      {loading ? <section className="assessment-card"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-canvas" /></section> : !questions.length ? <section className="empty-state"><div className="empty-glyph">○</div><h2>No assessment is available yet.</h2><p>There are no seeded questions for this concept.</p><Link className="secondary-button" href="/student/concepts">Back to concept map</Link></section> : completed ? <section className="assessment-card assessment-complete"><p className="eyebrow">Assessment complete</p><h2>Evidence recorded.</h2><div className="assessment-score"><strong>{score}/{questions.length}</strong><span>questions correct</span></div>{learnerState && <div className="decision-metrics"><div><span>Current mastery</span><strong>{learnerState.mastery}%</strong></div><div><span>Confidence</span><strong>{learnerState.confidence}%</strong></div></div>}<p className="muted">Seekito keeps assessment performance separate from the deterministic learning decision.</p><div className="decision-actions"><Link className="primary-button" href={`/student/results?conceptId=${conceptId}` as never}>View assessment results</Link><Link className="secondary-button" href="/student/concepts">Back to concept map</Link></div></section> : <section className="assessment-card"><div className="assessment-progress"><span>Question {index + 1} of {questions.length}</span><span>{Math.round((index / questions.length) * 100)}% complete</span></div><div className="progress-track"><span style={{ width: `${((index) / questions.length) * 100}%` }} /></div><div className="question-top"><span className="difficulty-badge">{question.difficulty}</span><span className="muted">{question.questionType}</span></div><h2>{question.question}</h2><form onSubmit={submit}>{question.options?.length ? <div className="option-list">{question.options.map((option) => <label key={option}><input type="radio" name="assessment-answer" value={option} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>)}</div> : <input className="answer-input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" autoComplete="off" />}{hint && <div className="hint-box"><strong>Hint</strong><span>{hint}</span></div>}<div className="question-actions"><button type="button" className="secondary-button" onClick={requestHint} disabled={!question.hintAvailable}>Request hint</button><button type="submit" className="primary-button" disabled={!answer || submitting}>{submitting ? 'Recording…' : index === questions.length - 1 ? 'Finish assessment' : 'Submit and continue'}</button></div></form></section>}
    </div>
  </AppShell>
}
