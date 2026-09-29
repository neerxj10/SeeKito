import { describe, expect, it } from 'vitest'
import { processAttempt } from '@/lib/evidence/process-attempt'
import { calculateLearnerState } from '@/lib/learner-state/update'

describe('Phase 3 attempt → evidence → learner state flow', () => {
  it('initializes state on failure and updates it after independent success', () => {
    const failedAttempt = { student_id: 'student-a', concept_id: 'factorisation', is_correct: false, hint_count: 0, submitted_at: '2026-01-01T00:00:00.000Z' }
    const failedEvidence = processAttempt({ ...failedAttempt, used_hint: false, response_time_ms: 12000 })
    const firstState = calculateLearnerState(null, failedAttempt, failedEvidence.map((item) => ({ evidence_type: item.event_type })))

    expect(firstState.attempt_count).toBe(1)
    expect(firstState.incorrect_count).toBe(1)
    expect(firstState.mastery_score).toBe(0)

    const successfulAttempt = { ...failedAttempt, is_correct: true, submitted_at: '2026-01-02T00:00:00.000Z' }
    const successEvidence = processAttempt({ ...successfulAttempt, used_hint: false, response_time_ms: 12000 }, [{ ...failedAttempt, used_hint: false, response_time_ms: 12000 }])
    const secondState = calculateLearnerState(firstState as any, successfulAttempt, successEvidence.map((item) => ({ evidence_type: item.event_type })))

    expect(secondState.attempt_count).toBe(2)
    expect(secondState.correct_count).toBe(1)
    expect(secondState.independent_success_count).toBe(1)
    expect(secondState.state_version).toBe(2)
    expect(secondState.mastery_score).toBe(20)
  })
})

