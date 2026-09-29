'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Icon, StatusPill } from '@/components/seekito/SeekitoUI'

type Concept = { id: string; name: string; description: string | null }
type Attempt = { id: string; concept_id: string; is_correct: boolean; submitted_at: string; question: string }
type Evidence = { id: string; concept_id: string; attempt_id: string; evidence_type: string; created_at: string }
type State = { concept_id: string; mastery_score: number; confidence_score: number }
type Decision = { decision: string; mastery: number; confidence: number; reasons: string[]; blockingPrerequisites: { conceptId: string; conceptName: string }[] }

export default function ResultsPage() {
  const [conceptId, setConceptId] = useState<string | null>(null)
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [states, setStates] = useState<State[]>([])
  const [decision, setDecision] = useState<Decision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { setConceptId(new URLSearchParams(window.location.search).get('conceptId')) }, [])
  useEffect(() => {
    Promise.all([fetch('/api/concepts').then((r) => r.json()), fetch('/api/attempts').then((r) => r.json()), fetch('/api/evidence').then((r) => r.json()), fetch('/api/learner-state').then((r) => r.json())]).then(([conceptBody, attemptBody, evidenceBody, stateBody]) => {
      if (!conceptBody.success || !attemptBody.success || !evidenceBody.success || !stateBody.success) throw new Error(conceptBody.error ?? attemptBody.error ?? evidenceBody.error ?? stateBody.error ?? 'Unable to load results')
      setConcepts(conceptBody.concepts ?? []); setAttempts(attemptBody.attempts ?? []); setEvidence(evidenceBody.evidence ?? []); setStates(stateBody.learnerState ?? [])
      const target = conceptId ?? attemptBody.attempts?.[0]?.concept_id
      if (target) return fetch('/api/decision', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetConceptId: target }) }).then((r) => r.json()).then((body) => { if (body.success) setDecision(body.result) })
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [conceptId])
  const assessedAttempts = useMemo(() => conceptId ? attempts.filter((attempt) => attempt.concept_id === conceptId).slice(0, 5) : attempts.slice(0, 5), [attempts, conceptId])
  const assessedEvidence = useMemo(() => conceptId ? evidence.filter((item) => item.concept_id === conceptId) : evidence, [evidence, conceptId])
  const concept = concepts.find((item) => item.id === (conceptId ?? assessedAttempts[0]?.concept_id))
  const state = states.find((item) => item.concept_id === concept?.id)
  const score = assessedAttempts.filter((attempt) => attempt.is_correct).length
  const focusId = decision?.blockingPrerequisites?.[0]?.conceptId ?? concept?.id
  return <AppShell eyebrow="Assessment results" title="Assessment complete." description="Your answers are now evidence in the learning system."><div className="results-page">{loading ? <section className="results-card"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-canvas" /></section> : error ? <section className="state-message"><h2>Results unavailable</h2><p>{error}</p></section> : <><section className="results-summary"><div><p className="eyebrow">ASSESSMENT COMPLETE</p><h2>{concept?.name ?? 'Learning evidence recorded'}</h2><p>{assessedAttempts.length} answers were evaluated and connected to {assessedEvidence.length} evidence events.</p></div><div className="results-score"><strong>{score}/{assessedAttempts.length}</strong><span>correct</span></div></section><div className="results-grid"><section className="results-card"><div className="panel-heading"><div><p className="eyebrow">YOUR NEXT LEARNING STEP</p><h2>{decision?.blockingPrerequisites?.[0]?.conceptName ?? concept?.name ?? 'Continue building evidence'}</h2></div>{decision && <StatusPill tone={decision.decision === 'REMEDIATE' || decision.decision === 'BLOCKED' ? 'warning' : 'blue'}>{decision.decision}</StatusPill>}</div><p className="results-reason">{decision?.reasons?.[0] ?? 'Seekito will select a recommendation after enough evidence is available.'}</p>{state && <div className="results-metrics"><div><span>Mastery</span><strong>{Math.round(Number(state.mastery_score))}%</strong></div><div><span>Confidence</span><strong>{Math.round(Number(state.confidence_score))}%</strong></div><div><span>Evidence</span><strong>{assessedEvidence.length}</strong></div></div>}<div className="results-evidence"><h3>Why this decision?</h3>{(decision?.reasons ?? ['Every answer is retained as traceable evidence.']).map((reason) => <p key={reason}><Icon name="check" />{reason}</p>)}</div><div className="decision-actions"><Link className="primary-button" href={focusId ? `/student/learn/${focusId}` : '/student/learn'}>Start guided practice</Link><Link className="secondary-button" href="/student/history">View evidence history</Link></div></section><aside className="results-card results-loop"><p className="eyebrow">THE EVIDENCE LOOP</p>{['Answers evaluated', 'Evidence recorded', 'Learner state updated', 'Decision explained'].map((item, index) => <div className="results-loop-row" key={item}><span>{index + 1}</span><strong>{item}</strong></div>)}<Link className="text-link" href="/student">Return to dashboard →</Link></aside></div></>}</div></AppShell>
}
