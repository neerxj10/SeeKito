export const DECISION_ENGINE_VERSION = '1.0.0'

// Prototype thresholds. These are deterministic heuristics, not a scientifically
// validated learning assessment model.
export const DECISION_THRESHOLDS = {
  advanceMastery: 80,
  practiceMastery: 50,
  remediateMastery: 40,
  confidence: 60,
  repeatedFailure: 2,
  recentEvidenceWindow: 10,
  reviewIntervalDays: 14,
} as const

export const DECISION_RULE_PRIORITY = [
  'PREREQUISITE_BLOCK',
  'TARGET_REMEDIATION',
  'TARGET_REVIEW',
  'TARGET_ADVANCE',
  'TARGET_PRACTICE',
] as const

