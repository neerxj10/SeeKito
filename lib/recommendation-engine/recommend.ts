import { recommendationAction, recommendationReasonCodes } from '@/lib/decision-engine/recommendation'
import type { Recommendation, RecommendationContent, RecommendationInput } from './types'

const emptyContent = (conceptId: string): RecommendationContent => ({ conceptId, questionCount: 0, difficulties: [] })

function contentFor(contents: RecommendationContent[] | undefined, conceptId: string) {
  return contents?.find((item) => item.conceptId === conceptId) ?? emptyContent(conceptId)
}

function chooseTarget(input: RecommendationInput) {
  const { decision } = input
  if (decision.decision === 'BLOCKED' && decision.blockingPrerequisites[0]) {
    const blocker = decision.blockingPrerequisites[0]
    return { id: blocker.conceptId, name: blocker.conceptName, rule: 'BLOCKED_SELECT_FIRST_PREREQUISITE' }
  }
  return { id: input.targetConcept.id, name: input.targetConcept.name, rule: `${decision.decision}_SELECT_TARGET` }
}

export function buildRecommendation(input: RecommendationInput): Recommendation {
  const { decision } = input
  const target = chooseTarget(input)
  const content = contentFor(input.content, target.id)
  const action = decision.decision === 'BLOCKED' ? 'teach_prerequisite' : recommendationAction(decision)
  const actionLabel = action === 'teach_prerequisite' ? 'Learn' : action === 'remediation' ? 'Remediate' : action.charAt(0).toUpperCase() + action.slice(1)
  const title = action === 'teach_prerequisite' ? `Build ${target.name} first` : `${actionLabel} ${target.name}`
  const description = action === 'teach_prerequisite'
    ? `${target.name} is the first prerequisite to strengthen before returning to ${input.targetConcept.name}.`
    : action === 'advance'
      ? `${target.name} is ready for the next learning step. Use a short set to confirm independent mastery.`
      : action === 'review'
        ? `Refresh ${target.name} with a focused review set before moving forward.`
        : action === 'remediation'
          ? `Work through guided ${target.name} questions to repair the evidence gap.`
          : `Practice ${target.name} and capture more evidence for the next decision.`
  const reasonCodes = [...recommendationReasonCodes(decision), `content:${content.questionCount}`, `target:${target.id}`]
  return {
    conceptId: target.id,
    conceptName: target.name,
    action,
    title,
    description,
    targetUrl: `/student/learn/${target.id}`,
    decision: decision.decision,
    confidence: decision.confidence,
    mastery: decision.mastery,
    reasonCodes,
    reasons: decision.reasons,
    evidenceIds: input.evidenceIds ?? [],
    content,
    trace: {
      sourceDecision: decision.decision,
      selectedConceptId: target.id,
      rule: target.rule,
      inputs: {
        mastery: decision.mastery,
        confidence: decision.confidence,
        blockers: decision.blockingPrerequisites.length,
        availableQuestions: content.questionCount,
      },
    },
  }
}
