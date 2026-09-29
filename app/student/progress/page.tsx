'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'

type State = { concept_id: string; mastery_score: number; confidence_score: number; attempt_count: number; independent_success_count: number; hinted_success_count: number; failure_count: number; updated_at: string }
type Concept = { id: string; name: string }

export default function ProgressPage() {
  const [states, setStates] = useState<State[]>([])
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { Promise.all([fetch('/api/learner-state').then((response) => response.json()), fetch('/api/concepts').then((response) => response.json())]).then(([stateBody, conceptBody]) => { if (!stateBody.success) throw new Error(stateBody.error); setStates(stateBody.learnerState); setConcepts(conceptBody.concepts ?? []) }).catch((reason) => setError(reason.message)) }, [])
  const names = new Map(concepts.map((concept) => [concept.id, concept.name]))
  const focus = states[0]
  return <AppShell eyebrow="Learner state" title="Learner State" description="The living model Seekito maintains for Alex — updated after every attempt."><div className="progress-reference-page">{error ? <div className="inline-error">Unable to load your learning state. Please try again.</div> : states.length ? <><section className="focus-state-card"><div><p className="eyebrow">FOCUS CONCEPT</p><h2>{names.get(focus.concept_id) ?? focus.concept_id}</h2><p>Prerequisite-aware learning state</p></div><div className="focus-metrics"><Metric label="Mastery" value={`${Math.round(Number(focus.mastery_score))}%`} /><Metric label="Uncertainty" value={`${Math.max(0, 100 - Math.round(Number(focus.confidence_score)))}%`} /><Metric label="Attempts" value={String(focus.attempt_count)} /><Metric label="Accuracy" value={`${focus.attempt_count ? Math.round((focus.independent_success_count / focus.attempt_count) * 100) : 0}%`} /><Metric label="Hints" value={String(focus.hinted_success_count)} /><Metric label="Last practiced" value={focus.updated_at ? new Date(focus.updated_at).toLocaleDateString() : '—'} /></div></section><section className="progress-concept-grid">{states.slice(0, 6).map((state) => { const mastery = Math.round(Number(state.mastery_score)); return <article className="progress-concept-card" key={state.concept_id}><div className="progress-concept-head"><strong>{names.get(state.concept_id) ?? state.concept_id}</strong><b>{mastery}%</b></div><div className="progress-bar"><span className={mastery >= 75 ? 'is-success' : mastery < 45 ? 'is-attention' : ''} style={{ width: `${Math.min(100, mastery)}%` }} /></div><div className="progress-concept-meta"><span><b>{state.attempt_count}</b> tries</span><span><b>{state.attempt_count ? Math.round((state.independent_success_count / state.attempt_count) * 100) : 0}%</b> acc.</span><span><b>{state.hinted_success_count}</b> hints</span><span><b>{state.updated_at ? new Date(state.updated_at).toLocaleDateString() : '—'}</b></span></div></article> })}</section></> : <section className="empty-state"><div className="empty-glyph">○</div><h2>No learner state yet.</h2><p>Complete your diagnostic to let Seekito understand where to begin.</p></section>}</div></AppShell>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="focus-metric"><strong>{value}</strong><span>{label}</span></div> }
