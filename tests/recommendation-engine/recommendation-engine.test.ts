import { describe, expect, it } from 'vitest'
import { buildRecommendation } from '@/lib/recommendation-engine'
import type { DecisionResult } from '@/lib/decision-engine'

function decision(overrides: Partial<DecisionResult> = {}): DecisionResult {
  return {
    decision: 'PRACTICE',
    conceptId: 'target',
    confidence: 82,
    mastery: 55,
    reasons: ['More evidence is needed.'],
    blockingPrerequisites: [],
    recommendedAction: 'practice',
    evaluatedAt: '2026-01-01T00:00:00.000Z',
    engineVersion: 'v2.4',
    trace: { targetConcept: 'Target', prerequisiteChecks: [], rulesEvaluated: [], finalDecision: 'PRACTICE' },
    ...overrides,
  }
}

describe('Phase 5 recommendation engine', () => {
  it.each([
    ['ADVANCE', 'advance'],
    ['PRACTICE', 'practice'],
    ['REMEDIATE', 'remediation'],
    ['REVIEW', 'review'],
  ] as const)('maps %s to a concrete target action', (decisionName, action) => {
    const result = buildRecommendation({ decision: decision({ decision: decisionName }), targetConcept: { id: 'target', name: 'Target' }, content: [{ conceptId: 'target', questionCount: 5, difficulties: ['EASY', 'MEDIUM'] }] })
    expect(result.action).toBe(action)
    expect(result.conceptId).toBe('target')
    expect(result.content.questionCount).toBe(5)
    expect(result.trace.sourceDecision).toBe(decisionName)
  })

  it('teaches the first blocking prerequisite for BLOCKED', () => {
    const result = buildRecommendation({ decision: decision({ decision: 'BLOCKED', blockingPrerequisites: [{ conceptId: 'fractions', conceptName: 'Fractions', mastery: 35, threshold: 60 }] }), targetConcept: { id: 'quadratics', name: 'Quadratics' }, content: [{ conceptId: 'fractions', questionCount: 5, difficulties: ['EASY'] }] })
    expect(result.action).toBe('teach_prerequisite')
    expect(result.conceptId).toBe('fractions')
    expect(result.title).toContain('Fractions')
    expect(result.trace.rule).toBe('BLOCKED_SELECT_FIRST_PREREQUISITE')
  })

  it('remains deterministic when content is unavailable', () => {
    const input = { decision: decision({ decision: 'REVIEW' }), targetConcept: { id: 'target', name: 'Target' } }
    expect(buildRecommendation(input)).toEqual(buildRecommendation(input))
    expect(buildRecommendation(input).content.questionCount).toBe(0)
  })
})
