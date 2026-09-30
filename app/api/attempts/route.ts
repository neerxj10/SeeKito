import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { recordAttempt } from '@/lib/assessment/record-attempt'
import type { Attempt, Question } from '@/types/database'
import { demoAttempts, demoSubmit, isDemoMode } from '@/lib/demo/store'

const submissionSchema = z.object({
  questionId: z.string().uuid(),
  submittedAnswer: z.union([z.string(), z.number(), z.boolean()]),
  usedHint: z.boolean().default(false),
  hintCount: z.number().int().min(0).max(10).default(0),
  responseTimeMs: z.number().int().min(0).max(86_400_000).nullable().default(null),
  startedAt: z.string().datetime().nullable().optional(),
  attemptContext: z.enum(['diagnostic', 'practice', 'review', 'remediation']).default('practice'),
})

export async function POST(request: Request) {
  try {
    if (isDemoMode()) {
      const demoBody = submissionSchema.safeParse(await request.json())
      if (!demoBody.success) return NextResponse.json({ success: false, error: demoBody.error.flatten() }, { status: 400 })
      const submission = demoSubmit(demoBody.data.questionId, String(demoBody.data.submittedAnswer), demoBody.data.usedHint || demoBody.data.hintCount > 0, demoBody.data.hintCount, demoBody.data.responseTimeMs)
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
    const usedHint = body.data.usedHint || body.data.hintCount > 0
    const result = await recordAttempt({ admin: student.admin, studentId: student.student.id, question, submittedAnswer: body.data.submittedAnswer, usedHint, hintCount: body.data.hintCount, responseTimeMs: body.data.responseTimeMs, startedAt: body.data.startedAt ?? new Date().toISOString(), attemptContext: body.data.attemptContext })
    return NextResponse.json({ success: true, attemptId: result.attemptId, isCorrect: result.isCorrect, evidence: result.evidence, result: { explanation: result.explanation, conceptId: question.concept_id, difficulty: result.difficulty, usedHint } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to submit attempt' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    if (isDemoMode()) {
      // Keep demo responses identical to the production API contract. The demo
      // store intentionally uses camelCase internally, while the UI consumes
      // database-shaped snake_case fields.
      return NextResponse.json({
        success: true,
        attempts: demoAttempts().map((attempt) => ({
          id: attempt.id,
          question_id: attempt.questionId,
          concept_id: attempt.conceptId,
          question: attempt.question,
          is_correct: attempt.isCorrect,
          used_hint: attempt.usedHint,
          hint_count: attempt.hintCount,
          response_time_ms: attempt.responseTimeMs,
          retry_number: attempt.retryNumber,
          submitted_at: attempt.submittedAt,
        })),
      })
    }
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
