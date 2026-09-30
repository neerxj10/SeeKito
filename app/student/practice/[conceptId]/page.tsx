'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Icon } from '@/components/seekito/SeekitoUI'

type Question = { id: string; concept: { id: string; name: string }; question: string; options: string[]; difficulty: string; questionType: string; hintAvailable: boolean }
type NextStep = { recommendation?: { title: string; description: string; targetUrl: string } }

export default function AdaptivePracticePage() {
  const { conceptId } = useParams<{ conceptId: string }>()
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState('')
  const [concept, setConcept] = useState<{ id: string; name: string } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [hintCount, setHintCount] = useState(0)
  const [startedAt, setStartedAt] = useState(new Date().toISOString())
  const [startedAtMs, setStartedAtMs] = useState(Date.now())
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string; evidence: string[] } | null>(null)
  const [complete, setComplete] = useState<{ score: number; totalQuestions: number } | null>(null)
  const [nextStep, setNextStep] = useState<NextStep | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const question = questions[index]

  useEffect(() => {
    if (!conceptId) return
    const questionCount = Number(searchParams.get('questionCount'))
    const timeMinutes = Number(searchParams.get('timeMinutes'))
    fetch('/api/practice/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ conceptId, actionType: searchParams.get('actionType') ?? 'practice', questionCount: [10, 15, 20].includes(questionCount) ? questionCount : undefined, timeMinutes: timeMinutes > 0 ? timeMinutes : undefined }) }).then(async (response) => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(typeof body.error === 'string' ? body.error : 'Unable to prepare practice'); setSessionId(body.sessionId); setConcept(body.concept); setQuestions(body.questions ?? []); setTimeRemaining(body.timeMinutes ? body.timeMinutes * 60 : null); setStartedAt(new Date().toISOString()); setStartedAtMs(Date.now()) }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [conceptId, searchParams])

  useEffect(() => {
    if (timeRemaining == null || complete) return
    if (timeRemaining <= 0) { setError('Time is up. Submit the current answer if you have one, or return to the dashboard.'); return }
    const timer = window.setInterval(() => setTimeRemaining((value) => value == null ? value : Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [timeRemaining, complete])

  async function requestHint() { if (!question || hint) return; const response = await fetch(`/api/questions/${question.id}/hint`, { method: 'POST' }); const body = await response.json(); if (!response.ok) return setError('Unable to load a hint right now.'); setHint(body.hint); setHintCount((value) => value + 1) }
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!question || !answer || submitting) return; setSubmitting(true); setError(null); const response = await fetch('/api/practice/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, questionId: question.id, answer, usedHint: hintCount > 0, hintCount, responseTimeMs: Date.now() - startedAtMs, startedAt }) }); const body = await response.json(); setSubmitting(false); if (!response.ok || !body.success) return setError(typeof body.error === 'string' ? body.error : 'Unable to record this answer.'); window.dispatchEvent(new Event('seekito-evidence-updated')); setFeedback({ isCorrect: body.isCorrect, explanation: body.result.explanation, evidence: body.evidence ?? [] }); if (body.session?.completed) { setComplete({ score: body.session.score, totalQuestions: body.session.totalQuestions }); setNextStep(body.next ?? null) } }
  function nextQuestion() { setIndex((value) => value + 1); setAnswer(''); setHint(null); setHintCount(0); setFeedback(null); setStartedAt(new Date().toISOString()); setStartedAtMs(Date.now()) }

  const formattedTime = timeRemaining == null ? null : `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`
  return <AppShell eyebrow="Adaptive practice" title={concept?.name ?? 'Practice'} description="Each answer becomes evidence for your next learning step."><div className="adaptive-practice-page">{error && <div className="inline-error">{error}</div>}{loading ? <section className="assessment-card"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-canvas" /></section> : complete ? <section className="adaptive-complete-card"><span className="complete-icon"><Icon name="check" /></span><p className="eyebrow">PRACTICE COMPLETE</p><h2>{concept?.name}</h2><div className="assessment-score"><strong>{complete.score}/{complete.totalQuestions}</strong><span>questions correct</span></div><div className="adaptive-proof-list"><span>✓ {complete.totalQuestions} questions completed</span><span>✓ Evidence recorded</span><span>✓ Learning state updated</span></div>{nextStep?.recommendation && <div className="next-step-card"><p className="eyebrow">YOUR NEXT STEP</p><h3>{nextStep.recommendation.title}</h3><p>{nextStep.recommendation.description}</p></div>}<div className="complete-actions"><Link className="primary-button" href={(nextStep?.recommendation?.targetUrl ?? '/student') as never}>Continue learning →</Link><Link className="secondary-button" href="/student">Return to dashboard</Link></div></section> : !question ? <section className="empty-state"><h2>No questions available.</h2><p>This concept does not have an active practice set yet.</p><Link className="secondary-button" href="/student">Return to dashboard</Link></section> : <><div className="adaptive-practice-top"><Link href="/student">← Dashboard</Link><span>Question {index + 1} of {questions.length}</span>{formattedTime && <strong className={timeRemaining !== null && timeRemaining <= 60 ? 'time-warning' : ''}>⏱ {formattedTime}</strong>}</div><div className="learn-session-progress">{questions.map((item, itemIndex) => <span key={item.id} className={itemIndex < index ? 'done' : itemIndex === index ? 'current' : ''} />)}</div><section className="adaptive-question-grid"><section className="learn-question-card"><p className="eyebrow">{question.difficulty} · {question.questionType === 'MCQ' ? 'CHOOSE ONE' : 'TYPE YOUR ANSWER'}</p>{feedback ? <div className="practice-result"><p className={feedback.isCorrect ? 'result-correct' : 'result-incorrect'}>{feedback.isCorrect ? 'CORRECT' : 'INCORRECT'}</p><h2>{question.question}</h2><div className={`practice-feedback ${feedback.isCorrect ? 'is-success' : 'is-error'}`}><Icon name={feedback.isCorrect ? 'check' : 'x'} /><span><strong>{feedback.isCorrect ? 'Correct.' : 'Not quite.'}</strong> {feedback.explanation}</span></div><p className="muted">Evidence captured: {feedback.evidence.join(', ') || 'attempt recorded'}</p><button className="primary-button" onClick={nextQuestion}>{index + 1 === questions.length ? 'View your next step' : 'Next question →'}</button></div> : <form onSubmit={submit}><h2>{question.question}</h2>{question.options?.length ? <div className="option-list">{question.options.map((option, optionIndex) => <label key={option}><input type="radio" name="adaptive-answer" value={option} checked={answer === option} onChange={() => setAnswer(option)} /><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></label>)}</div> : <input className="answer-input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" autoComplete="off" />}{hint && <div className="hint-box"><strong>Hint</strong><span>{hint}</span></div>}<div className="question-actions"><button type="button" className="secondary-button" onClick={requestHint} disabled={!question.hintAvailable}>{hint ? 'Hint shown' : 'Request hint'}</button><button className="primary-button" type="submit" disabled={!answer || submitting || timeRemaining === 0}>{submitting ? 'Recording…' : 'Submit answer'}</button></div></form>}</section><aside className="learn-session-aside"><section className="session-score-card"><p className="eyebrow">SESSION PROGRESS</p><strong>{index + (feedback ? 1 : 0)} / {questions.length}</strong><span>completed</span><p>Answers, hints, and response timing are recorded as learning evidence.</p></section><section className="learn-trust-card"><Icon name="eye" /><strong>How this adapts</strong><p>Seekito evaluates your response before selecting the next recommendation.</p></section></aside></section></>}</div></AppShell>
}
