'use client'

import { useState } from 'react'
import { RoleShell } from '@/components/layout/RoleShell'

const alex = '00000000-0000-0000-0000-000000000001'
const fractions = '10000000-0000-4000-8000-000000000002'

export default function TeacherOverridesPage() {
  const [decision, setDecision] = useState('review')
  const [reason, setReason] = useState('Student demonstrated additional mastery in classroom assessment.')
  const [message, setMessage] = useState<string | null>(null)
  async function applyOverride() {
    const response = await fetch('/api/teacher/overrides', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ studentId: alex, conceptId: fractions, previousAction: 'practice', newAction: decision, reason }) })
    const body = await response.json()
    const errorMessage = typeof body.error === 'string' ? body.error : 'Please provide a longer reason before applying the override.'
    setMessage(response.ok ? `Override recorded at ${new Date(body.override.createdAt ?? body.override.created_at).toLocaleTimeString()}.` : errorMessage)
  }
  return <RoleShell role="teacher" eyebrow="Teacher console" title="Intervention desk" description="Make a deliberate, auditable adjustment when classroom evidence adds context."><div className="teacher-demo-page"><section className="teacher-override-card"><div className="teacher-override-heading"><div><p className="eyebrow">ALEX CARTER · ALGEBRA FOUNDATIONS</p><h2>Override recommendation</h2></div><span className="teacher-tag warn">CURRENT · PRACTICE FRACTIONS</span></div><div className="teacher-current-decision"><span>Current engine decision</span><strong>Practice Fractions</strong><b>82% confidence</b></div><label>New decision<select value={decision} onChange={(event) => setDecision(event.target.value)}>{[['practice', 'Practice'], ['review', 'Review'], ['remediation', 'Remediate'], ['advance', 'Advance'], ['teacher_intervention', 'Teacher intervention']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label><div className="teacher-audit-note">This override is recorded with the teacher, previous action, new action, reason, and timestamp.</div>{message && <div className="teacher-success">{message}</div>}<button className="role-dark-button teacher-apply" onClick={applyOverride}>Apply override</button></section></div></RoleShell>
}
