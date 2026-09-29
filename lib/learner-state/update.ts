import type { Attempt, LearnerState, EvidenceType } from '@/types/database'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { EvidenceDraft } from '@/lib/evidence/process-attempt'

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))

export function calculateLearnerState(previous: LearnerState | null, attempt: Pick<Attempt, 'student_id' | 'concept_id' | 'is_correct' | 'hint_count' | 'submitted_at'> & Partial<Pick<Attempt, 'difficulty'>>, evidence: Array<{ evidence_type: EvidenceType }>, now = attempt.submitted_at): Omit<LearnerState, 'id' | 'created_at' | 'updated_at'> {
  const previousState = previous ?? {
    student_id: attempt.student_id,
    concept_id: attempt.concept_id,
    mastery_score: 0,
    confidence_score: 0,
    evidence_count: 0,
    independent_success_count: 0,
    hinted_success_count: 0,
    failure_count: 0,
    recent_streak: 0,
    last_attempt_at: null,
    last_success_at: null,
    state_version: 0,
    attempt_count: 0,
    correct_count: 0,
    incorrect_count: 0,
    repeated_failure_count: 0,
    hint_usage_count: 0,
    next_review_at: null,
  } as LearnerState

  let mastery = previousState.mastery_score
  const rapidRetry = previousState.last_attempt_at ? new Date(now).getTime() - new Date(previousState.last_attempt_at).getTime() < 30_000 : false
  const independentGain = attempt.difficulty === 'HARD' ? 10 : attempt.difficulty === 'MEDIUM' ? 15 : 20
  const hintedGain = attempt.difficulty === 'HARD' ? 5 : attempt.difficulty === 'MEDIUM' ? 8 : 10
  const incorrectPenalty = attempt.difficulty === 'HARD' ? 20 : 15
  for (const item of evidence) {
    if (item.evidence_type === 'CORRECT_INDEPENDENT') mastery += rapidRetry ? Math.max(2, Math.round(independentGain / 4)) : independentGain
    if (item.evidence_type === 'CORRECT_WITH_HINT') mastery += rapidRetry ? Math.max(1, Math.round(hintedGain / 4)) : hintedGain
    if (item.evidence_type === 'INCORRECT') mastery -= incorrectPenalty
    if (item.evidence_type === 'REPEATED_FAILURE') mastery -= 10
  }

  const attemptCount = previousState.attempt_count + 1
  const correctCount = previousState.correct_count + (attempt.is_correct ? 1 : 0)
  const incorrectCount = previousState.incorrect_count + (attempt.is_correct ? 0 : 1)
  const independentSuccessCount = previousState.independent_success_count + (evidence.some((item) => item.evidence_type === 'CORRECT_INDEPENDENT') ? 1 : 0)
  const hintedSuccessCount = previousState.hinted_success_count + (evidence.some((item) => item.evidence_type === 'CORRECT_WITH_HINT') ? 1 : 0)
  const repeatedFailureCount = previousState.repeated_failure_count + (evidence.some((item) => item.evidence_type === 'REPEATED_FAILURE') ? 1 : 0)
  // A rapid retry is useful evidence of persistence, but not independent
  // evidence of confidence. Exclude it from the confidence increment while
  // still retaining the attempt in the audit trail and learner history.
  const confidenceAttemptCount = rapidRetry ? Math.max(0, attemptCount - 1) : attemptCount
  const confidence = clamp(confidenceAttemptCount * 10 + Math.max(0, independentSuccessCount - incorrectCount) * 5 - hintedSuccessCount * 2 - repeatedFailureCount * 5)

  const reviewDays = !attempt.is_correct ? 0 : mastery >= 80 ? 14 : mastery >= 60 ? 7 : mastery >= 40 ? 3 : 1
  const nextReview = new Date(new Date(now).getTime() + reviewDays * 24 * 60 * 60 * 1000).toISOString()
  return {
    student_id: attempt.student_id,
    concept_id: attempt.concept_id,
    mastery_score: clamp(mastery),
    confidence_score: confidence,
    evidence_count: previousState.evidence_count + evidence.length,
    independent_success_count: independentSuccessCount,
    hinted_success_count: hintedSuccessCount,
    failure_count: previousState.failure_count + (attempt.is_correct ? 0 : 1),
    recent_streak: attempt.is_correct ? previousState.recent_streak + 1 : 0,
    last_attempt_at: now,
    last_success_at: attempt.is_correct ? now : previousState.last_success_at,
    state_version: previousState.state_version + 1,
    attempt_count: attemptCount,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    repeated_failure_count: repeatedFailureCount,
    hint_usage_count: previousState.hint_usage_count + attempt.hint_count,
    next_review_at: nextReview,
  }
}

export async function updateLearnerState(attemptId: string) {
  const supabase = getSupabaseServerClient()
  const { data: attempt, error: attemptError } = await supabase.from('attempts').select('*').eq('id', attemptId).single()
  if (attemptError || !attempt) throw attemptError ?? new Error('Attempt not found')
  const { data: evidence, error: evidenceError } = await supabase.from('evidence_events').select('evidence_type').eq('attempt_id', attemptId)
  if (evidenceError) throw evidenceError
  const { data: previous, error: stateError } = await supabase.from('learner_state').select('*').eq('student_id', attempt.student_id).eq('concept_id', attempt.concept_id).maybeSingle()
  if (stateError) throw stateError
  const state = calculateLearnerState(previous, attempt, evidence ?? [])
  const { data: saved, error: saveError } = await supabase.from('learner_state').upsert(state, { onConflict: 'student_id,concept_id' }).select().single()
  if (saveError) throw saveError
  return saved
}

export function evidenceDraftToJson(evidence: EvidenceDraft[]) {
  return evidence.map((item) => ({ event_type: item.event_type, event_value: item.event_value, metadata: item.metadata }))
}
