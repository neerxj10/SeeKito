'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { RoleShell } from '@/components/layout/RoleShell'

type Student = { id: string; initials: string; name: string; stage: string; mastery: number; uncertainty: number; recommendation: string; lastActive: string; status: string }
export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]); const [filter, setFilter] = useState('All'); const [query, setQuery] = useState('')
  useEffect(() => { const sync = () => { let name = ''; try { name = JSON.parse(localStorage.getItem('seekito-profile') ?? '{}').name?.trim() ?? '' } catch {} fetch('/api/teacher/workspace').then((r) => r.json()).then((d) => { const next = d.workspace?.students ?? []; if (name && next[0]) next[0] = { ...next[0], name, initials: name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() }; setStudents(next) }) }; sync(); window.addEventListener('seekito-profile-updated', sync); return () => window.removeEventListener('seekito-profile-updated', sync) }, [])
  const visible = useMemo(() => students.filter((s) => (filter === 'All' || s.status === filter) && s.name.toLowerCase().includes(query.toLowerCase())), [students, filter, query])
  return <RoleShell role="teacher" eyebrow="Teacher console" title="Students" description="A clear view of mastery, uncertainty, and the next best action for every learner.">
    <div className="teacher-demo-page"><div className="teacher-demo-actions"><span className="teacher-live-status"><i /> 4 learner profiles ready</span><Link className="role-dark-button" href="/teacher/overrides">Open intervention desk</Link></div>
      <section className="teacher-table-card"><div className="teacher-filter-row">{['All', 'At risk', 'Needs attention', 'Improving'].map((item) => <button className={`filter-chip ${filter === item ? 'active' : ''}`} key={item} onClick={() => setFilter(item)}>{item}</button>)}<input className="teacher-search" placeholder="Search students…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="teacher-student-table"><div className="teacher-table-heading"><span>STUDENT</span><span>STAGE</span><span>MASTERY</span><span>UNCERTAINTY</span><span>RECOMMENDATION</span><span>LAST ACTIVE</span></div>{visible.map((s) => <Link className="teacher-table-row" href={`/teacher/students?student=${s.id}`} key={s.id}><span className="teacher-student-name"><b>{s.initials}</b><strong>{s.name}</strong></span><span>{s.stage}</span><strong>{s.mastery}%</strong><span className="uncertainty-cell"><i style={{ width: `${s.uncertainty * 2.5}%` }} />{s.uncertainty}%</span><span><em className={`teacher-tag ${s.recommendation === 'ADVANCE' || s.recommendation === 'CHALLENGE' ? 'good' : 'warn'}`}>{s.recommendation}</em></span><span>{s.lastActive}</span></Link>)}</div>{visible.length === 0 && <div className="teacher-loading">No learners match this filter.</div>}</section>
      <section className="teacher-proof-card"><p className="eyebrow">EXPLAINABLE INTERVENTIONS</p><h2>See the “why” before you change the “what”.</h2><p>Recommendations are derived from captured evidence, learner state, and prerequisite checks. Use the intervention desk to record an auditable override.</p><Link className="teacher-link" href="/teacher/insights">Review decision history →</Link></section>
    </div>
  </RoleShell>
}
