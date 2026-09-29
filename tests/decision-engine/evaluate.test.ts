import { describe, expect, it } from 'vitest'
import { evaluateDecision, DecisionEngineError } from '@/lib/decision-engine'
import type { DecisionContext } from '@/lib/decision-engine'

const state = (studentId: string, conceptId: string, overrides: Record<string, unknown> = {}) => ({
  id: `${conceptId}-state`, student_id: studentId, concept_id: conceptId, mastery_score: 0, confidence_score: 0,
  evidence_count: 0, independent_success_count: 0, hinted_success_count: 0, failure_count: 0, recent_streak: 0,
  last_attempt_at: null, last_success_at: null, next_review_at: null, state_version: 1, attempt_count: 0,
  correct_count: 0, incorrect_count: 0, repeated_failure_count: 0, hint_usage_count: 0,
  created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z', ...overrides,
})

function context(overrides: Partial<DecisionContext> = {}): DecisionContext {
  const target = { id: 'target', name: 'Target' }
  return {
    studentId: 'student', targetConceptId: 'target', targetConcept: target, learnerState: state('student', 'target'),
    prerequisiteStates: {}, recentEvidence: [], recentAttempts: [], conceptGraph: { concepts: [target], relationships: [] }, evaluatedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  }
}

describe('deterministic decision engine', () => {
  it('advances a strong target with no prerequisites', () => {
    expect(evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 85, confidence_score: 70 }) })).decision).toBe('ADVANCE')
  })

  it('practices a medium target', () => {
    expect(evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 65, confidence_score: 70 }) })).decision).toBe('PRACTICE')
  })

  it('remediates a weak target or repeated failure', () => {
    expect(evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 30, confidence_score: 80 }) })).decision).toBe('REMEDIATE')
    expect(evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 60, confidence_score: 80, repeated_failure_count: 2 }) })).decision).toBe('REMEDIATE')
  })

  it('blocks on one or multiple weak prerequisites before target rules', () => {
    const graph = { concepts: [{ id: 'target', name: 'Target' }, { id: 'a', name: 'A' }, { id: 'b', name: 'B' }], relationships: [{ concept_id: 'target', prerequisite_concept_id: 'a' }, { concept_id: 'target', prerequisite_concept_id: 'b' }] }
    const result = evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 95, confidence_score: 90 }), prerequisiteStates: { a: state('student', 'a', { mastery_score: 35 }), b: state('student', 'b', { mastery_score: 42 }) }, conceptGraph: graph }))
    expect(result.decision).toBe('BLOCKED')
    expect(result.blockingPrerequisites).toHaveLength(2)
  })

  it('advances when all prerequisites are satisfied', () => {
    const graph = { concepts: [{ id: 'target', name: 'Target' }, { id: 'a', name: 'A' }], relationships: [{ concept_id: 'target', prerequisite_concept_id: 'a' }] }
    expect(evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 85, confidence_score: 80 }), prerequisiteStates: { a: state('student', 'a', { mastery_score: 82 }) }, conceptGraph: graph })).decision).toBe('ADVANCE')
  })

  it('returns review for low confidence after sufficient mastery', () => {
    expect(evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 85, confidence_score: 45 }) })).decision).toBe('REVIEW')
  })

  it('reviews a previously strong concept after a long-gap failure instead of treating it as first-time remediation', () => {
    const result = evaluateDecision(context({
      learnerState: state('student', 'target', { mastery_score: 85, confidence_score: 80, last_success_at: '2025-12-01T00:00:00.000Z' }),
      recentEvidence: [{ evidence_type: 'INCORRECT', created_at: '2026-01-01T00:00:00.000Z' }],
    }))
    expect(result.decision).toBe('REVIEW')
    expect(result.reasons.join(' ')).toMatch(/review|refresh|recent/i)
  })

  it('uses history, not only the latest mastery score, for two learners at the same score', () => {
    const advance = evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 85, confidence_score: 70, next_review_at: '2026-02-01T00:00:00.000Z' }) }))
    const review = evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 85, confidence_score: 70, next_review_at: '2025-12-15T00:00:00.000Z' }) }))
    expect(advance.mastery).toBe(review.mastery)
    expect(advance.decision).toBe('ADVANCE')
    expect(review.decision).toBe('REVIEW')
  })

  it('handles missing state, rejects invalid state, and fails on invalid graph', () => {
    expect(evaluateDecision(context({ learnerState: null })).decision).toBe('REMEDIATE')
    expect(() => evaluateDecision(context({ learnerState: state('student', 'target', { mastery_score: 101 }) }))).toThrow(DecisionEngineError)
    expect(() => evaluateDecision(context({ targetConcept: { id: 'other', name: 'Other' } }))).toThrow(DecisionEngineError)
    expect(() => evaluateDecision(context({ conceptGraph: { concepts: [{ id: 'target', name: 'Target' }, { id: 'a', name: 'A' }], relationships: [{ concept_id: 'target', prerequisite_concept_id: 'a' }, { concept_id: 'a', prerequisite_concept_id: 'target' }] } }))).toThrow(DecisionEngineError)
  })

  it('is reproducible for identical input', () => {
    const input = context({ learnerState: state('student', 'target', { mastery_score: 65, confidence_score: 70 }) })
    expect(evaluateDecision(input)).toEqual(evaluateDecision(input))
  })
})
