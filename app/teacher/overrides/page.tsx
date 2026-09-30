'use client'

import { useEffect, useState } from 'react'
import { RoleShell } from '@/components/layout/RoleShell'

const alex = '00000000-0000-0000-0000-000000000001'
const fractions = '10000000-0000-4000-8000-000000000002'
type Student = { id: string; name: string; stage: string; recommendation: string; mastery: number }

export default function TeacherOverridesPage() {
  const [decision, setDecision] = useState('review')
  const [reason, setReason] = useState('Student demonstrated additional mastery in classroom assessment.')
  const [message, setMessage] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Array<{ id: string; concept: string; action: string; reason: string; createdAt?: string; created_at?: string }>>([])
  const [students, setStudents] = useState<Student[]>([])
  const [studentId, setStudentId] = useState(alex)
  useEffect(() => { const sync = () => { let profileName = ''; try { profileName = JSON.parse(localStorage.getItem('seekito-profile') ?? '{}').name?.trim() ?? '' } catch {} Promise.all([fetch('/api/teacher/overrides').then((response) => response.json()), fetch('/api/teacher/workspace').then((response) => response.json())]).then(([overrideBody, workspaceBody]) => { setOverrides(overrideBody.overrides ?? []); let roster = workspaceBody.workspace?.students ?? []; if (profileName && roster[0]) roster = [{ ...roster[0], name: profileName, initials: profileName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() }, ...roster.slice(1)]; setStudents(roster); setStudentId((current) => roster.some((student: Student) => student.id === current) ? current : roster[0]?.id ?? alex) }) }; sync(); window.addEventListener('seekito-profile-updated', sync); return () => window.removeEventListener('seekito-profile-updated', sync) }, [message])
  const selectedStudent = students.find((student) => student.id === studentId) ?? students[0]
  async function applyOverride() {
    const response = await fetch('/api/teacher/overrides', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ studentId: studentId || alex, conceptId: fractions, previousAction: 'practice', newAction: decision, reason }) })
    const body = await response.json()
    const errorMessage = typeof body.error === 'string' ? body.error : 'Please provide a longer reason before applying the override.'
    setMessage(response.ok ? `Override recorded at ${new Date(body.override.createdAt ?? body.override.created_at).toLocaleTimeString()}.` : errorMessage)
  }
  return <RoleShell role="teacher" eyebrow="Teacher console" title="Intervention desk" description="Make a deliberate, auditable adjustment when classroom evidence adds context."><div className="teacher-demo-page"><section className="teacher-override-card"><div className="teacher-override-heading"><div><p className="eyebrow">SELECT LEARNER</p><h2>Override recommendation</h2></div><span className="teacher-tag warn">CURRENT · {selectedStudent?.recommendation ?? 'PRACTICE FRACTIONS'}</span></div><label>Student<select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.stage}</option>)}</select></label><div className="teacher-current-decision"><span>Current engine decision</span><strong>{selectedStudent?.recommendation ?? 'Practice Fractions'}</strong><b>{selectedStudent?.mastery ?? 56}% mastery</b></div><label>New decision<select value={decision} onChange={(event) => setDecision(event.target.value)}>{[['practice', 'Practice'], ['review', 'Review'], ['remediation', 'Remediate'], ['advance', 'Advance'], ['teacher_intervention', 'Teacher intervention']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label><div className="teacher-audit-note">This override is recorded with the teacher, previous action, new action, reason, and timestamp.</div>{message && <div className="teacher-success">{message}</div>}<button className="role-dark-button teacher-apply" onClick={applyOverride} disabled={!students.length}>Apply override</button></section><section className="teacher-proof-card"><p className="eyebrow">OVERRIDE HISTORY</p><h2>Recent interventions</h2>{overrides.length ? overrides.map((item) => <div className="teacher-history-row" key={item.id}><small>{item.createdAt ?? item.created_at ? new Date(item.createdAt ?? item.created_at!).toLocaleString() : 'Recent'}</small><strong>{item.action.toUpperCase()}</strong><span>{item.concept}</span><small>{item.reason}</small></div>) : <p className="muted">No overrides recorded yet.</p>}</section></div></RoleShell>
}
