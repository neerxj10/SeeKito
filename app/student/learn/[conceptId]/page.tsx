'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Icon } from '@/components/seekito/SeekitoUI'
import { SeekitoAI } from '@/components/learning/SeekitoAI'
import { conceptSlug } from '@/lib/learning/slug'

type Content = { id: string; content_type: string; title: string; description: string; body: { paragraphs?: string[]; steps?: string[]; keyPoints?: string[]; commonMistakes?: string[] }; estimated_minutes: number }
type Question = { id: string; question: string; options: string[]; difficulty: string; hintAvailable: boolean }
type Result = { isCorrect: boolean; evidence: string[]; result: { explanation: string } }

export default function ConceptLearningPage() {
  const { conceptId: rawConceptId } = useParams<{ conceptId: string }>()
  const [conceptId, setConceptId] = useState<string | null>(null)
  const [concept, setConcept] = useState<{ name: string; description?: string | null; subject?: string; learning_objective?: string; estimated_minutes?: number } | null>(null)
  const [content, setContent] = useState<Content[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [captured, setCaptured] = useState(0)
  const [startedAt, setStartedAt] = useState(new Date().toISOString())
  const [startedAtMs, setStartedAtMs] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [showCheck, setShowCheck] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [learnerState, setLearnerState] = useState<{ concept_id: string; mastery_score: number; confidence_score: number } | null>(null)
  const question = questions[index]
  const lesson = content.find((item) => item.content_type === 'LESSON')
  const example = content.find((item) => item.content_type === 'WORKED_EXAMPLE')
  const summary = content.find((item) => item.content_type === 'SUMMARY')
  const remediation = content.find((item) => item.content_type === 'REMEDIATION')

  useEffect(() => {
    if (!rawConceptId) return
    fetch('/api/concepts').then((response) => response.json()).then((body) => {
      const match = (body.concepts ?? []).find((item: { id: string; name: string }) => item.id === rawConceptId || conceptSlug(item.name) === rawConceptId)
      if (!match) throw new Error('Concept not found')
      setConceptId(match.id)
      if (rawConceptId !== conceptSlug(match.name)) window.history.replaceState(null, '', `/student/learn/${conceptSlug(match.name)}`)
    }).catch((reason: Error) => setError(reason.message))
  }, [rawConceptId])

  useEffect(() => {
    if (!conceptId) return
    Promise.all([
      fetch(`/api/content/${conceptId}`).then(async (response) => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.error ?? 'Unable to load learning content'); return body }),
      fetch(`/api/questions?conceptId=${conceptId}`).then(async (response) => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.error ?? 'Unable to load quick check'); return body }),
      fetch('/api/learner-state').then(async (response) => { const body = await response.json(); return body.learnerState ?? [] }),
    ]).then(([contentBody, questionBody, stateBody]) => {
      setConcept(contentBody.concept)
      setContent(contentBody.content ?? [])
      setQuestions((questionBody.questions ?? []).slice(0, 2))
      setLearnerState(stateBody.find((item: { concept_id: string }) => item.concept_id === conceptId) ?? null)
      setStartedAt(new Date().toISOString())
      setStartedAtMs(Date.now())
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [conceptId])

  async function requestHint() {
    if (!question || hint) return
    const response = await fetch(`/api/questions/${question.id}/hint`, { method: 'POST' })
    const body = await response.json()
    if (!response.ok) return setError(body.error ?? 'Unable to load hint')
    setHint(body.hint)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!question || !answer || submitting) return
    setSubmitting(true)
    const response = await fetch('/api/attempts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ questionId: question.id, submittedAnswer: answer, usedHint: Boolean(hint), hintCount: hint ? 1 : 0, responseTimeMs: Date.now() - startedAtMs, startedAt, attemptContext: 'practice' }) })
    const body = await response.json()
    setSubmitting(false)
    if (!response.ok) return setError(body.error ?? 'Unable to record answer')
    setResult(body as Result)
    setCaptured((value) => value + 1)
  }

  function nextQuestion() {
    if (index + 1 < questions.length) { setIndex((value) => value + 1); setAnswer(''); setHint(null); setResult(null); setStartedAt(new Date().toISOString()); setStartedAtMs(Date.now()) }
    else setShowCheck(false)
  }

  const quickCheck = !showCheck ? <><p>Answer two focused questions. Hints are optional and recorded separately from independent success.</p><button className="primary-button" onClick={() => setShowCheck(true)} disabled={!questions.length}>Begin quick check →</button></> : question ? <><div className="learn-session-progress">{questions.map((item, itemIndex) => <span key={item.id} className={itemIndex < index ? 'done' : itemIndex === index ? 'current' : ''} />)}</div><p className="eyebrow">QUESTION {index + 1} OF {questions.length} · {question.difficulty}</p><h2>{question.question}</h2><form onSubmit={submit}>{question.options?.length ? <div className="option-list">{question.options.map((option) => <label key={option}><input type="radio" name="quick-answer" value={option} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>)}</div> : <input className="answer-input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" />}{hint && <div className="hint-box"><strong>Hint</strong><span>{hint}</span></div>}{result && <div className={`practice-feedback ${result.isCorrect ? 'is-success' : 'is-error'}`}><Icon name={result.isCorrect ? 'check' : 'x'} /><span><strong>{result.isCorrect ? 'Correct.' : 'Not quite.'}</strong> {result.result.explanation}</span></div>}<div className="question-actions"><button type="button" className="secondary-button" onClick={requestHint} disabled={!question.hintAvailable || Boolean(result)}>{hint ? 'Hint shown' : 'Get a hint'}</button>{result ? <button type="button" className="primary-button" onClick={nextQuestion}>{index + 1 === questions.length ? 'Finish quick check' : 'Next question'} →</button> : <button type="submit" className="primary-button" disabled={!answer || submitting}>{submitting ? 'Recording…' : 'Submit answer'}</button>}</div></form></> : <div className="practice-feedback is-success"><Icon name="check" /><span>Quick check complete. Your evidence is now part of the learner state.</span></div>
  const pageBody = loading ? <section className="learn-session-card"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-canvas" /></section> : error ? <section className="state-message"><h2>Learning content unavailable</h2><p>{error}</p><Link className="secondary-button" href="/student/learn">Return to Learn</Link></section> : <>
    <section className="content-hero-card"><div><p className="eyebrow">LEARNING OBJECTIVE</p><h2>{concept?.learning_objective ?? `Build confidence with ${concept?.name}.`}</h2><p>Read the idea, follow one example, then use a short quick check. Your answers become evidence for the next learning step.</p></div><button className="primary-button" onClick={() => document.getElementById('quick-check')?.scrollIntoView({ behavior: 'smooth' })}>Start quick check →</button></section>
    {concept && <SeekitoAI conceptId={conceptId ?? ''} conceptName={concept.name} description={concept.description} mastery={Number(learnerState?.mastery_score ?? 0)} confidence={Number(learnerState?.confidence_score ?? 0)} />}
    {lesson && <section className="content-section"><div className="panel-heading"><div><p className="eyebrow">LESSON</p><h2>{lesson.title}</h2></div><span>{lesson.estimated_minutes} min</span></div><p>{lesson.body.paragraphs?.[0] ?? lesson.description}</p></section>}
    {example && <section className="content-section content-example"><p className="eyebrow">WORKED EXAMPLE</p><h2>{example.title}</h2><ol>{example.body.steps?.map((step) => <li key={step}>{step}</li>)}</ol></section>}
    <div className="content-two-column"><section className="content-section"><p className="eyebrow">SUMMARY</p><h2>Keep these ideas close</h2><ul>{summary?.body.keyPoints?.map((point) => <li key={point}>{point}</li>)}</ul></section><section className="content-section"><p className="eyebrow">WATCH OUT</p><h2>Common mistakes</h2><ul>{remediation?.body.commonMistakes?.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section></div>
    <section id="quick-check" className="content-section quick-check-section"><div className="panel-heading"><div><p className="eyebrow">QUICK CHECK · {questions.length} QUESTIONS</p><h2>Show what you understand</h2></div><span>{captured} captured</span></div>{quickCheck}</section>
    {captured > 0 && <section className="evidence-summary-card"><div><p className="eyebrow">EVIDENCE CAPTURED</p><h2>Your next practice adapts to this signal.</h2><p>Correctness and hint use flow through the existing learner-state, decision, and recommendation pipeline.</p></div><Link className="primary-button" href={`/student/practice/${conceptId}`}>Continue to practice →</Link></section>}
  </>

  return <AppShell eyebrow={`Learn / ${concept?.subject ?? 'Concept'}`} title={concept?.name ?? 'Learning session'} description={concept?.description ?? 'Build understanding before you practise.'}><div className="concept-learning-page"><div className="learn-session-top"><Link href="/student/learn">← Back to Learn</Link><span>{concept?.estimated_minutes ?? 20} min learning path</span></div>{pageBody}</div></AppShell>
}
