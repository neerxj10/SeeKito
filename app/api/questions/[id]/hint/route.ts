import { NextResponse } from 'next/server'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { demoQuestions, isDemoMode } from '@/lib/demo/store'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (isDemoMode()) { const { id } = await params; const question = demoQuestions.find((item) => item.id === id); return question ? NextResponse.json({ success: true, hint: question.hint }) : NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 }) }
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const { id } = await params
    const { data: question, error } = await student.admin.from('questions').select('id,hint').eq('id', id).eq('is_active', true).single()
    if (error || !question) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })
    return NextResponse.json({ success: true, hint: question.hint })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load hint' }, { status: 503 })
  }
}
