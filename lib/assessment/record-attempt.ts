import { isAnswerCorrect } from '@/lib/assessment/answers'
import { processAttempt } from '@/lib/evidence/process-attempt'
import { calculateLearnerState, evidenceDraftToJson } from '@/lib/learner-state/update'
import type { Attempt, LearnerState, Question } from '@/types/database'

export async function recordAttempt(input: { admin: any; studentId: string; question: Question; submittedAnswer: unknown; usedHint: boolean; hintCount: number; responseTimeMs: number | null; startedAt: string; attemptContext?: 'diagnostic' | 'practice' | 'review' | 'remediation' }) {
  const { admin, studentId, question } = input
  const isCorrect = isAnswerCorrect(question.question_type, input.submittedAnswer, question.correct_answer)
  const submittedAt = new Date().toISOString()
  const [{ data: recentRows, error: recentError }, { data: currentState, error: stateError }] = await Promise.all([
    admin.from('attempts').select('id,concept_id,is_correct,used_hint,hint_count,response_time_ms,submitted_at').eq('student_id', studentId).eq('concept_id', question.concept_id).order('submitted_at', { ascending: false }).limit(10),
    admin.from('learner_state').select('*').eq('student_id', studentId).eq('concept_id', question.concept_id).maybeSingle(),
  ])
  if (recentError) throw recentError
  if (stateError) throw stateError
  const recentAttempts = (recentRows ?? []) as Array<{ id: string; concept_id: string; is_correct: boolean; used_hint: boolean; hint_count: number; response_time_ms: number | null; submitted_at: string }>
  const evidence = processAttempt({ concept_id: question.concept_id, is_correct: isCorrect, used_hint: input.usedHint, hint_count: input.hintCount, response_time_ms: input.responseTimeMs, submitted_at: submittedAt }, recentAttempts)
  const attemptForState = { student_id: studentId, concept_id: question.concept_id, is_correct: isCorrect, hint_count: input.hintCount, submitted_at: submittedAt } as Pick<Attempt, 'student_id' | 'concept_id' | 'is_correct' | 'hint_count' | 'submitted_at'>
  const nextState = calculateLearnerState(currentState as LearnerState | null, attemptForState, evidence.map((item) => ({ evidence_type: item.event_type })))
  const { data: result, error: pipelineError } = await admin.rpc('record_attempt_pipeline', {
    p_student_id: studentId, p_question_id: question.id, p_concept_id: question.concept_id, p_submitted_answer: input.submittedAnswer,
    p_is_correct: isCorrect, p_difficulty: question.difficulty, p_used_hint: input.usedHint, p_hint_count: input.hintCount,
    p_response_time_ms: input.responseTimeMs, p_started_at: input.startedAt, p_submitted_at: submittedAt, p_attempt_context: input.attemptContext ?? 'practice',
    p_evidence_events: evidenceDraftToJson(evidence), p_state: nextState,
  })
  if (pipelineError) throw pipelineError
  return { attemptId: result.attempt_id as string, isCorrect, evidence: evidence.map((item) => item.event_type), state: result.state as LearnerState, explanation: question.explanation, difficulty: question.difficulty, usedHint: input.usedHint }
}
