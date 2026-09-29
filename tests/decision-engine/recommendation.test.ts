import { describe, expect, it } from 'vitest'
import { recommendationAction, recommendationReasonCodes } from '@/lib/decision-engine/recommendation'

describe('recommendation mapping', () => {
  it('maps deterministic decisions to persisted recommendation actions', () => {
    expect(recommendationAction({ decision: 'BLOCKED' })).toBe('teach_prerequisite')
    expect(recommendationAction({ decision: 'REMEDIATE' })).toBe('remediation')
    expect(recommendationAction({ decision: 'ADVANCE' })).toBe('advance')
  })

  it('keeps recommendation reason codes explainable', () => {
    const codes = recommendationReasonCodes({ decision: 'BLOCKED', blockingPrerequisites: [{ conceptId: 'concept-1', conceptName: 'Fractions', mastery: 25, threshold: 60 }], reasons: ['Fractions must be strengthened before Algebra.'] })
    expect(codes).toEqual(['blocked', 'blocked:concept-1', 'Fractions must be strengthened before Algebra.'])
  })
})
