'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SeekitoLogo } from '@/components/seekito/SeekitoUI'

type Concept = { id: string; name: string; description?: string; difficulty?: string; estimated_minutes?: number; subject: 'ALGEBRA' | 'SCIENCE' }
type Subject = 'ALGEBRA' | 'SCIENCE'

const subjectOptions: Array<{ id: Subject; label: string; description: string; icon: string }> = [
  { id: 'ALGEBRA', label: 'Mathematics', description: 'Algebra foundations', icon: '∑' },
  { id: 'SCIENCE', label: 'Science', description: 'Scientific thinking', icon: '⚗' },
]

export default function StudentOnboardingPage() {
  const [step, setStep] = useState(1)
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [fullName, setFullName] = useState('')
  const [subject, setSubject] = useState<Subject>('ALGEBRA')
  const [selected, setSelected] = useState<string[]>([])
  const [goal, setGoal] = useState('Build strong foundations')
  const [level, setLevel] = useState('')
  const [confidence, setConfidence] = useState('Somewhat confident')
  const [practiceTime, setPracticeTime] = useState('20 minutes a day')
  const [helpStyle, setHelpStyle] = useState('Worked examples')
  const [frequency, setFrequency] = useState('Most weekdays')
  const [targetDate, setTargetDate] = useState('No fixed date')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('seekito-onboarding-profile')
    if (saved) {
      try {
        const profile = JSON.parse(saved) as Partial<{ fullName: string; subject: Subject; goal: string; level: string; confidence: string; practiceTime: string; helpStyle: string; frequency: string; targetDate: string }>
        if (profile.fullName) setFullName(profile.fullName)
        if (profile.subject) setSubject(profile.subject)
        if (profile.goal) setGoal(profile.goal)
        if (profile.level) setLevel(profile.level)
        if (profile.confidence) setConfidence(profile.confidence)
        if (profile.practiceTime) setPracticeTime(profile.practiceTime)
        if (profile.helpStyle) setHelpStyle(profile.helpStyle)
        if (profile.frequency) setFrequency(profile.frequency)
        if (profile.targetDate) setTargetDate(profile.targetDate)
      } catch {
        localStorage.removeItem('seekito-onboarding-profile')
      }
    }
    fetch('/api/concepts').then((response) => response.json()).then((body) => {
      if (!body.success) throw new Error(body.error)
      const available = body.concepts as Concept[]
      setConcepts(available)
      setSelected([])
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load learning topics'))
  }, [])

  const subjectConcepts = useMemo(() => concepts.filter((concept) => concept.subject === subject), [concepts, subject])
  const selectedConcepts = useMemo(() => concepts.filter((concept) => selected.includes(concept.name)), [concepts, selected])
  const activeSubject = subjectOptions.find((option) => option.id === subject) ?? subjectOptions[0]

  function chooseSubject(nextSubject: Subject) {
    setSubject(nextSubject)
    setSelected([])
  }

  function toggleTopic(name: string) {
    setSelected((current) => current.includes(name) ? current.filter((topic) => topic !== name) : [...current, name])
  }

  function saveProfile(diagnosticStatus: 'pending' | 'skipped') {
    const ids = selectedConcepts.map((concept) => concept.id)
    const profile = { fullName: fullName.trim() || 'Learner', goal, level, confidence, practiceTime, helpStyle, frequency, targetDate, subject, conceptIds: ids, topicNames: selected, diagnosticStatus, savedAt: new Date().toISOString() }
    localStorage.setItem('seekito-onboarding-profile', JSON.stringify(profile))
    sessionStorage.setItem('seekito-onboarding', JSON.stringify(profile))
    if (fullName.trim()) {
      localStorage.setItem('seekito-profile', JSON.stringify({ name: fullName.trim(), fullName: fullName.trim() }))
      window.dispatchEvent(new Event('seekito-profile-updated'))
    }
    return ids
  }

  async function startNewLearner() {
    if (process.env.NEXT_PUBLIC_SEEKITO_DEMO_MODE !== 'false') {
      await fetch('/api/demo/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ seed: false }) })
    }
  }

  async function saveAndStartDiagnostic() {
    await startNewLearner()
    const ids = saveProfile('pending')
    if (ids.length) window.location.href = `/student/assessment/${ids[0]}?diagnostic=1`
  }

  async function skipDiagnostic() {
    await startNewLearner()
    saveProfile('skipped')
    window.location.href = '/student'
  }

  return <main className="onboarding-page">
    <Link href="/student" className="onboarding-brand"><SeekitoLogo /></Link>
    <section className="onboarding-card">
      <div className="onboarding-progress"><div>{[1, 2, 3, 4, 5].map((item) => <span key={item} className={step >= item ? 'is-active' : ''} />)}</div><strong>Step {step} of 5</strong></div>
      {error && <div className="inline-error">{error}</div>}

      {step === 1 && <div className="onboarding-content"><p className="eyebrow">STEP 1 · ABOUT YOU</p><h1>Let&apos;s shape your learning path.</h1><p className="onboarding-lead">Tell us a little about your starting point. There are no wrong answers, and you can change these choices later.</p><label className="onboarding-field">What should we call you?<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" /></label><label className="onboarding-field">What level are you studying?<select value={level} onChange={(event) => setLevel(event.target.value)}><option value="" disabled>Select your grade</option><option>Grade 8</option><option>Grade 9</option><option>Grade 10</option><option>Grade 11</option><option>Grade 12</option></select></label><div className="onboarding-actions"><span /><button className="primary-button" disabled={!level} onClick={() => setStep(2)}>Continue <span>→</span></button></div></div>}

      {step === 2 && <div className="onboarding-content"><p className="eyebrow">STEP 2 · SUBJECT AND TOPICS</p><h1>Where would you like to begin?</h1><p className="onboarding-lead">Choose a subject, then select one or more topics. Seekito will use these choices to shape your learning path.</p><div className="subject-options">{subjectOptions.map((option) => <button key={option.id} type="button" className={subject === option.id ? 'subject-card is-selected' : 'subject-card'} onClick={() => chooseSubject(option.id)}><span className="subject-icon">{option.icon}</span><span><strong>{option.label}</strong><small>{option.description}</small></span><b>{subject === option.id ? 'Selected' : 'Choose'}</b></button>)}</div><p className="onboarding-label">TOPICS TO INCLUDE · {activeSubject.label.toUpperCase()}</p><div className="topic-grid">{subjectConcepts.map((concept) => <button key={concept.id} type="button" className={selected.includes(concept.name) ? 'topic-chip is-selected' : 'topic-chip'} onClick={() => toggleTopic(concept.name)}><span>{selected.includes(concept.name) ? '✓' : '+'}</span>{concept.name}<small>Include</small></button>)}</div><div className="onboarding-note">ⓘ You can start with one subject and add another later.</div><div className="onboarding-actions"><button className="secondary-button" onClick={() => setStep(1)}>Back</button><button className="primary-button" disabled={!selected.length} onClick={() => setStep(3)}>Continue <span>→</span></button></div></div>}

      {step === 3 && <div className="onboarding-content"><p className="eyebrow">STEP 3 · YOUR PREFERENCES</p><h1>How should Seekito support you?</h1><p className="onboarding-lead">These preferences help shape explanations, pacing, and reminders. Your diagnostic evidence still determines your starting recommendation.</p><label className="onboarding-field">What are you working towards?<select value={goal} onChange={(event) => setGoal(event.target.value)}><option>Build strong foundations</option><option>Prepare for an assessment</option><option>Catch up on missed topics</option><option>Stretch my understanding</option></select></label><label className="onboarding-field">How confident do you feel right now?<select value={confidence} onChange={(event) => setConfidence(event.target.value)}><option>Just starting</option><option>Somewhat confident</option><option>Comfortable</option><option>Very confident</option></select></label><label className="onboarding-field">How much time can you practice?<select value={practiceTime} onChange={(event) => setPracticeTime(event.target.value)}><option>10 minutes a day</option><option>20 minutes a day</option><option>30 minutes a day</option><option>A few times per week</option></select></label><label className="onboarding-field">What kind of help works best?<select value={helpStyle} onChange={(event) => setHelpStyle(event.target.value)}><option>Short explanations</option><option>Worked examples</option><option>Practice questions</option><option>Hints when I&apos;m stuck</option></select></label><div className="onboarding-actions"><button className="secondary-button" onClick={() => setStep(2)}>Back</button><button className="primary-button" onClick={() => setStep(4)}>Continue <span>→</span></button></div></div>}

      {step === 4 && <div className="onboarding-content"><p className="eyebrow">STEP 4 · QUICK LEARNING CHECK</p><h1>Help us find your starting point.</h1><p className="onboarding-lead">We&apos;ll ask a few short questions about {activeSubject.label}. This is not a test and there are no grades. Your answers help us avoid repeating what you already know.</p><div className="onboarding-note"><strong>What gets recorded?</strong><br />Correctness, confidence, hints, response time, and attempts. Together these become your first learning evidence.</div><div className="onboarding-note"><strong>You stay in control.</strong><br />You can choose “I don&apos;t know”, skip the diagnostic, or complete it later from your dashboard.</div><div className="onboarding-actions"><button className="secondary-button" onClick={() => setStep(3)}>Back</button><button className="primary-button" onClick={() => setStep(5)}>Review setup <span>→</span></button></div></div>}

      {step === 5 && <div className="onboarding-content"><p className="eyebrow">STEP 5 · READY TO BEGIN</p><h1>Your learning path is ready.</h1><p className="onboarding-lead">Review your choices, then take a short diagnostic or start exploring without it.</p><div className="onboarding-review"><div><span>Learner</span><strong>{fullName.trim() || 'Learner'} · {level}</strong></div><div><span>Subjects</span><strong>{activeSubject.label} · {selected.length} topic{selected.length === 1 ? '' : 's'}</strong></div><div><span>Goal</span><strong>{goal}</strong></div><div><span>Support</span><strong>{helpStyle} · {practiceTime}</strong></div></div><div className="onboarding-note">The diagnostic gives SeeKito initial evidence. If you skip it, your first practice answers will gradually build your learner state.</div><div className="onboarding-actions"><button className="secondary-button" onClick={() => setStep(4)}>Back</button><div className="onboarding-action-group"><button className="secondary-button" onClick={skipDiagnostic}>Skip for now</button><button className="primary-button" onClick={saveAndStartDiagnostic}>Start quick check <span>→</span></button></div></div></div>}
    </section>
  </main>
}
