'use client'

import type { CSSProperties, ReactNode } from 'react'

export function SeekitoLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`seekito-logo ${compact ? 'is-compact' : ''}`}><span className="seekito-logo-orb"><img className="seekito-brand-image logo-light" src="/brand/seekito-logo-light.jpeg" alt="" /><img className="seekito-brand-image logo-dark" src="/brand/seekito-logo-dark.jpeg" alt="" /></span>{!compact && <span>Seekito</span>}</span>
}

export function SeekitoMascot({ size = 'medium', label = 'Seekito AI guide' }: { size?: 'small' | 'medium' | 'large'; label?: string }) {
  return <span className={`seekito-mascot mascot-${size}`} role="img" aria-label={label}><span className="mascot-ring" /><span className="mascot-core"><i /><i /></span></span>
}

export function GlowPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`glow-panel ${className}`}>{children}</section>
}

export function MasteryRing({ value, label = 'Mastery', size = 'medium' }: { value: number; label?: string; size?: 'small' | 'medium' | 'large' }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
  return <div className={`mastery-ring mastery-ring-${size}`} style={{ '--ring-value': `${safeValue}%` } as CSSProperties} aria-label={`${label} ${safeValue}%`}><div className="mastery-ring-inner"><strong>{safeValue}%</strong><span>{label}</span></div></div>
}

export function ConfidenceMeter({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
  return <div className="confidence-meter"><div className="confidence-meter-head"><span>Confidence</span><strong>{safeValue}%</strong></div><div className="confidence-meter-track"><span style={{ width: `${safeValue}%` }} /></div></div>
}

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'blue' }) {
  return <span className={`status-pill status-pill-${tone}`}><span className="status-pill-dot" />{children}</span>
}

export function Icon({ name }: { name: 'grid' | 'map' | 'spark' | 'chart' | 'history' | 'bell' | 'arrow' | 'lock' | 'check' | 'database' | 'brain' | 'cpu' | 'compass' | 'alert' | 'gitbranch' | 'eye' | 'user' | 'book' | 'pen' | 'users' | 'siren' | 'scroll' | 'settings' | 'chevron' | 'file' | 'lightbulb' | 'x' }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    map: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h8l2 12H7z" /></>,
    spark: <><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /><path d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7z" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /></>,
    history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /><path d="M3 4v4h4" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></>,
    brain: <><path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.5A3.5 3.5 0 0 0 7 15a3.5 3.5 0 0 0 5 3 3.5 3.5 0 0 0 5-3 3.5 3.5 0 0 0 1-6.5V8a3.5 3.5 0 0 0-3.5-3.5A3.5 3.5 0 0 0 12 6a3.5 3.5 0 0 0-2.5-1.5Z" /><path d="M12 6v12M8 9h4M12 13h4" /></>,
    cpu: <><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
    gitbranch: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M6 7v6a6 6 0 0 0 6 6h4M6 7a6 6 0 0 1 6-2h4" /></>,
    eye: <><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>,
    pen: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m13.5 7.5 3 3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    siren: <><path d="M6 18h12M4 21h16M6 18V10a6 6 0 0 1 12 0v8M12 2v2M4 5l2 1M20 5l-2 1" /></>,
    scroll: <><path d="M6 3h12v18H6a3 3 0 0 1 0-6h12" /><path d="M9 7h6M9 11h6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.5 1.5-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.2v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.5-1.5.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H7v-2.2h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.5-1.5.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.2v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.5 1.5-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.2h-.2a1.7 1.7 0 0 0-1.6 1Z" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    lightbulb: <><path d="M9 18h6M10 22h4" /><path d="M8.5 14.5A6 6 0 1 1 15.5 14c-.8.6-1.4 1.6-1.5 2.5h-4c-.1-.9-.7-1.4-1.5-2Z" /></>,
    x: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  }
  return <svg className="seekito-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <div className="section-heading section-heading-premium"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{action}</div>
}
