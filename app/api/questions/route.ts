import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Concept, Question } from '@/types/database'
import { canonicalDemoConceptId, demoQuestions, isDemoMode } from '@/lib/demo/store'

const filters = z.object({
  conceptId: z.string().uuid().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  questionType: z.enum(['MCQ', 'SHORT_ANSWER']).optional(),
})

function publicQuestion(question: Question, concept?: Pick<Concept, 'id' | 'name' | 'slug'> | null) {
  return {
    id: question.id,
    concept: concept ?? { id: question.concept_id, name: 'Algebra concept', slug: '' },
    question: question.question_text,
    options: question.options,
    difficulty: question.difficulty,
    questionType: question.question_type,
    hintAvailable: Boolean(question.hint),
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    if (isDemoMode()) {
      const conceptId = url.searchParams.get('conceptId')
      const questions = demoQuestions.filter((question) => !conceptId || question.concept_id === canonicalDemoConceptId(conceptId)).map(({ id, concept, question, options, difficulty, questionType, hintAvailable }) => ({ id, concept, question, options, difficulty, questionType, hintAvailable }))
      return NextResponse.json({ success: true, questions })
    }
    const parsed = filters.safeParse(Object.fromEntries(url.searchParams))
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    const supabase = getSupabaseServerClient()
    let query = supabase.from('questions').select('*').eq('is_active', true)
    if (parsed.data.conceptId) query = query.eq('concept_id', parsed.data.conceptId)
    if (parsed.data.difficulty) query = query.eq('difficulty', parsed.data.difficulty)
    if (parsed.data.questionType) query = query.eq('question_type', parsed.data.questionType)
    const { data, error } = await query.order('created_at')
    if (error) throw error
    const questions = (data ?? []) as unknown as Question[]
    const conceptIds = [...new Set(questions.map((question) => question.concept_id))]
    const { data: concepts, error: conceptError } = conceptIds.length
      ? await supabase.from('concepts').select('id,name,slug').in('id', conceptIds)
      : { data: [], error: null }
    if (conceptError) throw conceptError
    const conceptById = new Map((concepts ?? []).map((concept) => [concept.id, concept]))
    return NextResponse.json({ success: true, questions: questions.map((question) => publicQuestion(question, conceptById.get(question.concept_id))) })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load questions' }, { status: 503 })
  }
}
