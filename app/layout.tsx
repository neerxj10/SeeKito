import './globals.css'
import './auth/auth.css'
import './auth/overrides.css'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export const metadata: Metadata = {
  title: 'Seekito · Adaptive Learning Intelligence',
  description: 'Evidence-driven, explainable learning paths for students and educators.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(() => { const saved = localStorage.getItem('seekito-theme'); const theme = saved || (location.pathname.startsWith('/auth') ? 'dark' : 'light'); document.documentElement.dataset.theme = theme; })()` }} /></head><body><ThemeToggle />{children}</body></html>
}
