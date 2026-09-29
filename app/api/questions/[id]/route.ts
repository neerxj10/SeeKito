import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Question } from '@/types/database'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.from('questions').select('*').eq('id', id).eq('is_active', true).single()
    if (error || !data) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })
    const question = data as unknown as Question
    const { data: concept } = await supabase.from('concepts').select('id,name,slug').eq('id', question.concept_id).single()
    return NextResponse.json({ success: true, question: { id: question.id, concept: concept ?? { id: question.concept_id }, question: question.question_text, options: question.options, difficulty: question.difficulty, questionType: question.question_type, hintAvailable: Boolean(question.hint) } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load question' }, { status: 503 })
  }
}
