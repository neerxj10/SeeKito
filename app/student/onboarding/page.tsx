'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Concept = { id: string; name: string; description?: string; difficulty?: string; estimated_minutes?: number; subject: 'ALGEBRA' | 'SCIENCE' }
type Subject = 'ALGEBRA' | 'SCIENCE'

const subjectOptions: Array<{ id: Subject; label: string; description: string; icon: string }> = [
  { id: 'ALGEBRA', label: 'Mathematics', description: 'Algebra foundations', icon: '∑' },
  { id: 'SCIENCE', label: 'Science', description: 'Scientific thinking', icon: '⚗' },
]

export default function StudentOnboardingPage() {
  const [step, setStep] = useState(1)
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [subject, setSubject] = useState<Subject>('ALGEBRA')
  const [selected, setSelected] = useState<string[]>([])
  const [goal, setGoal] = useState('Build strong foundations')
  const [level, setLevel] = useState('Grade 9')
  const [confidence, setConfidence] = useState('Somewhat confident')
  const [practiceTime, setPracticeTime] = useState('20 minutes a day')
  const [helpStyle, setHelpStyle] = useState('Worked examples')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/concepts').then((response) => response.json()).then((body) => {
      if (!body.success) throw new Error(body.error)
      const available = body.concepts as Concept[]
      setConcepts(available)
      setSelected(available.filter((concept) => concept.subject === 'ALGEBRA').map((concept) => concept.name))
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load learning topics'))
  }, [])

  const subjectConcepts = useMemo(() => concepts.filter((concept) => concept.subject === subject), [concepts, subject])
  const selectedConcepts = useMemo(() => concepts.filter((concept) => selected.includes(concept.name)), [concepts, selected])
  const activeSubject = subjectOptions.find((option) => option.id === subject) ?? subjectOptions[0]

  function chooseSubject(nextSubject: Subject) {
    setSubject(nextSubject)
    setSelected(concepts.filter((concept) => concept.subject === nextSubject).map((concept) => concept.name))
  }

  function toggleTopic(name: string) {
    setSelected((current) => current.includes(name) ? current.filter((topic) => topic !== name) : [...current, name])
  }

  function startDiagnostic() {
    const ids = selectedConcepts.map((concept) => concept.id)
    if (!ids.length) return
    sessionStorage.setItem('seekito-onboarding', JSON.stringify({ goal, level, confidence, practiceTime, helpStyle, subject, conceptIds: ids, topicNames: selected }))
    window.location.href = `/student/assessment/${ids[0]}`
  }

  return <main className="onboarding-page">
    <Link href="/student" className="onboarding-brand"><span>S</span>SeeKito</Link>
    <section className="onboarding-card">
      <div className="onboarding-progress"><div><span className={step >= 1 ? 'is-active' : ''} /><span className={step >= 2 ? 'is-active' : ''} /><span className={step >= 3 ? 'is-active' : ''} /></div><strong>Step {step} of 3</strong></div>
      {error && <div className="inline-error">{error}</div>}

      {step === 1 && <div className="onboarding-content"><p className="eyebrow">WELCOME TO SEEKITO</p><h1>Let&apos;s shape your learning path.</h1><p className="onboarding-lead">Tell us a little about your starting point. There are no wrong answers — this simply helps us make the first practice set useful.</p><label className="onboarding-field">What are you working towards?<select value={goal} onChange={(event) => setGoal(event.target.value)}><option>Build strong foundations</option><option>Prepare for an assessment</option><option>Catch up on missed topics</option><option>Stretch my understanding</option></select></label><label className="onboarding-field">What level are you studying?<select value={level} onChange={(event) => setLevel(event.target.value)}><option>Grade 8</option><option>Grade 9</option><option>Grade 10</option><option>Early secondary</option></select></label><div className="onboarding-actions"><span /><button className="primary-button" onClick={() => setStep(2)}>Continue <span>→</span></button></div></div>}

      {step === 2 && <div className="onboarding-content"><p className="eyebrow">STEP 2 · SUBJECT AND TOPICS</p><h1>Where would you like to begin?</h1><p className="onboarding-lead">Choose a subject, then select one or more topics. Seekito will use these choices to shape your learning path.</p><div className="subject-options">{subjectOptions.map((option) => <button key={option.id} type="button" className={subject === option.id ? 'subject-card is-selected' : 'subject-card'} onClick={() => chooseSubject(option.id)}><span className="subject-icon">{option.icon}</span><span><strong>{option.label}</strong><small>{option.description}</small></span><b>{subject === option.id ? 'Selected' : 'Choose'}</b></button>)}</div><p className="onboarding-label">TOPICS TO INCLUDE · {activeSubject.label.toUpperCase()}</p><div className="topic-grid">{subjectConcepts.map((concept) => <button key={concept.id} type="button" className={selected.includes(concept.name) ? 'topic-chip is-selected' : 'topic-chip'} onClick={() => toggleTopic(concept.name)}><span>{selected.includes(concept.name) ? '✓' : '+'}</span>{concept.name}<small>Include</small></button>)}</div><div className="onboarding-note">ⓘ The diagnostic is not a final exam. There are no grades — only signals that shape your learning path.</div><div className="onboarding-actions"><button className="secondary-button" onClick={() => setStep(1)}>Back</button><button className="primary-button" disabled={!selected.length} onClick={() => setStep(3)}>Continue <span>→</span></button></div></div>}

      {step === 3 && <div className="onboarding-content"><p className="eyebrow">STEP 3 · YOUR LEARNING PREFERENCES</p><h1>How should Seekito support you?</h1><p className="onboarding-lead">These preferences help us shape explanations and pacing. You can change them later.</p><label className="onboarding-field">How confident do you feel right now?<select value={confidence} onChange={(event) => setConfidence(event.target.value)}><option>Just starting</option><option>Somewhat confident</option><option>Comfortable</option><option>Very confident</option></select></label><label className="onboarding-field">How much time can you practice?<select value={practiceTime} onChange={(event) => setPracticeTime(event.target.value)}><option>10 minutes a day</option><option>20 minutes a day</option><option>30 minutes a day</option><option>A few times per week</option></select></label><label className="onboarding-field">What kind of help works best?<select value={helpStyle} onChange={(event) => setHelpStyle(event.target.value)}><option>Short explanations</option><option>Worked examples</option><option>Practice questions</option><option>Hints when I&apos;m stuck</option></select></label><div className="onboarding-note">ⓘ Your first diagnostic will use your selected topic and preferences. Every answer becomes evidence for your learner state.</div><div className="onboarding-actions"><button className="secondary-button" onClick={() => setStep(2)}>Back</button><button className="primary-button" onClick={startDiagnostic}>Start diagnostic <span>→</span></button></div></div>}
    </section>
  </main>
}
