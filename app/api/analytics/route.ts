import { NextResponse } from 'next/server'
import { getAuthenticatedStudent } from '@/lib/supabase/server'
import { demoAttempts, demoConcepts, demoStates, isDemoMode } from '@/lib/demo/store'

function summarize(concepts: Array<{ id: string; name: string; subject?: string }>, states: Array<{ concept_id: string; mastery_score: number; attempt_count?: number; correct_count?: number }>, attempts: Array<{ concept_id: string; is_correct: boolean; submitted_at: string }>) {
  const stateById = new Map(states.map((state) => [state.concept_id, state]))
  const groups = new Map<string, { mastery: number[]; attempts: number; correct: number }>()
  for (const concept of concepts) {
    const group = groups.get(concept.subject ?? 'GENERAL') ?? { mastery: [], attempts: 0, correct: 0 }
    const state = stateById.get(concept.id)
    if (state) group.mastery.push(Number(state.mastery_score))
    group.attempts += Number(state?.attempt_count ?? 0)
    group.correct += Number(state?.correct_count ?? 0)
    groups.set(concept.subject ?? 'GENERAL', group)
  }
  const activity = attempts.slice(0, 12).map((attempt) => ({ conceptId: attempt.concept_id, correct: attempt.is_correct, submittedAt: attempt.submitted_at }))
  return {
    overallMastery: states.length ? Math.round(states.reduce((sum, state) => sum + Number(state.mastery_score), 0) / states.length) : 0,
    totalAttempts: attempts.length,
    completedConcepts: states.filter((state) => Number(state.mastery_score) >= 80).length,
    subjectMastery: [...groups.entries()].map(([subject, group]) => ({ subject, mastery: group.mastery.length ? Math.round(group.mastery.reduce((sum, value) => sum + value, 0) / group.mastery.length) : 0, attempts: group.attempts, accuracy: group.attempts ? Math.round((group.correct / group.attempts) * 100) : 0 })),
    conceptMastery: concepts.map((concept) => ({ ...concept, conceptId: concept.id, mastery: Number(stateById.get(concept.id)?.mastery_score ?? 0), attempts: Number(stateById.get(concept.id)?.attempt_count ?? 0), accuracy: Number(stateById.get(concept.id)?.attempt_count ?? 0) ? Math.round((Number(stateById.get(concept.id)?.correct_count ?? 0) / Number(stateById.get(concept.id)?.attempt_count ?? 1)) * 100) : 0 })),
    recentActivity: activity,
  }
}

export async function GET(request: Request) {
  try {
    if (isDemoMode()) return NextResponse.json({ success: true, analytics: summarize(demoConcepts, demoStates(), demoAttempts().map((attempt) => ({ concept_id: attempt.conceptId, is_correct: attempt.isCorrect, submitted_at: attempt.submittedAt }))) })
    const student = await getAuthenticatedStudent(request)
    if (!student) return NextResponse.json({ success: false, error: 'Student authentication required' }, { status: 401 })
    const [{ data: concepts, error: conceptsError }, { data: states, error: statesError }, { data: attempts, error: attemptsError }] = await Promise.all([
      student.admin.from('concepts').select('id,name,subject').eq('is_active', true).order('name'),
      student.admin.from('learner_state').select('concept_id,mastery_score,attempt_count,correct_count').eq('student_id', student.student.id),
      student.admin.from('attempts').select('concept_id,is_correct,submitted_at').eq('student_id', student.student.id).order('submitted_at', { ascending: false }).limit(100),
    ])
    if (conceptsError) throw conceptsError
    if (statesError) throw statesError
    if (attemptsError) throw attemptsError
    return NextResponse.json({ success: true, analytics: summarize(concepts ?? [], states ?? [], attempts ?? []) })
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load analytics' }, { status: 503 }) }
}
