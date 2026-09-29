import { describe, expect, it } from 'vitest'
import { isAnswerCorrect } from '@/lib/assessment/answers'
import { processAttempt } from '@/lib/evidence/process-attempt'
import { calculateLearnerState } from '@/lib/learner-state/update'

const baseAttempt = { student_id: 'student', concept_id: 'concept', is_correct: true, used_hint: false, hint_count: 0, submitted_at: '2026-01-01T00:00:00.000Z' } as const

describe('assessment and learner state pipeline', () => {
  it('grades MCQ and short answers deterministically', () => {
    expect(isAnswerCorrect('MCQ', 'B', 'b')).toBe(true)
    expect(isAnswerCorrect('SHORT_ANSWER', '  5x   - 4 ', '5x - 4')).toBe(true)
    expect(isAnswerCorrect('SHORT_ANSWER', '5x + 4', '5x - 4')).toBe(false)
  })

  it('creates independent, hinted, incorrect, repeated, fast, and slow evidence', () => {
    expect(processAttempt({ ...baseAttempt, response_time_ms: 4000 }).map((item) => item.event_type)).toEqual(['CORRECT_INDEPENDENT', 'FAST_SUCCESS'])
    expect(processAttempt({ ...baseAttempt, used_hint: true, hint_count: 1, response_time_ms: 61000 }).map((item) => item.event_type)).toEqual(['CORRECT_WITH_HINT', 'SLOW_SUCCESS'])
    expect(processAttempt({ ...baseAttempt, is_correct: false, response_time_ms: 4000 }, [{ ...baseAttempt, is_correct: false, response_time_ms: 4000 }]).map((item) => item.event_type)).toEqual(['INCORRECT', 'REPEATED_FAILURE'])
  })

  it('updates mastery and tracks independent versus hinted success', () => {
    const first = calculateLearnerState(null, baseAttempt, [{ evidence_type: 'CORRECT_INDEPENDENT' }])
    const second = calculateLearnerState(first as any, { ...baseAttempt, is_correct: true, hint_count: 1 }, [{ evidence_type: 'CORRECT_WITH_HINT' }], '2026-01-02T00:00:00.000Z')
    expect(first.mastery_score).toBe(20)
    expect(second.mastery_score).toBe(30)
    expect(second.attempt_count).toBe(2)
    expect(second.independent_success_count).toBe(1)
    expect(second.hinted_success_count).toBe(1)
    expect(second.confidence_score).toBeGreaterThanOrEqual(0)
    expect(second.confidence_score).toBeLessThanOrEqual(100)
  })

  it('clamps mastery to 0–100', () => {
    const failed = calculateLearnerState(null, { ...baseAttempt, is_correct: false }, [{ evidence_type: 'INCORRECT' }, { evidence_type: 'REPEATED_FAILURE' }])
    expect(failed.mastery_score).toBe(0)
    const high = calculateLearnerState({ ...failed, mastery_score: 95 } as any, baseAttempt, [{ evidence_type: 'CORRECT_INDEPENDENT' }])
    expect(high.mastery_score).toBe(100)
  })
})
