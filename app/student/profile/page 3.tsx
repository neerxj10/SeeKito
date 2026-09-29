'use client'

import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

const stats = [
  { value: '7', label: 'Concepts selected', detail: 'Across 2 subjects' },
  { value: '56%', label: 'Overall mastery', detail: 'Based on your evidence' },
  { value: '0', label: 'Practice streak', detail: 'Start a session today' },
]

export default function ProfilePage() {
  const router = useRouter()
  function logout() { sessionStorage.clear(); localStorage.removeItem('seekito-theme'); router.push('/auth/login') }

  return <AppShell eyebrow="Student space" title="Your profile" description="Your learning preferences, progress snapshot, and account controls in one place.">
    <div className="profile-page">
      <section className="profile-hero-card"><div className="profile-hero-main"><div className="profile-avatar profile-avatar-large">A</div><div><p className="eyebrow">DEMO STUDENT</p><h2>Alex Carter</h2><p className="profile-email">alex@example.com</p><span className="profile-status"><i /> Active learning profile</span></div></div><button className="profile-outline-button" type="button" onClick={() => router.push('/student/onboarding')}>Edit learning profile <span>→</span></button></section>
      <section className="profile-stats-grid" aria-label="Learning summary">{stats.map((stat) => <article className="profile-stat" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span><small>{stat.detail}</small></article>)}</section>
      <div className="profile-content-grid">
        <section className="profile-panel"><div className="profile-panel-heading"><div><p className="eyebrow">LEARNING PROFILE</p><h2>Your path, your pace</h2></div><span className="profile-panel-icon">✦</span></div><p className="profile-panel-copy">SeeKito uses your selected subjects, attempts, confidence, hint usage, and response time to choose the next best learning step.</p><div className="profile-preference-list"><div><span className="profile-preference-icon">◈</span><span><strong>Subjects</strong><small>Mathematics and Science</small></span><button type="button" onClick={() => router.push('/student/onboarding')}>Change</button></div><div><span className="profile-preference-icon">◷</span><span><strong>Practice goal</strong><small>Build durable understanding</small></span><button type="button" onClick={() => router.push('/student/onboarding')}>Change</button></div><div><span className="profile-preference-icon">⌁</span><span><strong>Support style</strong><small>Worked examples and clear explanations</small></span><button type="button" onClick={() => router.push('/student/onboarding')}>Change</button></div></div></section>
        <section className="profile-panel profile-data-panel"><p className="eyebrow">YOUR DATA</p><h2>Learning evidence stays explainable.</h2><p className="profile-panel-copy">Every answer becomes a traceable signal. You can review what was captured and why SeeKito recommended your next step.</p><div className="profile-data-links"><button type="button" onClick={() => router.push('/student/history')}>View evidence history <span>→</span></button><button type="button" onClick={() => router.push('/student/progress')}>View progress analytics <span>→</span></button></div></section>
      </div>
      <section className="profile-account-panel"><div><p className="eyebrow">ACCOUNT</p><h2>Sign out of this workspace</h2><p>End this demo session on this device. Your saved learning evidence is not deleted.</p></div><button className="profile-logout-button" type="button" onClick={logout}><span>↪</span> Log out</button></section>
    </div>
  </AppShell>
}
