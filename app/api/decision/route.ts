import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { DECISION_THRESHOLDS, evaluateDecision } from '@/lib/decision-engine'
import type { DecisionContext, DecisionEvidence, DecisionAttempt, DecisionResult } from '@/lib/decision-engine'
import type { LearnerState } from '@/types/database'
import { canonicalDemoConceptId, demoConcepts, demoDecision, isDemoMode } from '@/lib/demo/store'
import { demoQuestions } from '@/lib/demo/store'
import { buildRecommendation } from '@/lib/recommendation-engine'

const requestSchema = z.object({ targetConceptId: z.string().uuid() })

export async function POST(request: Request) {
  try {
    if (isDemoMode()) { const body = requestSchema.safeParse(await request.json()); if (!body.success) return NextResponse.json({ success: false, error: body.error.flatten() }, { status: 400 }); const concept = demoConcepts.find((item) => item.id === canonicalDemoConceptId(body.data.targetConceptId)); if (!concept) return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 }); const result = demoDecision(concept.id); const recommendation = buildRecommendation({ decision: result, targetConcept: concept, concepts: demoConcepts, content: demoConcepts.map((item) => ({ conceptId: item.id, questionCount: demoQuestions.filter((question) => question.concept_id === item.id).length, difficulties: [...new Set(demoQuestions.filter((question) => question.concept_id === item.id).map((question) => question.difficulty))] })) }); return NextResponse.json({ success: true, concept, result, recommendation }) }
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const body = requestSchema.safeParse(await request.json())
    if (!body.success) return NextResponse.json({ success: false, error: body.error.flatten() }, { status: 400 })
    const targetConceptId = body.data.targetConceptId
    const [{ data: target, error: targetError }, { data: relationships, error: relationshipError }] = await Promise.all([
      student.admin.from('concepts').select('id,name').eq('id', targetConceptId).eq('is_active', true).single(),
      student.admin.from('concept_prerequisites').select('concept_id,prerequisite_concept_id').eq('concept_id', targetConceptId).order('priority'),
    ])
    if (targetError || !target) return NextResponse.json({ success: false, error: 'Target concept not found' }, { status: 404 })
    if (relationshipError) throw relationshipError
    const graphRelationships = (relationships ?? []) as Array<{ concept_id: string; prerequisite_concept_id: string }>
    const prerequisiteIds = graphRelationships.map((item) => item.prerequisite_concept_id)
    const allConceptIds = [targetConceptId, ...prerequisiteIds]
    const [{ data: graphConcepts, error: graphError }, { data: states, error: stateError }, { data: evidence, error: evidenceError }, { data: attempts, error: attemptsError }] = await Promise.all([
      student.admin.from('concepts').select('id,name').in('id', allConceptIds).eq('is_active', true),
      student.admin.from('learner_state').select('*').eq('student_id', student.student.id).in('concept_id', allConceptIds),
      student.admin.from('evidence_events').select('id,evidence_type,created_at,value').eq('student_id', student.student.id).eq('concept_id', targetConceptId).order('created_at', { ascending: false }).limit(DECISION_THRESHOLDS.recentEvidenceWindow),
      student.admin.from('attempts').select('is_correct,submitted_at').eq('student_id', student.student.id).eq('concept_id', targetConceptId).order('submitted_at', { ascending: false }).limit(DECISION_THRESHOLDS.recentEvidenceWindow),
    ])
    if (graphError) throw graphError
    if (stateError) throw stateError
    if (evidenceError) throw evidenceError
    if (attemptsError) throw attemptsError
    const stateRows = (states ?? []) as unknown as LearnerState[]
    const stateByConcept = new Map(stateRows.map((state) => [state.concept_id, state]))
    const context: DecisionContext = {
      studentId: student.student.id,
      targetConceptId,
      targetConcept: target,
      learnerState: stateByConcept.get(targetConceptId) ?? null,
      prerequisiteStates: Object.fromEntries(prerequisiteIds.map((id) => [id, stateByConcept.get(id) ?? null])),
      recentEvidence: (evidence ?? []) as unknown as DecisionEvidence[],
      recentAttempts: (attempts ?? []) as unknown as DecisionAttempt[],
      conceptGraph: { concepts: graphConcepts ?? [], relationships: graphRelationships },
    }
    let result = evaluateDecision(context)
    const { data: activeOverride, error: overrideError } = await student.admin.from('teacher_overrides').select('new_action,reason,created_at').eq('student_id', student.student.id).eq('concept_id', targetConceptId).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (overrideError) throw overrideError
    if (activeOverride) {
      const overrideDecision: DecisionResult['decision'] = activeOverride.new_action === 'review' ? 'REVIEW' : activeOverride.new_action === 'advance' ? 'ADVANCE' : activeOverride.new_action === 'remediation' || activeOverride.new_action === 'teacher_intervention' ? 'REMEDIATE' : activeOverride.new_action === 'teach_prerequisite' ? 'BLOCKED' : 'PRACTICE'
      result = {
        ...result,
        decision: overrideDecision,
        recommendedAction: overrideDecision.toLowerCase() as typeof result.recommendedAction,
        reasons: [`Teacher override applied: ${activeOverride.reason}`, ...result.reasons],
        trace: { ...result.trace, finalDecision: overrideDecision, rulesEvaluated: [...result.trace.rulesEvaluated, { rule: 'TEACHER_OVERRIDE', matched: true, details: { action: activeOverride.new_action, createdAt: activeOverride.created_at } }] },
      }
    }
    const recommendationConceptIds = [targetConceptId, ...result.blockingPrerequisites.map((item) => item.conceptId)]
    const { data: recommendationQuestions, error: questionError } = await student.admin.from('questions').select('concept_id,difficulty').in('concept_id', recommendationConceptIds).eq('is_active', true)
    if (questionError) throw questionError
    const content = recommendationConceptIds.map((conceptId) => ({ conceptId, questionCount: (recommendationQuestions ?? []).filter((item) => item.concept_id === conceptId).length, difficulties: [...new Set((recommendationQuestions ?? []).filter((item) => item.concept_id === conceptId).map((item) => item.difficulty))] }))
    const recommendation = buildRecommendation({ decision: result, targetConcept: target, concepts: graphConcepts ?? [], content, evidenceIds: (evidence ?? []).map((item) => item.id) })
    const { error: historyError } = await student.admin.from('decision_events').insert({
      student_id: student.student.id,
      concept_id: targetConceptId,
      decision: result.decision,
      mastery: result.mastery,
      confidence: result.confidence,
      blocking_prerequisites: result.blockingPrerequisites,
      reasons: result.reasons,
      trace: result.trace,
      engine_version: result.engineVersion,
    })
    if (historyError) throw historyError
    const { data: storedRecommendation, error: recommendationError } = await student.admin.from('recommendations').insert({
      student_id: student.student.id,
      concept_id: targetConceptId,
      action: recommendation.action,
      reason_codes: recommendation.reasonCodes,
      evidence_ids: recommendation.evidenceIds,
      state_snapshot: { mastery: result.mastery, confidence: result.confidence, decision: result.decision, blockingPrerequisites: result.blockingPrerequisites, recommendation: recommendation.trace },
      engine_version: result.engineVersion,
    }).select('id,action,reason_codes,evidence_ids,state_snapshot,engine_version,created_at').single()
    if (recommendationError) throw recommendationError
    return NextResponse.json({ success: true, concept: target, result, recommendation: { ...recommendation, id: storedRecommendation?.id, createdAt: storedRecommendation?.created_at } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to evaluate decision' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    if (isDemoMode()) return NextResponse.json({ success: true, decisions: [] })
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const { data, error } = await student.admin.from('decision_events').select('id,concept_id,decision,mastery,confidence,blocking_prerequisites,reasons,trace,engine_version,created_at').eq('student_id', student.student.id).order('created_at', { ascending: false }).limit(50)
    if (error) throw error
    return NextResponse.json({ success: true, decisions: data ?? [] })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load decision history' }, { status: 500 })
  }
}
