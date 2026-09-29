import { DECISION_THRESHOLDS } from '@/lib/decision-engine/config'
import type { BlockingPrerequisite, Decision, DecisionContext } from '@/lib/decision-engine/types'

export function explainDecision(decision: Decision, context: DecisionContext, blockers: BlockingPrerequisite[], details: Record<string, unknown>) {
  const mastery = context.learnerState?.mastery_score ?? 0
  const confidence = context.learnerState?.confidence_score ?? 0
  if (decision === 'BLOCKED') return blockers.map((blocker) => `${context.targetConcept.name} requires stronger mastery of ${blocker.conceptName} (${blocker.mastery}% is below ${blocker.threshold}%).`)
  if (decision === 'REMEDIATE') {
    const reasons: string[] = []
    if (Boolean(details.masteryBelowThreshold)) reasons.push(`Mastery is ${mastery}%, below the remediation threshold of ${DECISION_THRESHOLDS.remediateMastery}%.`)
    if (Boolean(details.repeatedFailure)) reasons.push(`Student has demonstrated repeated recent failures on ${context.targetConcept.name}.`)
    if (Boolean(details.evidenceOutweighsSuccess)) reasons.push('Recent incorrect evidence outweighs recent successful evidence.')
    return reasons
  }
  if (decision === 'REVIEW') return ['Previous mastery was sufficient, but recent confidence or evidence age indicates that review may be beneficial.']
  if (decision === 'ADVANCE') return [`Current mastery is ${mastery}% and confidence is ${confidence}%, with all prerequisites satisfied.`]
  return [`Current mastery is ${mastery}%, indicating partial understanding and a need for additional practice.`]
}

