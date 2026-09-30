import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { demoConcepts, demoDecision, demoPracticeSession, demoQuestions, demoSubmitPractice, isDemoMode } from '@/lib/demo/store'
import { buildRecommendation } from '@/lib/recommendation-engine'
import { recordAttempt } from '@/lib/assessment/record-attempt'
import type { Question } from '@/types/database'

const schema = z.object({ sessionId: z.string().min(1), questionId: z.string().uuid(), answer: z.union([z.string(), z.number(), z.boolean()]), usedHint: z.boolean().default(false), hintCount: z.number().int().min(0).max(10).default(0), responseTimeMs: z.number().int().min(0).max(86_400_000).nullable().default(null), startedAt: z.string().datetime().nullable().optional() })

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    if (isDemoMode()) {
      const result = demoSubmitPractice(parsed.data.sessionId, parsed.data.questionId, String(parsed.data.answer), parsed.data.usedHint || parsed.data.hintCount > 0, parsed.data.hintCount, parsed.data.responseTimeMs)
      if ('error' in result) { const message = result.error ?? 'Unable to submit answer'; return NextResponse.json({ success: false, error: message }, { status: message.includes('not found') ? 404 : 409 }) }
      const session = result.session
      let next = null
      if (session.status === 'COMPLETED') {
        const decision = demoDecision(session.conceptId)
        next = { success: true, result: decision, recommendation: buildRecommendation({ decision, targetConcept: demoConcepts.find((item) => item.id === session.conceptId) ?? { id: session.conceptId, name: 'Concept' }, content: demoConcepts.map((item) => ({ conceptId: item.id, questionCount: demoQuestions.filter((question) => question.concept_id === item.id).length, difficulties: [...new Set(demoQuestions.filter((question) => question.concept_id === item.id).map((question) => question.difficulty))] })) }) }
      }
      return NextResponse.json({ success: true, attemptId: result.submission.id, isCorrect: result.submission.isCorrect, evidence: [result.submission.isCorrect ? 'CORRECT_INDEPENDENT' : 'INCORRECT'], result: { explanation: result.submission.question.explanation, conceptId: result.submission.question.concept_id, difficulty: result.submission.question.difficulty, usedHint: parsed.data.usedHint }, session: { completed: session.status === 'COMPLETED', score: session.score, totalQuestions: session.questionIds.length, currentQuestion: session.currentQuestion }, next: next?.success ? { decision: next.result, recommendation: next.recommendation } : null })
    }
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const { data: session, error: sessionError } = await student.admin.from('practice_sessions').select('*').eq('id', parsed.data.sessionId).eq('student_id', student.student.id).single()
    if (sessionError || !session) return NextResponse.json({ success: false, error: 'Practice session not found' }, { status: 404 })
    if (session.status !== 'ACTIVE') return NextResponse.json({ success: false, error: 'Practice session is already complete' }, { status: 409 })
    if (!session.question_ids.includes(parsed.data.questionId)) return NextResponse.json({ success: false, error: 'Question is not part of this practice session' }, { status: 400 })
    if (session.completed_question_ids.includes(parsed.data.questionId)) return NextResponse.json({ success: false, error: 'This question has already been submitted' }, { status: 409 })
    if (session.question_ids[session.current_question] !== parsed.data.questionId) return NextResponse.json({ success: false, error: 'Submit the current question before continuing' }, { status: 409 })
    const { data: rawQuestion, error: questionError } = await student.admin.from('questions').select('*').eq('id', parsed.data.questionId).eq('concept_id', session.concept_id).eq('is_active', true).single()
    if (questionError || !rawQuestion) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })
    const result = await recordAttempt({ admin: student.admin, studentId: student.student.id, question: rawQuestion as unknown as Question, submittedAnswer: parsed.data.answer, usedHint: parsed.data.usedHint || parsed.data.hintCount > 0, hintCount: parsed.data.hintCount, responseTimeMs: parsed.data.responseTimeMs, startedAt: parsed.data.startedAt ?? new Date().toISOString() })
    const completedQuestionIds = [...session.completed_question_ids, parsed.data.questionId]
    const completed = completedQuestionIds.length === session.question_ids.length
    const { error: updateError } = await student.admin.from('practice_sessions').update({ completed_question_ids: completedQuestionIds, current_question: session.current_question + 1, score: session.score + (result.isCorrect ? 1 : 0), status: completed ? 'COMPLETED' : 'ACTIVE', completed_at: completed ? new Date().toISOString() : null }).eq('id', session.id).eq('student_id', student.student.id)
    if (updateError) throw updateError
    let next = null
    if (completed) {
      const decisionResponse = await fetch(new URL('/api/decision', request.url), { method: 'POST', headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') ?? '', authorization: request.headers.get('authorization') ?? '' }, body: JSON.stringify({ targetConceptId: session.concept_id }) })
      next = await decisionResponse.json()
    }
    return NextResponse.json({ success: true, attemptId: result.attemptId, isCorrect: result.isCorrect, evidence: result.evidence, result: { explanation: result.explanation, conceptId: session.concept_id, difficulty: result.difficulty, usedHint: result.usedHint }, session: { completed, score: session.score + (result.isCorrect ? 1 : 0), totalQuestions: session.question_ids.length, currentQuestion: session.current_question + 1 }, next: next?.success ? { decision: next.result, recommendation: next.recommendation } : null })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to submit practice answer' }, { status: 500 })
  }
}
