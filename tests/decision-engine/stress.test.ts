import { describe, expect, it } from 'vitest'
import { evaluateDecision } from '@/lib/decision-engine'

const state = (mastery: number, confidence: number) => ({ mastery_score: mastery, confidence_score: confidence, repeated_failure_count: 0 })

describe('decision engine stress and invariants', () => {
  it('evaluates 1,000 deterministic synthetic contexts safely', () => {
    for (let index = 0; index < 1000; index += 1) {
      const mastery = (index * 37) % 101
      const confidence = (index * 53) % 101
      const context = {
        studentId: `student-${index}`, targetConceptId: 'target', targetConcept: { id: 'target', name: 'Target' },
        learnerState: { ...state(mastery, confidence) } as any, prerequisiteStates: {}, recentEvidence: [], recentAttempts: [],
        conceptGraph: { concepts: [{ id: 'target', name: 'Target' }], relationships: [] }, evaluatedAt: '2026-01-01T00:00:00.000Z',
      }
      const result = evaluateDecision(context)
      expect(['ADVANCE', 'PRACTICE', 'REMEDIATE', 'REVIEW', 'BLOCKED']).toContain(result.decision)
      expect(result.mastery).toBeGreaterThanOrEqual(0)
      expect(result.mastery).toBeLessThanOrEqual(100)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
      expect(evaluateDecision(context)).toEqual(result)
      if (result.decision === 'ADVANCE') expect(mastery).toBeGreaterThanOrEqual(80)
    }
  })
})

