import type { Action } from '@/types/database'
import type { DecisionResult } from './types'

export function recommendationAction(result: Pick<DecisionResult, 'decision'>): Action {
  const actions: Record<DecisionResult['decision'], Action> = {
    ADVANCE: 'advance',
    PRACTICE: 'practice',
    REMEDIATE: 'remediation',
    REVIEW: 'review',
    BLOCKED: 'teach_prerequisite',
  }
  return actions[result.decision]
}

export function recommendationReasonCodes(result: Pick<DecisionResult, 'decision' | 'blockingPrerequisites' | 'reasons'>) {
  return [result.decision.toLowerCase(), ...result.blockingPrerequisites.map((item) => `blocked:${item.conceptId}`), ...result.reasons.map((reason) => reason.slice(0, 80))]
}
