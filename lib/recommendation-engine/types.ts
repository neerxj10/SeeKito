import type { Action } from '@/types/database'
import type { DecisionResult } from '@/lib/decision-engine'

export type RecommendationContent = {
  conceptId: string
  questionCount: number
  difficulties: string[]
}

export type RecommendationInput = {
  decision: DecisionResult
  targetConcept: { id: string; name: string }
  concepts?: Array<{ id: string; name: string }>
  content?: RecommendationContent[]
  evidenceIds?: string[]
}

export type RecommendationTrace = {
  sourceDecision: DecisionResult['decision']
  selectedConceptId: string
  rule: string
  inputs: {
    mastery: number
    confidence: number
    blockers: number
    availableQuestions: number
  }
}

export type Recommendation = {
  conceptId: string
  conceptName: string
  action: Action
  title: string
  description: string
  targetUrl: string
  decision: DecisionResult['decision']
  confidence: number
  mastery: number
  reasonCodes: string[]
  reasons: string[]
  evidenceIds: string[]
  content: RecommendationContent
  trace: RecommendationTrace
}
