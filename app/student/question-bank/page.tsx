'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'

type Concept = { id: string; name: string; difficulty?: string }
type Question = { id: string; concept: Concept; question: string; options: string[]; difficulty: string; questionType: string }

export default function QuestionBankPage() {
  const [groups, setGroups] = useState<{ concept: Concept; questions: Question[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const ids = query.get('conceptIds')?.split(',').filter(Boolean) ?? []
    const stored = sessionStorage.getItem('seekito-onboarding')
    const storedIds = stored ? (JSON.parse(stored) as { conceptIds?: string[] }).conceptIds ?? [] : []
    const conceptIds = ids.length ? ids : storedIds
    fetch('/api/concepts').then((response) => response.json()).then(async (body) => {
      if (!body.success) throw new Error(body.error)
      const concepts = (body.concepts as Concept[]).filter((concept) => !conceptIds.length || conceptIds.includes(concept.id))
      const next = await Promise.all(concepts.map(async (concept) => {
        const response = await fetch(`/api/questions?conceptId=${concept.id}`)
        const questionsBody = await response.json()
        if (!questionsBody.success) throw new Error(questionsBody.error)
        return { concept, questions: (questionsBody.questions as Question[]).slice(0, 5) }
      }))
      setGroups(next.filter((group) => group.questions.length))
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load question bank')).finally(() => setLoading(false))
  }, [])

  const total = useMemo(() => groups.reduce((sum, group) => sum + group.questions.length, 0), [groups])
  return <AppShell eyebrow="Learning bank" title="Your question bank" description="Five evidence-backed questions for every selected topic."><div className="question-bank-page">{error && <div className="inline-error">{error}</div>}{loading ? <section className="question-bank-loading assessment-card"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-canvas" /></section> : !groups.length ? <section className="empty-state"><h2>No questions are available yet.</h2><p>Return to onboarding and choose a topic with seeded practice.</p><Link href={'/student/onboarding' as never} className="primary-button">Choose topics</Link></section> : <><div className="question-bank-hero"><div><p className="eyebrow">AUTO-FRAMED FROM YOUR ONBOARDING</p><h2>{total} questions ready to explore</h2><p>Each topic below contains a five-question test. Start with the area that feels most useful today.</p></div><Link href={'/student/onboarding' as never} className="secondary-button">Edit topics</Link></div><div className="question-bank-groups">{groups.map((group) => <section className="question-bank-group" key={group.concept.id}><div className="question-bank-group-heading"><div><p className="eyebrow">TOPIC</p><h3>{group.concept.name}</h3></div><Link className="primary-button" href={`/student/assessment/${group.concept.id}`}>Start 5-question test</Link></div><div className="question-bank-list">{group.questions.map((question, index) => <article key={question.id} className="question-bank-item"><span className="question-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{question.question}</strong><div className="question-bank-meta"><span>{question.difficulty}</span><span>{question.questionType}</span><span>{question.options.length} answer choices</span></div></div></article>)}</div></section>)}</div></>}</div></AppShell>
}
