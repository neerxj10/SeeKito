import { NextResponse } from 'next/server'
import { demoTeacherData, isDemoMode } from '@/lib/demo/store'

export async function GET() {
  if (!isDemoMode()) return NextResponse.json({ error: 'Demo mode is disabled' }, { status: 404 })
  return NextResponse.json(demoTeacherData())
}
