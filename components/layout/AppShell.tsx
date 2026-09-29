'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Icon, SeekitoLogo } from '@/components/seekito/SeekitoUI'

const navigation = [
  { href: '/student', label: 'Dashboard', icon: 'grid' as const },
  { href: '/student/learn', label: 'Learn', icon: 'book' as const },
  { href: '/student/practice', label: 'Practice', icon: 'pen' as const },
  { href: '/student/progress', label: 'Progress', icon: 'chart' as const },
  { href: '/student/history', label: 'History', icon: 'history' as const },
  { href: '/student', label: 'Profile', icon: 'user' as const },
] as const

export function AppShell({ children, eyebrow, title, description, headerActions }: { children: React.ReactNode; eyebrow: string; title?: string; description?: string; headerActions?: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  return <div className="app-shell"><div className="ambient-field" aria-hidden="true"><span /><span /><span /></div>
    <aside className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <div className="brand-lockup"><SeekitoLogo /></div>
      <p className="sidebar-caption">Student Space</p>
      <div className="sidebar-context"><span className="context-pulse" /><span><small>ACTIVE SPACE</small><strong>Student workspace</strong></span></div>
      <nav aria-label="Primary navigation">{navigation.map((item, index) => { const isProfile = index === navigation.length - 1; const active = !isProfile && (item.href === '/student' ? pathname === '/student' : pathname === item.href || pathname.startsWith(`${item.href}/`)); return <Link key={`${item.label}-${item.href}`} href={item.href} className={active ? 'nav-link active' : 'nav-link'} onClick={() => setMobileOpen(false)}><span className="nav-icon" aria-hidden="true"><Icon name={item.icon} /></span>{item.label}{item.label === 'Practice' && <span className="nav-badge">3</span>}</Link> })}</nav>
      <div className="sidebar-footer"><div className="engine-status"><span className="engine-status-icon"><Icon name="spark" /></span><span><strong>Decision Engine v2.4</strong><small>All systems nominal</small></span></div>{process.env.NEXT_PUBLIC_SEEKITO_DEMO_MODE === 'true' && <button className="demo-reset-button" onClick={async () => { await fetch('/api/demo/reset', { method: 'POST' }); window.location.reload() }}>Reset demo</button>}<div className="profile-chip"><span className="profile-avatar">A</span><span><strong>Alex Carter</strong><small>{process.env.NEXT_PUBLIC_SEEKITO_DEMO_MODE === 'true' ? 'Demo Student · Algebra Foundations' : 'Algebra Foundations'}</small></span><span className="profile-chevron">⌃</span></div></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="app-main"><header className="app-header"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button><div className="header-copy"><p className="eyebrow">{eyebrow}</p>{title && <h1>{title}</h1>}{description && <p>{description}</p>}</div><div className="topbar-actions">{headerActions}<button className="icon-button" aria-label="Notifications"><Icon name="bell" /><span className="notification-dot" /></button><div className="header-status"><span className="status-dot" /> Secure workspace</div></div></header><main className="app-content">{children}</main></div>
  </div>
}
