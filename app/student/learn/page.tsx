'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Icon, StatusPill } from '@/components/seekito/SeekitoUI'
import { SeekitoAI } from '@/components/learning/SeekitoAI'

type Concept = { id: string; name: string; description: string | null; difficulty: string; estimated_minutes: number }
type Prerequisite = { concept_id: string; prerequisite_concept_id: string; required_mastery: number; concept?: Concept }
type State = { concept_id: string; mastery_score: number; confidence_score: number; attempt_count: number; failure_count: number; updated_at: string }
type Decision = { decision: string; confidence: number; mastery: number; reasons: string[]; blockingPrerequisites?: { conceptId: string; conceptName: string; mastery: number; threshold: number }[]; recommendedAction?: string }
type Recommendation = { conceptId: string; conceptName: string; action: string; title: string; description: string; targetUrl: string; content?: { questionCount: number; difficulties: string[] }; trace?: { rule: string; inputs: { availableQuestions: number } } }

export default function LearnPage() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([])
  const [states, setStates] = useState<State[]>([])
  const [decision, setDecision] = useState<Decision | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/concepts').then(async (response) => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.error ?? 'Unable to load learning map'); return body }),
      fetch('/api/learner-state').then(async (response) => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.error ?? 'Unable to load learner state'); return body }),
    ]).then(([graph, stateBody]) => {
      setConcepts(graph.concepts ?? [])
      setPrerequisites(graph.prerequisites ?? [])
      setStates(stateBody.learnerState ?? [])
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [])

  const stateByConcept = useMemo(() => new Map(states.map((state) => [state.concept_id, state])), [states])
  const focus = useMemo(() => {
    const blockedIds = new Set(prerequisites.filter((edge) => Number(stateByConcept.get(edge.prerequisite_concept_id)?.mastery_score ?? 0) < Number(edge.required_mastery) * 100).map((edge) => edge.concept_id))
    return concepts.find((concept) => !blockedIds.has(concept.id) && Number(stateByConcept.get(concept.id)?.mastery_score ?? 0) < 80) ?? concepts[0]
  }, [concepts, prerequisites, stateByConcept])
  const focusState = focus ? stateByConcept.get(focus.id) : undefined
  const blockers = focus ? prerequisites.filter((edge) => edge.concept_id === focus.id && Number(stateByConcept.get(edge.prerequisite_concept_id)?.mastery_score ?? 0) < Number(edge.required_mastery) * 100).map((edge) => concepts.find((concept) => concept.id === edge.prerequisite_concept_id)).filter(Boolean) as Concept[] : []

  useEffect(() => {
    if (!focus) return
    fetch('/api/decision', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetConceptId: focus.id }) }).then((response) => response.json()).then((body) => { if (body.success) { setDecision(body.result); setRecommendation(body.recommendation ?? null) } }).catch(() => undefined)
  }, [focus?.id])

  const status = focusState && Number(focusState.mastery_score) >= 80 ? 'Mastered' : focusState && Number(focusState.failure_count) >= 2 ? 'Needs Attention' : focusState ? 'Learning' : blockers.length ? 'Locked' : 'Available'
  const actionHref = blockers[0] ? `/student/learn/${blockers[0].id}` : focus ? `/student/learn/${focus.id}` : '/student/practice'
  return <AppShell eyebrow="Concept map" title="Build from what you know." description="A prerequisite map of Algebra concepts, grounded in your actual learner state." headerActions={<Link className="header-practice-button" href={actionHref as never}><Icon name="spark" />Continue learning</Link>}>
    {error ? <section className="state-message"><h2>Learning map unavailable</h2><p>We couldn’t load your learning path right now.</p><p className="muted">{error}</p></section> : loading ? <section className="learn-loading-card"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-canvas" /></section> : !focus ? <section className="learn-empty-card"><span className="empty-glyph">◌</span><h2>Your learning map starts here.</h2><p>Complete a diagnostic or practice session to let Seekito understand where to begin.</p><Link className="primary-button" href="/student/practice">Start practice</Link></section> : <div className="learn-workspace">
      <section className="learn-focus-card"><div className="learn-focus-copy"><p className="eyebrow">CURRENT LEARNING FOCUS</p><div className="learn-title-row"><h2>{focus.name}</h2><StatusPill tone={status === 'Needs Attention' || status === 'Locked' ? 'warning' : status === 'Mastered' ? 'positive' : 'blue'}>{status}</StatusPill></div><p>{focus.description ?? 'Build evidence for this concept and unlock the next step in your path.'}</p><div className="learn-focus-meta"><span>{focus.difficulty}</span><span>{focus.estimated_minutes} min</span><span>{focusState?.attempt_count ?? 0} attempts</span></div></div><div className="learn-focus-stat"><span>Mastery</span><strong>{focusState ? `${Math.round(Number(focusState.mastery_score))}%` : '—'}</strong><div className="progress-track"><span style={{ width: `${Math.min(100, Number(focusState?.mastery_score ?? 0))}%` }} /></div><small>{focusState ? `${Math.round(Number(focusState.confidence_score))}% confidence` : 'No evidence yet'}</small></div></section>
      <SeekitoAI conceptId={focus.id} conceptName={focus.name} description={focus.description} mastery={Number(focusState?.mastery_score ?? 0)} confidence={Number(focusState?.confidence_score ?? 0)} />
      <div className="learn-columns"><section className="panel-card"><div className="panel-heading"><div><p className="eyebrow">PATH CONTEXT</p><h2>What unlocks next</h2></div><Link href="/student/concepts">Open map</Link></div>{blockers.length ? <div className="learn-blocked-callout"><Icon name="lock" /><div><strong>{focus.name} is waiting on a prerequisite.</strong><p>Continue with {blockers[0].name} until the prerequisite threshold is met.</p></div></div> : <div className="learn-ready-callout"><Icon name="check" /><div><strong>This concept is ready to practice.</strong><p>Each answer becomes immutable evidence for your learner state.</p></div></div>}<div className="learn-prereq-list">{(prerequisites.filter((edge) => edge.concept_id === focus.id)).map((edge) => { const prerequisite = concepts.find((concept) => concept.id === edge.prerequisite_concept_id); const state = stateByConcept.get(edge.prerequisite_concept_id); const mastery = Number(state?.mastery_score ?? 0); return <Link href={`/student/learn/${edge.prerequisite_concept_id}`} className="learn-prereq-row" key={edge.prerequisite_concept_id}><span>{prerequisite?.name ?? 'Prerequisite'}</span><span><strong>{Math.round(mastery)}%</strong><small> / {Math.round(Number(edge.required_mastery) * 100)}% required</small></span></Link> })}</div><Link className="primary-button learn-action-button" href={(recommendation?.targetUrl ?? actionHref) as never}>{recommendation?.title ?? (blockers.length ? `Practice ${blockers[0].name}` : `Practice ${focus.name}`)} <span>→</span></Link></section><aside className="learn-decision-card"><p className="eyebrow">NEXT BEST ACTION</p><h2>{recommendation?.title ?? decision?.decision ?? 'BUILD EVIDENCE'}</h2><p>{recommendation?.description ?? decision?.reasons?.[0] ?? 'Seekito will evaluate your evidence after the next attempt and explain what to do next.'}</p>{recommendation?.content && <p className="learn-recommendation-content">{recommendation.content.questionCount} questions available · {recommendation.content.difficulties.join(' · ') || 'guided set'}</p>}<div className="decision-confidence"><span>Decision confidence</span><strong>{decision ? `${Math.round(Number(decision.confidence))}%` : '—'}</strong></div><Link className="secondary-button" href={focus ? `/student/decision/${focus.id}` : '/student/concepts'}>Why this recommendation?</Link></aside></div>
      <section className="learn-bottom-grid"><article className="panel-card"><div className="panel-heading"><div><p className="eyebrow">YOUR PATH</p><h2>Concepts in sequence</h2></div><Link href="/student/progress">View progress</Link></div><div className="learn-concept-list">{concepts.slice(0, 8).map((concept) => { const state = stateByConcept.get(concept.id); const mastery = Number(state?.mastery_score ?? 0); const isBlocked = prerequisites.some((edge) => edge.concept_id === concept.id && Number(stateByConcept.get(edge.prerequisite_concept_id)?.mastery_score ?? 0) < Number(edge.required_mastery) * 100); return <Link className={`learn-concept-row ${concept.id === focus.id ? 'is-focus' : ''}`} href={`/student/learn/${concept.id}`} key={concept.id}><span className="concept-row-name"><i className={`concept-status-dot ${isBlocked ? 'is-locked' : mastery >= 80 ? 'is-mastered' : 'is-learning'}`} />{concept.name}</span><span>{isBlocked ? 'Locked' : state ? `${Math.round(mastery)}%` : 'Available'}</span></Link> })}</div></article><article className="learn-proof-card"><Icon name="eye" /><p className="eyebrow">EXPLAINABLE LEARNING</p><h2>Every recommendation has a trace.</h2><p>Attempts, hints, prerequisite checks, and learner state are kept connected so you can see why the next action was chosen.</p><Link className="text-link" href="/student/history">Review learning history →</Link></article></section>
    </div>}
  </AppShell>
}
