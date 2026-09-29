'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Icon, SeekitoLogo } from '@/components/seekito/SeekitoUI'

const navigation = [
  { href: '/student', label: 'Dashboard', icon: 'grid' as const },
  { href: '/student/learn', label: 'Learn', icon: 'book' as const },
  { href: '/student/ai', label: 'SeeKito AI', icon: 'spark' as const },
  { href: '/student/practice', label: 'Practice', icon: 'pen' as const },
  { href: '/student/progress', label: 'Progress', icon: 'chart' as const },
  { href: '/student/concepts', label: 'Concept Map', icon: 'map' as const },
  { href: '/student/history', label: 'History', icon: 'history' as const },
  { href: '/student/profile', label: 'Profile', icon: 'user' as const },
] as const

export function AppShell({ children, eyebrow, title, description, headerActions }: { children: React.ReactNode; eyebrow: string; title?: string; description?: string; headerActions?: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileName, setProfileName] = useState('Alex Carter')
  const [practiceCount, setPracticeCount] = useState(0)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState([
    { id: 'focus', title: 'Your next focus is ready', copy: 'Continue building evidence for your current concept.', href: '/student/learn', time: 'Now', unread: true },
    { id: 'practice', title: 'Practice keeps your path moving', copy: 'A short adaptive session is waiting for you.', href: '/student/practice', time: 'Today', unread: true },
    { id: 'evidence', title: 'Evidence loop is active', copy: 'Your answers, hints, and timing shape recommendations.', href: '/student/history', time: 'Earlier', unread: false },
  ])
  useEffect(() => { const syncProfile = () => { try { const stored = JSON.parse(localStorage.getItem('seekito-profile') ?? '{}') as { name?: string }; if (stored.name?.trim()) setProfileName(stored.name.trim()) } catch { /* use demo profile */ } }; syncProfile(); window.addEventListener('seekito-profile-updated', syncProfile); return () => window.removeEventListener('seekito-profile-updated', syncProfile) }, [])
  useEffect(() => { fetch('/api/concepts').then((response) => response.json()).then((conceptBody) => fetch('/api/learner-state').then((response) => response.json()).then((stateBody) => { const states = new Map<string, number>((stateBody.learnerState ?? []).map((state: { concept_id: string; mastery_score: number }) => [state.concept_id, Number(state.mastery_score)] as [string, number])); const count = (conceptBody.concepts ?? []).filter((concept: { id: string }) => (states.get(concept.id) ?? 0) < 75).length; setPracticeCount(count) })).catch(() => undefined) }, [])
  useEffect(() => { if (!notificationsOpen) return; const closeOnOutsideClick = (event: MouseEvent) => { if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setNotificationsOpen(false) }; document.addEventListener('mousedown', closeOnOutsideClick); return () => document.removeEventListener('mousedown', closeOnOutsideClick) }, [notificationsOpen])
  return <div className="app-shell"><div className="ambient-field" aria-hidden="true"><span /><span /><span /></div>
    <aside className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <div className="brand-lockup"><SeekitoLogo /></div>
      <p className="sidebar-caption">Student Space</p>
      <div className="sidebar-context"><span className="context-pulse" /><span><small>ACTIVE SPACE</small><strong>Student workspace</strong></span></div>
      <nav aria-label="Primary navigation">{navigation.map((item) => { const active = item.href === '/student' ? pathname === '/student' : pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link key={`${item.label}-${item.href}`} href={item.href as never} className={active ? 'nav-link active' : 'nav-link'} onClick={() => setMobileOpen(false)}><span className="nav-icon" aria-hidden="true"><Icon name={item.icon} /></span>{item.label}{item.label === 'Practice' && practiceCount > 0 && <span className="nav-badge">{practiceCount}</span>}</Link> })}</nav>
      <div className="sidebar-footer"><div className="engine-status"><span className="engine-status-icon"><Icon name="spark" /></span><span><strong>Decision Engine v2.4</strong><small>All systems nominal</small></span></div>{process.env.NEXT_PUBLIC_SEEKITO_DEMO_MODE === 'true' && <button className="demo-reset-button" onClick={async () => { await fetch('/api/demo/reset', { method: 'POST' }); window.location.reload() }}>Reset demo</button>}<div className="profile-chip"><span className="profile-avatar">{profileName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span><strong>{profileName}</strong><small>{process.env.NEXT_PUBLIC_SEEKITO_DEMO_MODE === 'true' ? 'Demo Student · Algebra Foundations' : 'Algebra Foundations'}</small></span><span className="profile-chevron">⌃</span></div></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="app-main"><header className="app-header"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button><div className="header-copy">{eyebrow && <p className="eyebrow">{eyebrow}</p>}{title && <h1>{title}</h1>}{description && <p>{description}</p>}</div><div className="topbar-actions">{headerActions}<div className="notification-wrap" ref={notificationRef}><button className="icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Icon name="bell" />{notifications.some((item) => item.unread) && <span className="notification-dot" />}</button>{notificationsOpen && <section className="notification-popover" aria-label="Notification center"><div className="notification-popover-head"><div><p className="eyebrow">INBOX</p><h2>Notifications</h2></div><button type="button" onClick={() => setNotifications((items) => items.map((item) => ({ ...item, unread: false })))}>Mark all read</button></div><div className="notification-list">{notifications.length ? notifications.map((item) => <Link href={item.href as never} className={`notification-item ${item.unread ? 'is-unread' : ''}`} key={item.id} onClick={() => { setNotificationsOpen(false); setNotifications((items) => items.filter((entry) => entry.id !== item.id)) }}><span className="notification-item-icon"><Icon name={item.id === 'practice' ? 'pen' : item.id === 'evidence' ? 'database' : 'spark'} /></span><span><strong>{item.title}</strong><small>{item.copy}</small><em>{item.time}</em></span>{item.unread && <i />}</Link>) : <p className="notification-empty">You’re all caught up.</p>}</div>{notifications.length > 0 && <Link href="/student/history" className="notification-view-all" onClick={() => setNotificationsOpen(false)}>View evidence history →</Link>}</section>}</div></div></header><main className="app-content">{children}</main></div>
  </div>
}
