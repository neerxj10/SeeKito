'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { RoleShell } from '@/components/layout/RoleShell'

type Student = { id: string; initials: string; name: string; stage: string; mastery: number; uncertainty: number; recommendation: string; lastActive: string; status: string }
type TeacherData = { stats: { students: number; atRisk: number; needsReview: number; improving: number }; students: Student[] }

export default function TeacherPage() {
  const [data, setData] = useState<TeacherData | null>(null)
  useEffect(() => { fetch('/api/demo/teacher').then((r) => r.json()).then(setData) }, [])
  return <RoleShell role="teacher" eyebrow="Teacher console" title="Class Overview" description="Grade 9 · Algebra · 32 students · Updated just now">
    <div className="teacher-demo-page">
      <div className="teacher-demo-actions"><span className="teacher-live-status"><i /> Demo data connected</span><button className="role-dark-button">Generate Practice</button></div>
      <section className="teacher-metric-grid">{[['STUDENTS', data?.stats.students ?? '—', '2 new vs last week'], ['AT RISK', data?.stats.atRisk ?? '—', '−1 vs last week'], ['NEEDS REVIEW', data?.stats.needsReview ?? '—', '+2 vs last week'], ['IMPROVING', data?.stats.improving ?? '—', '+5 vs last week']].map(([label, value, note]) => <article className="teacher-metric-card" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>
      <section className="teacher-table-card"><div className="teacher-table-header"><div><p className="eyebrow">LEARNER SIGNALS</p><h2>Students who need your attention</h2></div><Link className="teacher-link" href="/teacher/students">View all students →</Link></div><div className="teacher-student-table"><div className="teacher-table-heading"><span>STUDENT</span><span>STAGE</span><span>MASTERY</span><span>RECOMMENDATION</span><span>LAST ACTIVE</span></div>{data?.students.slice(0, 4).map((student) => <Link className="teacher-table-row" href={`/teacher/students?student=${student.id}`} key={student.id}><span className="teacher-student-name"><b>{student.initials}</b><strong>{student.name}</strong></span><span>{student.stage}</span><strong>{student.mastery}%</strong><span><em className={`teacher-tag ${student.recommendation.includes('PRACTICE') || student.recommendation === 'REVIEW' ? 'warn' : 'good'}`}>{student.recommendation}</em></span><span>{student.lastActive}</span></Link>) ?? <div className="teacher-loading">Loading learner signals…</div>}</div></section>
      <section className="teacher-insight-callout"><div><p className="eyebrow">DECISION ENGINE V2.4</p><h2>Every recommendation comes with a reason.</h2><p>Review evidence, learner state, and prerequisite checks before you intervene.</p></div><Link className="role-light-button" href="/teacher/insights">Explore decision history</Link></section>
    </div>
  </RoleShell>
}
