import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { canonicalDemoConceptId, demoConcepts, demoQuestions, demoStartPractice, isDemoMode } from '@/lib/demo/store'

const schema = z.object({ recommendationId: z.string().min(1).optional(), conceptId: z.string().uuid().optional(), actionType: z.enum(['practice', 'remediation', 'review', 'advance', 'teach_prerequisite']).optional(), questionCount: z.union([z.literal(10), z.literal(15), z.literal(20)]).optional(), timeMinutes: z.number().int().min(1).max(120).optional() }).refine((body) => body.recommendationId || body.conceptId, { message: 'A recommendation or concept is required' })

function publicQuestion(question: { id: string; concept: { id: string; name: string }; question: string; options: unknown; difficulty: string; questionType: string; hintAvailable?: boolean }) {
  return { id: question.id, concept: question.concept, question: question.question, options: question.options, difficulty: question.difficulty, questionType: question.questionType, hintAvailable: question.hintAvailable ?? false }
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    if (isDemoMode()) {
      const conceptId = canonicalDemoConceptId(parsed.data.conceptId ?? '')
      const concept = demoConcepts.find((item) => item.id === conceptId)
      if (!concept) return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 })
      const started = demoStartPractice({ conceptId, actionType: parsed.data.actionType ?? 'practice', recommendationId: parsed.data.recommendationId, questionCount: parsed.data.questionCount })
      if (!started) return NextResponse.json({ success: false, error: 'No questions are available for this concept' }, { status: 404 })
      return NextResponse.json({ success: true, sessionId: started.session.id, recommendationId: started.session.recommendationId, concept, actionType: started.session.actionType, totalQuestions: started.questions.length, timeMinutes: parsed.data.timeMinutes ?? null, questions: started.questions.map((question) => publicQuestion({ id: question.id, concept: question.concept, question: question.question, options: question.options, difficulty: question.difficulty, questionType: question.questionType, hintAvailable: question.hintAvailable })) })
    }
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    if (!parsed.data.recommendationId) return NextResponse.json({ success: false, error: 'Start practice from an active recommendation' }, { status: 400 })
    const { data: recommendation, error: recommendationError } = await student.admin.from('recommendations').select('id,concept_id,action').eq('id', parsed.data.recommendationId).eq('student_id', student.student.id).single()
    if (recommendationError || !recommendation) return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 })
    const actionType = recommendation.action as 'practice' | 'remediation' | 'review' | 'advance' | 'teach_prerequisite'
    if (!['practice', 'remediation', 'review', 'advance', 'teach_prerequisite'].includes(actionType)) return NextResponse.json({ success: false, error: 'This recommendation cannot start practice' }, { status: 400 })
    const { data: concept, error: conceptError } = await student.admin.from('concepts').select('id,name').eq('id', recommendation.concept_id).eq('is_active', true).single()
    if (conceptError || !concept) return NextResponse.json({ success: false, error: 'Recommended concept not found' }, { status: 404 })
    const { data: questions, error: questionsError } = await student.admin.from('questions').select('id,concept_id,question_text,question_type,difficulty,options,hint').eq('concept_id', concept.id).eq('is_active', true).order('created_at')
    if (questionsError) throw questionsError
    const difficultyOrder = actionType === 'remediation' || actionType === 'teach_prerequisite' ? ['EASY', 'MEDIUM', 'HARD'] : actionType === 'advance' ? ['MEDIUM', 'HARD', 'EASY'] : actionType === 'review' ? ['MEDIUM', 'EASY', 'HARD'] : ['MEDIUM', 'EASY', 'HARD']
    const selected = (questions ?? []).slice().sort((a, b) => difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty) || a.id.localeCompare(b.id)).slice(0, parsed.data.questionCount ?? 10)
    if (!selected.length) return NextResponse.json({ success: false, error: 'No questions are available for this concept' }, { status: 404 })
    const { data: session, error: sessionError } = await student.admin.from('practice_sessions').insert({ student_id: student.student.id, recommendation_id: recommendation.id, concept_id: concept.id, action_type: actionType, question_ids: selected.map((question) => question.id), total_questions: selected.length }).select('id,recommendation_id,concept_id,action_type,question_ids,current_question,total_questions,status,started_at').single()
    if (sessionError) throw sessionError
    return NextResponse.json({ success: true, sessionId: session.id, recommendationId: recommendation.id, concept, actionType, totalQuestions: selected.length, timeMinutes: parsed.data.timeMinutes ?? null, questions: selected.map((question) => publicQuestion({ id: question.id, concept: { id: concept.id, name: concept.name }, question: question.question_text, options: question.options, difficulty: question.difficulty, questionType: question.question_type, hintAvailable: Boolean(question.hint) })) })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to start practice' }, { status: 500 })
  }
}
