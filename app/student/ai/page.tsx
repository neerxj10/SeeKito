'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SeekitoAI } from '@/components/learning/SeekitoAI'

type Concept = { id: string; name: string; description: string | null; subject?: string; difficulty?: string }
type State = { concept_id: string; mastery_score: number; confidence_score: number }

export default function StudentAIPage() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [states, setStates] = useState<State[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([fetch('/api/concepts').then((response) => response.json()), fetch('/api/learner-state').then((response) => response.json())]).then(([conceptBody, stateBody]) => {
      const available = conceptBody.concepts ?? []
      setConcepts(available)
      setStates(stateBody.learnerState ?? [])
      setSelectedId(available[0]?.id ?? '')
    }).finally(() => setLoading(false))
  }, [])
  const selected = useMemo(() => concepts.find((concept) => concept.id === selectedId), [concepts, selectedId])
  const state = states.find((item) => item.concept_id === selectedId)
  return <AppShell eyebrow="SeeKito AI" title="Learn with a guide that adapts." description="Ask for a clearer explanation or generate a focused quiz from your current learner evidence."><div className="ai-workspace">{loading ? <section className="learn-loading-card"><div className="skeleton-line wide" /><div className="skeleton-line" /></section> : selected ? <><section className="ai-workspace-intro"><div><p className="eyebrow">CONTENT INTELLIGENCE</p><h2>What do you want to understand next?</h2><p>SeeKito AI creates explanations and timed question sets. Your answers still pass through the evidence and decision engine.</p></div><label>Choose a concept<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{concepts.map((concept) => <option value={concept.id} key={concept.id}>{concept.name}</option>)}</select></label></section><SeekitoAI conceptId={selected.id} conceptName={selected.name} description={selected.description} mastery={Number(state?.mastery_score ?? 0)} confidence={Number(state?.confidence_score ?? 0)} /><section className="ai-trust-row"><strong>How SeeKito AI is used</strong><span>AI generates content.</span><span>Practice records evidence.</span><span>The decision engine controls the next action.</span></section></> : <section className="state-message"><h2>No concepts available yet.</h2><p>Complete onboarding to create your learning path.</p></section>}</div></AppShell>
}
