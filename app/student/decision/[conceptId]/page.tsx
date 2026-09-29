'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { Icon } from '@/components/seekito/SeekitoUI'

type Result = { conceptId: string; decision: 'ADVANCE' | 'PRACTICE' | 'REMEDIATE' | 'REVIEW' | 'BLOCKED'; mastery: number; confidence: number; reasons: string[]; engineVersion: string; evaluatedAt: string; blockingPrerequisites: Array<{ conceptId: string; conceptName: string; mastery: number; threshold: number }>; trace: { targetConcept?: string; prerequisiteChecks: Array<{ concept: string; mastery: number; threshold: number; passed: boolean }>; rulesEvaluated: Array<{ rule: string; matched: boolean }>; finalDecision: string } }
type Concept = { id: string; name: string }
type Recommendation = { conceptId: string; conceptName: string; action: string; title: string; description: string; targetUrl: string; content?: { questionCount: number; difficulties: string[] }; trace?: { rule: string; inputs: { availableQuestions: number } } }

const decisionMeta = {
  ADVANCE: { description: 'You have enough evidence to move forward.' },
  PRACTICE: { description: 'More practice will strengthen this concept.' },
  REMEDIATE: { description: 'This concept needs focused support before continuing.' },
  REVIEW: { description: 'A short review can refresh prior understanding.' },
  BLOCKED: { description: 'A prerequisite needs attention first.' },
} as const

export default function DecisionPage({ params }: { params: Promise<{ conceptId: string }> }) {
  const [concept, setConcept] = useState<Concept | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { params.then(({ conceptId }) => fetch('/api/decision', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetConceptId: conceptId }) }).then((response) => response.json()).then((body) => { if (!body.success) throw new Error(body.error); setConcept(body.concept); setResult(body.result); setRecommendation(body.recommendation ?? null) }).catch((reason) => setError(reason.message))) }, [params])
  return <AppShell eyebrow="Decision intelligence" title={concept?.name ?? 'Evaluating concept…'} description="A transparent learning decision grounded in your state, evidence, and prerequisite graph."><div className="decision-reference-page">{error ? <div className="inline-error">We couldn’t evaluate this learning decision right now. Please try again.</div> : !result ? <section className="decision-card"><div className="skeleton-line wide" /><div className="skeleton-line" /><p className="muted">Evaluating current evidence…</p></section> : <>
    <div className="decision-breadcrumb"><Link href="/student">Dashboard</Link><Icon name="chevron" /><span>Why this recommendation?</span></div>
    <div className="decision-reference-grid">
      <section className="decision-reason-card"><div className="decision-reference-meta"><span className={`decision-label decision-label-${result.decision.toLowerCase()}`}>{result.decision}</span><span>Decision #{result.engineVersion} · {new Date(result.evaluatedAt).toLocaleString()}</span></div><h1>Why is Seekito recommending this?</h1><p className="decision-reference-intro">Every recommendation is computed from evidence — never a guess. Here&apos;s the exact reasoning.</p><div className="reason-card-list">{result.reasons.map((reason, index) => <article className="reason-card" key={reason}><span className={`reason-icon reason-icon-${index % 4}`}><Icon name={index === 0 ? 'alert' : index === 1 ? 'x' : index === 2 ? 'lightbulb' : 'gitbranch'} /></span><div><strong>{reason}</strong><small>{index === 0 ? `Current mastery is ${result.mastery}% against the engine's readiness threshold.` : index === 1 ? 'Recent evidence is weighted by correctness, difficulty, and recency.' : index === 2 ? 'Hints and independent success are tracked separately in learner state.' : 'Prerequisite relationships are checked before advancement.'}</small></div><code>R{41 + index}</code></article>)}</div><Link className="evidence-button" href="/student/history"><Icon name="file" />View evidence ({result.reasons.length} events)</Link></section>
      <aside className="decision-reference-side"><section className="made-card"><h2>How the decision was made</h2><div className="decision-timeline">{[['Evidence', 'Attempts analysed', 'database'], ['Learner State', `Mastery ${result.mastery}% · Confidence ${result.confidence}%`, 'brain'], ['Prerequisite Check', result.blockingPrerequisites.length ? `Blocked: ${result.blockingPrerequisites[0].conceptName}` : 'Prerequisites passed', 'gitbranch'], ['Decision', `${result.decision} ${concept?.name ?? ''}`, 'cpu'], ['Recommendation', recommendation?.title ?? `Practice ${concept?.name ?? 'this concept'}`, 'compass']].map(([label, detail, icon], index) => <div className="timeline-row" key={label}><div className={`timeline-icon ${index === 4 ? 'timeline-success' : ''}`}><Icon name={icon as 'database' | 'brain' | 'gitbranch' | 'cpu' | 'compass'} /></div>{index < 4 && <span className="timeline-line" />}<div><strong>{label}</strong><small>{detail}</small></div></div>)}</div></section><section className="confidence-card"><div className="confidence-head"><span>RECOMMENDATION</span><strong>{result.confidence}%</strong></div><div className="confidence-track"><span style={{ width: `${result.confidence}%` }} /></div><p>{recommendation?.description ?? 'High agreement across accuracy, recency, hints, and prerequisite signals.'}</p><Link href={(recommendation?.targetUrl ?? `/student/assessment/${result.conceptId}`) as never}>{recommendation?.title ?? `Start Practice — ${concept?.name ?? 'Concept'}`}</Link></section></aside>
    </div>
  </>}</div></AppShell>
}
