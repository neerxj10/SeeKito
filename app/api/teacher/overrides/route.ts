import { NextResponse } from 'next/server'
import { z } from 'zod'
import { demoAddOverride, demoOverrides, isDemoMode } from '@/lib/demo/store'
import { getAuthenticatedTeacher } from '@/lib/supabase/server'

const schema = z.object({ studentId: z.string().uuid(), conceptId: z.string().uuid(), previousAction: z.enum(['diagnostic', 'teach_prerequisite', 'practice', 'remediation', 'review', 'advance', 'teacher_intervention']), newAction: z.enum(['diagnostic', 'teach_prerequisite', 'practice', 'remediation', 'review', 'advance', 'teacher_intervention']), reason: z.string().trim().min(10).max(500) })

export async function GET(request: Request) {
  if (isDemoMode()) return NextResponse.json({ success: true, overrides: demoOverrides() })
  const teacher = await getAuthenticatedTeacher(request)
  if (!teacher) return NextResponse.json({ success: false, error: 'Teacher authentication required' }, { status: 401 })
  const { data, error } = await teacher.admin.from('teacher_overrides').select('*').eq('teacher_id', teacher.teacher.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, overrides: data ?? [] })
}
export async function POST(request: Request) {
  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ success: false, error: body.error.flatten() }, { status: 400 })
  if (isDemoMode()) return NextResponse.json({ success: true, override: demoAddOverride({ action: body.data.newAction, reason: body.data.reason, conceptId: body.data.conceptId }) })
  const teacher = await getAuthenticatedTeacher(request)
  if (!teacher) return NextResponse.json({ success: false, error: 'Teacher authentication required' }, { status: 401 })
  const { data, error } = await teacher.admin.from('teacher_overrides').insert({ teacher_id: teacher.teacher.id, student_id: body.data.studentId, concept_id: body.data.conceptId, previous_action: body.data.previousAction, new_action: body.data.newAction, reason: body.data.reason }).select().single()
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  const audit = await teacher.admin.from('audit_events').insert({ actor_user_id: teacher.user.id, entity_type: 'teacher_override', entity_id: data.id, action: 'CREATE', before_data: null, after_data: data, metadata: { source: 'teacher_console' } })
  if (audit.error) return NextResponse.json({ success: false, error: `Override saved but audit logging failed: ${audit.error.message}`, override: data }, { status: 500 })
  return NextResponse.json({ success: true, override: data, auditLogged: true })
}
