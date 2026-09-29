import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { isAnswerCorrect } from '@/lib/assessment/answers'
import { processAttempt } from '@/lib/evidence/process-attempt'
import { calculateLearnerState, evidenceDraftToJson } from '@/lib/learner-state/update'
import type { Attempt, LearnerState, Question } from '@/types/database'
import { demoAttempts, demoSubmit, isDemoMode } from '@/lib/demo/store'

const submissionSchema = z.object({
  questionId: z.string().uuid(),
  submittedAnswer: z.union([z.string(), z.number(), z.boolean()]),
  usedHint: z.boolean().default(false),
  hintCount: z.number().int().min(0).max(10).default(0),
  responseTimeMs: z.number().int().min(0).max(86_400_000).nullable().default(null),
  startedAt: z.string().datetime().nullable().optional(),
})

export async function POST(request: Request) {
  try {
    if (isDemoMode()) {
      const demoBody = submissionSchema.safeParse(await request.json())
      if (!demoBody.success) return NextResponse.json({ success: false, error: demoBody.error.flatten() }, { status: 400 })
      const submission = demoSubmit(demoBody.data.questionId, String(demoBody.data.submittedAnswer), demoBody.data.usedHint || demoBody.data.hintCount > 0)
      if (!submission) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })
      return NextResponse.json({ success: true, attemptId: submission.id, isCorrect: submission.isCorrect, evidence: [submission.isCorrect ? 'CORRECT_INDEPENDENT' : 'INCORRECT'], result: { explanation: submission.question.explanation, conceptId: submission.question.concept_id, difficulty: submission.question.difficulty, usedHint: demoBody.data.usedHint } })
    }
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const body = submissionSchema.safeParse(await request.json())
    if (!body.success) return NextResponse.json({ success: false, error: body.error.flatten() }, { status: 400 })

    const { data: rawQuestion, error: questionError } = await student.admin.from('questions').select('*').eq('id', body.data.questionId).eq('is_active', true).single()
    if (questionError || !rawQuestion) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })
    const question = rawQuestion as unknown as Question
    const isCorrect = isAnswerCorrect(question.question_type, body.data.submittedAnswer, question.correct_answer)
    const usedHint = body.data.usedHint || body.data.hintCount > 0
    const submittedAt = new Date().toISOString()
    const startedAt = body.data.startedAt ?? submittedAt

    const { data: recentRows, error: recentError } = await student.admin.from('attempts').select('id,concept_id,is_correct,used_hint,hint_count,response_time_ms,submitted_at').eq('student_id', student.student.id).eq('concept_id', question.concept_id).order('submitted_at', { ascending: false }).limit(10)
    if (recentError) throw recentError
    const recentAttempts = (recentRows ?? []) as unknown as Array<{ id: string; concept_id: string; is_correct: boolean; used_hint: boolean; hint_count: number; response_time_ms: number | null; submitted_at: string }>
    const evidence = processAttempt({ concept_id: question.concept_id, is_correct: isCorrect, used_hint: usedHint, hint_count: body.data.hintCount, response_time_ms: body.data.responseTimeMs, submitted_at: submittedAt }, recentAttempts)

    const { data: currentState, error: stateError } = await student.admin.from('learner_state').select('*').eq('student_id', student.student.id).eq('concept_id', question.concept_id).maybeSingle()
    if (stateError) throw stateError
    const attemptForState = { student_id: student.student.id, concept_id: question.concept_id, is_correct: isCorrect, hint_count: body.data.hintCount, submitted_at: submittedAt } as Pick<Attempt, 'student_id' | 'concept_id' | 'is_correct' | 'hint_count' | 'submitted_at'>
    const nextState = calculateLearnerState(currentState as unknown as LearnerState | null, attemptForState, evidence.map((item) => ({ evidence_type: item.event_type })))
    const { data: result, error: pipelineError } = await (student.admin as any).rpc('record_attempt_pipeline', {
      p_student_id: student.student.id,
      p_question_id: question.id,
      p_concept_id: question.concept_id,
      p_submitted_answer: body.data.submittedAnswer,
      p_is_correct: isCorrect,
      p_difficulty: question.difficulty,
      p_used_hint: usedHint,
      p_hint_count: body.data.hintCount,
      p_response_time_ms: body.data.responseTimeMs,
      p_started_at: startedAt,
      p_submitted_at: submittedAt,
      p_evidence_events: evidenceDraftToJson(evidence),
      p_state: nextState,
    })
    if (pipelineError) throw pipelineError
    return NextResponse.json({ success: true, attemptId: result.attempt_id, isCorrect, evidence: evidence.map((item) => item.event_type), result: { explanation: question.explanation, conceptId: question.concept_id, difficulty: question.difficulty, usedHint } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to submit attempt' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    if (isDemoMode()) return NextResponse.json({ success: true, attempts: demoAttempts() })
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const { data: attempts, error } = await student.admin.from('attempts').select('id,student_id,question_id,concept_id,is_correct,difficulty,submitted_answer,response_time_ms,hint_count,used_hint,retry_number,started_at,submitted_at,created_at').eq('student_id', student.student.id).order('submitted_at', { ascending: false })
    if (error) throw error
    const rows = (attempts ?? []) as unknown as Attempt[]
    const questionIds = [...new Set(rows.map((attempt) => attempt.question_id))]
    const { data: questions, error: questionError } = questionIds.length ? await student.admin.from('questions').select('id,question_text').in('id', questionIds) : { data: [], error: null }
    if (questionError) throw questionError
    const questionsById = new Map((questions ?? []).map((question) => [question.id, question]))
    return NextResponse.json({ success: true, attempts: rows.map((attempt) => ({ ...attempt, question: questionsById.get(attempt.question_id)?.question_text ?? 'Question unavailable' })) })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load attempts' }, { status: 500 })
  }
}
