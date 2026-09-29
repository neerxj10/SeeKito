import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production' && process.env.SEEKITO_DEMO_MODE === 'true') return NextResponse.next()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return NextResponse.next()
  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, anonKey, { cookies: { getAll: () => request.cookies.getAll(), setAll: (values) => { values.forEach(({ name, value, options }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && (request.nextUrl.pathname.startsWith('/student') || request.nextUrl.pathname.startsWith('/teacher') || request.nextUrl.pathname.startsWith('/admin'))) return NextResponse.redirect(new URL('/auth/login', request.url))
  if (user && request.nextUrl.pathname.startsWith('/auth/')) return NextResponse.redirect(new URL('/student', request.url))
  return response
}

export const config = { matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*', '/auth/:path*'] }
