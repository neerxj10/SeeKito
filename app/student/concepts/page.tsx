'use client'

import { useEffect, useState } from 'react'
import { ConceptGraph } from '@/components/learning/ConceptGraph'
import { AppShell } from '@/components/layout/AppShell'

type Concept = { id: string; name: string; slug: string; description: string | null; subject: string; difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; estimated_minutes: number; is_active: boolean }
type Prerequisite = { id: string; concept_id: string; prerequisite_concept_id: string; required_mastery: number; priority: number }
type State = { concept_id: string; mastery_score: number; confidence_score: number; attempt_count: number; failure_count: number; last_attempt_at: string | null }

export default function StudentConceptsPage() {
  const [data, setData] = useState<{ concepts: Concept[]; prerequisites: Prerequisite[] } | null>(null)
  const [states, setStates] = useState<State[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { Promise.all([fetch('/api/concepts').then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error ?? 'Unable to load concept graph'); return body }), fetch('/api/learner-state').then((response) => response.json())]).then(([graph, stateBody]) => { setData(graph); if (stateBody.success) setStates(stateBody.learnerState) }).catch((reason: Error) => setError(reason.message)) }, [])
  return <AppShell eyebrow="Concept map" title="Build from what you know." description="A prerequisite map of Algebra concepts, grounded in your actual learner state.">
    <div className="concept-map-content"><div className="concept-legend" aria-label="Concept status legend"><span><i className="legend-dot legend-mastered" />Mastered</span><span><i className="legend-dot legend-learning" />Learning</span><span><i className="legend-dot legend-attention" />Needs Attention</span><span><i className="legend-dot legend-locked" />Locked</span></div>
      {error ? <section className="state-message"><h2>Concept graph unavailable</h2><p>We couldn’t load the concept map right now.</p><p className="muted">{error}</p></section> : !data ? <section className="graph-shell graph-loading"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-canvas" /></section> : <section className="graph-shell"><ConceptGraph {...data} states={states} /></section>}
    </div>
  </AppShell>
}
