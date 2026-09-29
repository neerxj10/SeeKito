import { NextResponse } from 'next/server'
import { getAuthenticatedStudent } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ conceptId: string }> }) {
  try {
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const { conceptId } = await params
    const { data, error } = await student.admin.from('learner_state').select('id,student_id,concept_id,mastery_score,confidence_score,attempt_count,correct_count,incorrect_count,independent_success_count,hinted_success_count,failure_count,repeated_failure_count,hint_usage_count,last_attempt_at,last_success_at,state_version,created_at,updated_at').eq('student_id', student.student.id).eq('concept_id', conceptId).maybeSingle()
    if (error) throw error
    return NextResponse.json({ success: true, learnerState: data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load learner state' }, { status: 500 })
  }
}

