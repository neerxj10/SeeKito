'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'
import { Icon, SeekitoLogo, SeekitoMascot } from '@/components/seekito/SeekitoUI'

type Role = 'teacher' | 'admin'
type NavItem = { href: string; label: string; icon: 'grid' | 'map' | 'chart' | 'history' | 'spark' | 'lock' | 'users' | 'brain' | 'siren' | 'scroll' | 'settings' }

const navByRole: Record<Role, NavItem[]> = {
  teacher: [
    { href: '/teacher', label: 'Overview', icon: 'grid' }, { href: '/teacher/students', label: 'Students', icon: 'users' }, { href: '/teacher/learner-states', label: 'Learner States', icon: 'brain' }, { href: '/teacher/overrides', label: 'Interventions', icon: 'siren' }, { href: '/teacher/insights', label: 'Decision History', icon: 'scroll' }, { href: '/teacher/analytics', label: 'Analytics', icon: 'chart' }, { href: '/teacher/simulation', label: 'Replay lab', icon: 'spark' }, { href: '/teacher', label: 'Settings', icon: 'settings' },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: 'grid' }, { href: '/admin/users', label: 'Users', icon: 'history' }, { href: '/admin/students', label: 'Students', icon: 'history' }, { href: '/admin/teachers', label: 'Teachers', icon: 'history' }, { href: '/admin/concepts', label: 'Concepts', icon: 'map' }, { href: '/admin/system', label: 'System health', icon: 'chart' }, { href: '/admin/audit', label: 'Audit logs', icon: 'lock' },
  ],
}

export function RoleShell({ role, children, eyebrow, title, description }: { role: Role; children: ReactNode; eyebrow: string; title: string; description: string }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false)
  const roleLabel = role === 'teacher' ? 'Teacher intelligence' : 'System intelligence'
  return <div className="role-shell"><aside className={`role-sidebar ${open ? 'is-open' : ''}`}><div className="role-brand"><SeekitoLogo /><span>{roleLabel}</span></div><div className="role-mascot-strip"><SeekitoMascot size="small" /><span><small>ACTIVE ROLE</small><strong>{role === 'teacher' ? 'Teacher workspace' : 'Admin workspace'}</strong></span></div><nav aria-label={`${role} navigation`}>{navByRole[role].map((item) => { const duplicate = (role === 'teacher' && ['Analytics', 'Settings'].includes(item.label)); const active = pathname === item.href && !duplicate; return <Link key={item.label} href={item.href as any} className={active ? 'role-nav-link active' : 'role-nav-link'} onClick={() => setOpen(false)}><Icon name={item.icon} />{item.label}</Link> })}</nav><div className="role-sidebar-footer"><Link href="/student" className="role-switch-link">Open student space <Icon name="arrow" /></Link><div className="role-profile"><span>{role === 'teacher' ? 'T' : 'A'}</span><strong>{role === 'teacher' ? 'Teacher profile' : 'Admin profile'}</strong></div></div></aside>{open && <button className="role-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}<div className="role-main"><header className="role-header"><button className="role-mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation">☰</button><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><div className="role-header-actions"><button className="icon-button" aria-label="Notifications"><Icon name="history" /></button><button className="role-role-chip" onClick={() => router.push((role === 'teacher' ? '/admin' : '/teacher') as any)}>{role === 'teacher' ? 'Teacher' : 'Admin'}</button></div></header><main className="role-content">{children}</main></div></div>
}

export function RoleDataBoundary({ role, title, description }: { role: Role; title: string; description: string }) {
  return <RoleShell role={role} eyebrow={role === 'teacher' ? 'Teacher intelligence' : 'System intelligence'} title={title} description={description}><section className="role-empty-state"><div className="role-empty-visual"><SeekitoMascot size="large" /><span /></div><p className="eyebrow">{role === 'teacher' ? 'TEACHER DATA BOUNDARY' : 'ADMIN DATA BOUNDARY'}</p><h2>Workspace ready for real {role} data.</h2><p>The current Seekito backend exposes authenticated student learning data only. This role surface is ready for integration when class, user, override, and audit APIs are enabled.</p><div className="role-empty-grid"><div><strong>What is connected</strong><span>Shared design system, navigation, responsive shell, and role boundary.</span></div><div><strong>What is protected</strong><span>No fabricated metrics, no fake learner records, and no authorization bypass.</span></div></div></section></RoleShell>
}
