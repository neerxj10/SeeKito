'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'

const preferences = [
  ['◈', 'Selected Subjects', 'Mathematics · Science'],
  ['▱', 'Learning Level', 'Grade 9 · Intermediate'],
  ['⚑', 'Learning Goal', 'Build stronger foundations'],
  ['◷', 'Daily Practice Time', '20 minutes / day'],
  ['▣', 'Explanation Style', 'Step-by-step walkthroughs'],
  ['⌁', 'Difficulty Preference', 'Auto-adaptive (recommended)'],
  ['♧', 'Reminder Preference', 'Daily at 7:00 PM'],
]

export default function ProfilePage() {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('Alex Carter')
  const [email, setEmail] = useState('alex.carter@school.edu')
  const [saved, setSaved] = useState(false)
  useEffect(() => { try { const stored = JSON.parse(localStorage.getItem('seekito-profile') ?? '{}') as { name?: string; email?: string }; if (stored.name) setName(stored.name); if (stored.email) setEmail(stored.email) } catch { /* use demo profile */ } }, [])
  function logout() { sessionStorage.clear(); localStorage.removeItem('seekito-theme'); router.push('/auth/login') }
  function saveProfile() { localStorage.setItem('seekito-profile', JSON.stringify({ name, email })); window.dispatchEvent(new Event('seekito-profile-updated')); setEditing(false); setSaved(true); window.setTimeout(() => setSaved(false), 2600) }

  return <AppShell eyebrow="Student space" title="Your profile" description="Manage your learning identity, preferences, and account settings.">
    <div className="profile-page profile-reference-layout">
      <section className="profile-identity-card"><div className="profile-identity"><div className="profile-avatar profile-avatar-large">{name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><h2>{name}</h2><p>{email}</p><div className="profile-meta"><span>● Active Learner</span><small>Member since January 2025</small><small>Grade 9 · Algebra Foundations</small></div></div></div><div className="profile-identity-actions"><button type="button" onClick={() => setEditing(true)}>✎ &nbsp;Edit Profile</button><button type="button">↗ &nbsp;Share</button></div></section>
      <section><div className="profile-section-heading"><h2>Learning Snapshot</h2></div><div className="profile-snapshot-grid"><article><span>◎</span><div><small>Overall Mastery</small><strong>64%</strong><em>+6% this week</em></div></article><article><span>◌</span><div><small>Concepts Done</small><strong>7 / 12</strong><em>4 mastered</em></div></article><article><span>Σ</span><div><small>Current Subject</small><strong>Algebra</strong><em>Mathematics</em></div></article><article><span>♨</span><div><small>Practice Streak</small><strong>9 days</strong><em>Best: 14 days</em></div></article><article><span>▤</span><div><small>Evidence Captured</small><strong>48</strong><em>Attempts total</em></div></article></div></section>
      <div className="profile-main-grid">
        <section className="profile-panel preferences-panel"><div className="profile-section-heading"><div><h2>Learning Preferences</h2><p>Control how SeeKito adapts to you. These shape your recommendations.</p></div><button type="button" onClick={() => router.push('/student/onboarding')}>✎ Edit all</button></div><div className="profile-preference-list">{preferences.map(([icon, label, value]) => <div key={label}><span className="profile-preference-icon">{icon}</span><span><small>{label}</small><strong>{value}</strong></span><button type="button" onClick={() => router.push('/student/onboarding')}>Edit</button></div>)}</div></section>
        <section className="profile-panel current-path-panel"><div className="profile-section-heading"><h2>Current Learning Path</h2></div><div className="profile-focus-card"><div className="profile-focus-top"><span>CURRENT FOCUS</span><b>• REMEDIATE</b></div><h3>Factorisation</h3><small>Mathematics · Algebra</small><div className="profile-meter"><label>Mastery <strong>43%</strong></label><i><span style={{ width: '43%' }} /></i></div><div className="profile-meter"><label>Confidence <strong>67%</strong></label><i><span className="confidence" style={{ width: '67%' }} /></i></div><button type="button" onClick={() => router.push('/student/learn')}>▷ Continue Learning</button></div><div className="profile-next-card"><small>NEXT PREREQUISITE</small><strong>▢ &nbsp; Quadratic Equations</strong><span>Unlocks at 60% Factorisation mastery</span></div></section>
      </div>
      <section className="profile-panel evidence-reference-panel"><div className="profile-section-heading"><div><h2>Evidence &amp; Privacy</h2><p>SeeKito records learning evidence to fuel adaptive decisions — not to grade you.</p></div><button type="button" onClick={() => router.push('/student/history')}>View evidence history →</button></div><div className="profile-evidence-grid"><article><span>◉</span><strong>Answer correctness</strong><small>Shapes mastery and accuracy signals</small></article><article><span>♧</span><strong>Hint usage</strong><small>Indicates concept confidence</small></article><article><span>◷</span><strong>Response time</strong><small>Detects fluency and uncertainty</small></article><article><span>↔</span><strong>Attempt history</strong><small>Tracks improvement over time</small></article></div><div className="profile-data-links"><button type="button" onClick={() => router.push('/student/history')}>◉ Full evidence history</button><button type="button">◌ Privacy settings</button><button type="button">⇩ Export my data</button></div></section>
      <div className="profile-bottom-grid"><section className="profile-panel account-settings-panel"><div className="profile-section-heading"><h2>Account Settings</h2></div><button type="button">▣ <span><strong>Change Password</strong><small>Last changed 3 months ago</small></span><b>›</b></button><button type="button">♧ <span><strong>Notification Settings</strong><small>Daily reminders on</small></span><b>›</b></button><button type="button">☼ <span><strong>Theme</strong><small>Use the app theme toggle</small></span><b>›</b></button><button type="button">? <span><strong>Help &amp; Support</strong><small>Documentation, FAQs</small></span><b>›</b></button><button className="profile-signout-button" type="button" onClick={logout}>↪ &nbsp; Sign Out</button></section><div className="profile-danger-stack"><section className="profile-panel danger-panel"><p className="eyebrow">DANGER ZONE</p><h2>Delete your account</h2><p>Deleting your account permanently removes all learning data and history.</p><button type="button">Delete my account</button></section><div className="profile-saved-message"><span>✓</span><div><strong>Preferences saved</strong><small>Your learning preferences have been updated.</small></div><button type="button">×</button></div></div></div>
      {saved && <div className="profile-toast">✓ Profile updated successfully.</div>}
      {editing && <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(false) }}><section className="profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title"><button className="profile-modal-close" type="button" aria-label="Close edit profile" onClick={() => setEditing(false)}>×</button><p className="eyebrow">PROFILE DETAILS</p><h2 id="edit-profile-title">Edit your profile</h2><p>Update the name and email shown across your student workspace.</p><label>Full name<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><div className="profile-modal-actions"><button className="secondary-button" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" type="button" disabled={!name.trim() || !email.trim()} onClick={saveProfile}>Save changes</button></div></section></div>}
    </div>
  </AppShell>
}
