'use client'

import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

export default function ProfilePage() {
  const router = useRouter()
  return <AppShell eyebrow="Student space" title="Your profile" description="Manage your learning space and understand the data Seekito uses to adapt your path."><div className="profile-page"><section className="profile-card"><div className="profile-avatar large">A</div><div><p className="eyebrow">DEMO STUDENT</p><h2>Alex Carter</h2><p>alex@example.com</p></div></section><section className="profile-card"><p className="eyebrow">LEARNING PROFILE</p><h2>Algebra Foundations</h2><p>Your selected subjects, attempts, evidence, and learner state are used to choose the next learning step. You can change preferences from onboarding in the full account flow.</p><div className="profile-tags"><span>Mathematics</span><span>Science</span></div></section><button className="secondary-button" onClick={() => { sessionStorage.clear(); router.push('/auth/login') }}>Log out</button></div></AppShell>
}
