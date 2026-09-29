import { DECISION_THRESHOLDS } from '@/lib/decision-engine/config'
import type { BlockingPrerequisite, DecisionContext, RuleTrace } from '@/lib/decision-engine/types'

export function checkPrerequisites(context: DecisionContext) {
  const relationships = context.conceptGraph.relationships.filter((item) => item.concept_id === context.targetConceptId)
  const checks = relationships.map((relationship) => {
    const concept = context.conceptGraph.concepts.find((item) => item.id === relationship.prerequisite_concept_id)
    const state = context.prerequisiteStates[relationship.prerequisite_concept_id]
    const mastery = state?.mastery_score ?? 0
    return { concept: concept?.name ?? relationship.prerequisite_concept_id, conceptId: relationship.prerequisite_concept_id, mastery, threshold: DECISION_THRESHOLDS.practiceMastery, passed: mastery >= DECISION_THRESHOLDS.practiceMastery }
  })
  const blockers: BlockingPrerequisite[] = checks.filter((item) => !item.passed).map((item) => ({ conceptId: item.conceptId, conceptName: item.concept, mastery: item.mastery, threshold: item.threshold }))
  return { blockers, checks, trace: { rule: 'PREREQUISITE_BLOCK', matched: blockers.length > 0, details: { blockerCount: blockers.length } } satisfies RuleTrace }
}

export function checkRemediation(context: DecisionContext) {
  const state = context.learnerState
  const mastery = state?.mastery_score ?? 0
  const repeatedFailure = (state?.repeated_failure_count ?? 0) >= DECISION_THRESHOLDS.repeatedFailure
  const recentIncorrect = context.recentEvidence.filter((item) => item.evidence_type === 'INCORRECT' || item.evidence_type === 'REPEATED_FAILURE').length
  const recentSuccess = context.recentEvidence.filter((item) => item.evidence_type === 'CORRECT_INDEPENDENT' || item.evidence_type === 'CORRECT_WITH_HINT').length
  const lastSuccess = state?.last_success_at ? new Date(state.last_success_at).getTime() : null
  const reviewCutoff = new Date(context.evaluatedAt ?? Date.now()).getTime() - DECISION_THRESHOLDS.reviewIntervalDays * 24 * 60 * 60 * 1000
  const staleStrongConcept = mastery >= DECISION_THRESHOLDS.advanceMastery && lastSuccess !== null && lastSuccess < reviewCutoff
  const evidenceOutweighsSuccess = recentIncorrect > recentSuccess && recentIncorrect > 0 && !staleStrongConcept
  return {
    matched: mastery < DECISION_THRESHOLDS.remediateMastery || repeatedFailure || evidenceOutweighsSuccess,
    details: { masteryBelowThreshold: mastery < DECISION_THRESHOLDS.remediateMastery, repeatedFailure, evidenceOutweighsSuccess, staleStrongConcept, recentIncorrect, recentSuccess },
    trace: { rule: 'TARGET_REMEDIATION', matched: mastery < DECISION_THRESHOLDS.remediateMastery || repeatedFailure || evidenceOutweighsSuccess, details: { mastery, repeatedFailure, evidenceOutweighsSuccess, staleStrongConcept } } satisfies RuleTrace,
  }
}

export function checkReview(context: DecisionContext, now = new Date(context.evaluatedAt ?? Date.now())) {
  const state = context.learnerState
  const masteryWasSufficient = (state?.mastery_score ?? 0) >= DECISION_THRESHOLDS.advanceMastery
  const lowConfidence = (state?.confidence_score ?? 0) < DECISION_THRESHOLDS.confidence
  const lastSuccess = state?.last_success_at ? new Date(state.last_success_at).getTime() : null
  const reviewCutoff = now.getTime() - DECISION_THRESHOLDS.reviewIntervalDays * 24 * 60 * 60 * 1000
  const staleSuccess = lastSuccess !== null && lastSuccess < reviewCutoff
  const scheduledReview = Boolean(state?.next_review_at && new Date(state.next_review_at).getTime() <= now.getTime())
  return {
    matched: masteryWasSufficient && (lowConfidence || staleSuccess || scheduledReview),
    details: { masteryWasSufficient, lowConfidence, staleSuccess, staleStrongConcept: masteryWasSufficient && staleSuccess, scheduledReview },
    trace: { rule: 'TARGET_REVIEW', matched: masteryWasSufficient && (lowConfidence || staleSuccess || scheduledReview), details: { masteryWasSufficient, lowConfidence, staleSuccess, scheduledReview } } satisfies RuleTrace,
  }
}

export function checkAdvance(context: DecisionContext) {
  const mastery = context.learnerState?.mastery_score ?? 0
  const confidence = context.learnerState?.confidence_score ?? 0
  const matched = mastery >= DECISION_THRESHOLDS.advanceMastery && confidence >= DECISION_THRESHOLDS.confidence
  return { matched, trace: { rule: 'TARGET_ADVANCE', matched, details: { mastery, confidence } } satisfies RuleTrace }
}

export function checkPractice(context: DecisionContext) {
  const mastery = context.learnerState?.mastery_score ?? 0
  const matched = mastery >= DECISION_THRESHOLDS.practiceMastery && mastery < DECISION_THRESHOLDS.advanceMastery
  return { matched, trace: { rule: 'TARGET_PRACTICE', matched, details: { mastery } } satisfies RuleTrace }
}
