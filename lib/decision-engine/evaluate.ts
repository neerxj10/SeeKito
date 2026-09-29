import { DECISION_ENGINE_VERSION, DECISION_RULE_PRIORITY, DECISION_THRESHOLDS } from '@/lib/decision-engine/config'
import { getPrerequisites, validateConceptGraph } from '@/lib/learning/concept-graph'
import { checkAdvance, checkPrerequisites, checkPractice, checkRemediation, checkReview } from '@/lib/decision-engine/rules'
import { explainDecision } from '@/lib/decision-engine/explain'
import type { DecisionContext, DecisionResult, DecisionTrace } from '@/lib/decision-engine/types'

export class DecisionEngineError extends Error {}

function validateContext(context: DecisionContext) {
  if (!context.targetConcept || context.targetConcept.id !== context.targetConceptId) throw new DecisionEngineError('Target concept does not exist in the decision context')
  const state = context.learnerState
  if (state && (state.mastery_score < 0 || state.mastery_score > 100 || state.confidence_score < 0 || state.confidence_score > 100)) throw new DecisionEngineError('Learner state scores must be between 0 and 100')
  const graph = validateConceptGraph(context.conceptGraph.concepts, context.conceptGraph.relationships)
  if (!graph.valid) throw new DecisionEngineError(`Invalid concept graph: ${graph.problem?.type ?? 'unknown problem'}`)
}

export function evaluateDecision(context: DecisionContext): DecisionResult {
  validateContext(context)
  const evaluatedAt = context.evaluatedAt ?? new Date().toISOString()
  const prerequisite = checkPrerequisites(context)
  const remediation = checkRemediation(context)
  const review = checkReview(context, new Date(evaluatedAt))
  const advance = checkAdvance(context)
  const practice = checkPractice(context)
  const traces = [prerequisite.trace, remediation.trace, review.trace, advance.trace, practice.trace]
  let decision: DecisionResult['decision'] = 'PRACTICE'
  for (const rule of DECISION_RULE_PRIORITY) {
    if (rule === 'PREREQUISITE_BLOCK' && prerequisite.blockers.length) { decision = 'BLOCKED'; break }
    if (rule === 'TARGET_REMEDIATION' && remediation.matched) { decision = 'REMEDIATE'; break }
    if (rule === 'TARGET_REVIEW' && review.matched) { decision = 'REVIEW'; break }
    if (rule === 'TARGET_ADVANCE' && advance.matched) { decision = 'ADVANCE'; break }
    if (rule === 'TARGET_PRACTICE' && practice.matched) { decision = 'PRACTICE'; break }
  }
  const details = { ...remediation.details }
  const trace: DecisionTrace = {
    targetConcept: context.targetConcept.name,
    prerequisiteChecks: prerequisite.checks.map((item) => ({ concept: item.concept, mastery: item.mastery, threshold: item.threshold, passed: item.passed })),
    rulesEvaluated: traces,
    finalDecision: decision,
  }
  const mastery = context.learnerState?.mastery_score ?? 0
  const confidence = context.learnerState?.confidence_score ?? 0
  return {
    decision,
    conceptId: context.targetConceptId,
    confidence,
    mastery,
    reasons: explainDecision(decision, context, prerequisite.blockers, details),
    blockingPrerequisites: prerequisite.blockers,
    recommendedAction: decision.toLowerCase() as DecisionResult['recommendedAction'],
    evaluatedAt,
    engineVersion: DECISION_ENGINE_VERSION,
    trace,
  }
}

export { getPrerequisites, DECISION_THRESHOLDS }

