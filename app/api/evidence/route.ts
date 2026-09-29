import { NextResponse } from 'next/server'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { demoEvidence, isDemoMode } from '@/lib/demo/store'

export async function GET(request: Request) {
  try {
    if (isDemoMode()) return NextResponse.json({ success: true, evidence: demoEvidence() })
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const { data, error } = await student.admin.from('evidence_events').select('id,attempt_id,concept_id,evidence_type,value,weight,metadata,created_at').eq('student_id', student.student.id).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, evidence: data ?? [] })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load evidence' }, { status: 500 })
  }
}
