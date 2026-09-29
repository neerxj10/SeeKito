import { NextResponse } from 'next/server'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { demoStates, isDemoMode } from '@/lib/demo/store'

export async function GET(request: Request) {
  try {
    if (isDemoMode()) return NextResponse.json({ success: true, learnerState: demoStates() })
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const { data, error } = await student.admin.from('learner_state').select('id,student_id,concept_id,mastery_score,confidence_score,attempt_count,correct_count,incorrect_count,independent_success_count,hinted_success_count,failure_count,repeated_failure_count,hint_usage_count,last_attempt_at,last_success_at,state_version,created_at,updated_at').eq('student_id', student.student.id).order('updated_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, learnerState: data ?? [] })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load learner state' }, { status: 500 })
  }
}
