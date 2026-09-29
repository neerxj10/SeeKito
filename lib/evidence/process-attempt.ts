import type { EvidenceType } from '@/types/database'
import { EVIDENCE_THRESHOLDS } from '@/lib/learning/thresholds'

export type AttemptEvidenceInput = {
  id?: string
  concept_id: string
  is_correct: boolean
  used_hint: boolean
  hint_count: number
  response_time_ms: number | null
  submitted_at?: string
}

export type EvidenceDraft = {
  event_type: EvidenceType
  event_value: number
  metadata: Record<string, unknown>
}

export function processAttempt(attempt: AttemptEvidenceInput, recentAttempts: AttemptEvidenceInput[] = []): EvidenceDraft[] {
  const evidence: EvidenceDraft[] = []
  if (attempt.is_correct) {
    evidence.push({
      event_type: attempt.used_hint ? 'CORRECT_WITH_HINT' : 'CORRECT_INDEPENDENT',
      event_value: 1,
      metadata: { hint_count: attempt.hint_count },
    })
    if (attempt.response_time_ms !== null && attempt.response_time_ms < EVIDENCE_THRESHOLDS.fastSuccessMs) {
      evidence.push({ event_type: 'FAST_SUCCESS', event_value: attempt.response_time_ms, metadata: { threshold_ms: EVIDENCE_THRESHOLDS.fastSuccessMs } })
    }
    if (attempt.response_time_ms !== null && attempt.response_time_ms > EVIDENCE_THRESHOLDS.slowSuccessMs) {
      evidence.push({ event_type: 'SLOW_SUCCESS', event_value: attempt.response_time_ms, metadata: { threshold_ms: EVIDENCE_THRESHOLDS.slowSuccessMs } })
    }
  } else {
    evidence.push({ event_type: 'INCORRECT', event_value: 0, metadata: { hint_count: attempt.hint_count } })
    const priorFailures = recentAttempts.filter((item) => item.concept_id === attempt.concept_id && !item.is_correct).length
    if (priorFailures >= 1) {
      evidence.push({ event_type: 'REPEATED_FAILURE', event_value: priorFailures + 1, metadata: { prior_failure_count: priorFailures } })
    }
  }
  return evidence
}

