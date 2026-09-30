import { NextResponse } from 'next/server'
import { isDemoMode, resetDemo } from '@/lib/demo/store'

export async function POST(request: Request) {
  if (!isDemoMode()) return NextResponse.json({ success: false, error: 'Demo mode is disabled' }, { status: 404 })
  let seed = true
  try { const body = await request.json() as { seed?: boolean }; if (typeof body.seed === 'boolean') seed = body.seed } catch { /* empty request keeps the seeded demo */ }
  resetDemo({ seed })
  return NextResponse.json({ success: true })
}
