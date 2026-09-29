import type { EvidenceType, LearnerState } from '@/types/database'

export type Decision = 'ADVANCE' | 'PRACTICE' | 'REMEDIATE' | 'REVIEW' | 'BLOCKED'
export type RecommendedAction = 'advance' | 'practice' | 'remediate' | 'review' | 'blocked'

export type DecisionConcept = { id: string; name: string }
export type DecisionRelationship = { concept_id: string; prerequisite_concept_id: string }
export type DecisionEvidence = { evidence_type: EvidenceType; created_at: string; value?: number }
export type DecisionAttempt = { is_correct: boolean; submitted_at: string }
export type DecisionPrerequisite = DecisionConcept & { mastery: number; confidence: number; hasState: boolean }

export type DecisionContext = {
  studentId: string
  targetConceptId: string
  targetConcept: DecisionConcept
  learnerState: LearnerState | null
  prerequisiteStates: Record<string, LearnerState | null>
  recentEvidence: DecisionEvidence[]
  recentAttempts: DecisionAttempt[]
  conceptGraph: {
    concepts: DecisionConcept[]
    relationships: DecisionRelationship[]
  }
  evaluatedAt?: string
}

export type BlockingPrerequisite = {
  conceptId: string
  conceptName: string
  mastery: number
  threshold: number
}

export type RuleTrace = {
  rule: string
  matched: boolean
  details?: Record<string, unknown>
}

export type DecisionTrace = {
  targetConcept: string
  prerequisiteChecks: Array<{
    concept: string
    mastery: number
    threshold: number
    passed: boolean
  }>
  rulesEvaluated: RuleTrace[]
  finalDecision: Decision
}

export type DecisionResult = {
  decision: Decision
  conceptId: string
  confidence: number
  mastery: number
  reasons: string[]
  blockingPrerequisites: BlockingPrerequisite[]
  recommendedAction: RecommendedAction
  evaluatedAt: string
  engineVersion: string
  trace: DecisionTrace
}

