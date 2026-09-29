import { NextResponse } from 'next/server'
import { isDemoMode, resetDemo } from '@/lib/demo/store'

export async function POST() {
  if (!isDemoMode()) return NextResponse.json({ success: false, error: 'Demo mode is disabled' }, { status: 404 })
  resetDemo()
  return NextResponse.json({ success: true })
}
