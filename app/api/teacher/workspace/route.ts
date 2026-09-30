import { NextResponse } from 'next/server'
import { demoTeacherWorkspace, isDemoMode } from '@/lib/demo/store'
import { getAuthenticatedTeacher } from '@/lib/supabase/server'

export async function GET(request: Request) {
  if (isDemoMode()) return NextResponse.json({ success: true, workspace: demoTeacherWorkspace() })

  const teacher = await getAuthenticatedTeacher(request)
  if (!teacher) return NextResponse.json({ success: false, error: 'Teacher authentication required' }, { status: 401 })

  const [{ data: concepts, error: conceptError }, { data: students, error: studentError }, { data: overrides, error: overrideError }] = await Promise.all([
    teacher.admin.from('concepts').select('id,name,slug,description,subject,difficulty,estimated_minutes,is_active').eq('is_active', true).order('subject').order('name'),
    teacher.admin.from('students').select('id,user_id,users(name,email)').order('created_at'),
    teacher.admin.from('teacher_overrides').select('*').eq('teacher_id', teacher.teacher.id).order('created_at', { ascending: false }).limit(50),
  ])
  if (conceptError || studentError || overrideError) return NextResponse.json({ success: false, error: conceptError?.message ?? studentError?.message ?? overrideError?.message }, { status: 500 })

  const studentIds = (students ?? []).map((student) => student.id)
  const [{ data: states, error: stateError }, { data: evidence, error: evidenceError }] = await Promise.all([
    studentIds.length ? teacher.admin.from('learner_state').select('*').in('student_id', studentIds) : Promise.resolve({ data: [], error: null }),
    studentIds.length ? teacher.admin.from('evidence_events').select('id,student_id,concept_id,evidence_type,value,metadata,created_at').in('student_id', studentIds).order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
  ])
  if (stateError || evidenceError) return NextResponse.json({ success: false, error: stateError?.message ?? evidenceError?.message }, { status: 500 })

  const roster = (students ?? []).map((student) => {
    const profile = Array.isArray(student.users) ? student.users[0] : student.users
    return { id: student.id, name: profile?.name ?? profile?.email ?? 'Learner', stage: 'Current learning path', mastery: 0, uncertainty: 100, recommendation: 'DIAGNOSTIC', lastActive: 'No activity yet', status: 'Needs attention' }
  })
  return NextResponse.json({ success: true, workspace: { mode: 'database', concepts: concepts ?? [], students: roster, states: states ?? [], evidence: evidence ?? [], overrides: overrides ?? [] } })
}
