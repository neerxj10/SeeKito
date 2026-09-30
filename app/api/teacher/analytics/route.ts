import { NextResponse } from 'next/server'
import { demoAttempts, demoConcepts, demoQuestions, demoStates, demoTeacherData, isDemoMode } from '@/lib/demo/store'

export async function GET() {
  if (!isDemoMode()) return NextResponse.json({ success: false, error: 'Teacher analytics requires an authenticated teacher workspace.' }, { status: 401 })
  const states = demoStates()
  const attempts = demoAttempts()
  const concepts = demoConcepts.map((concept) => {
    const state = states.find((item) => item.concept_id === concept.id)
    const conceptAttempts = attempts.filter((item) => item.conceptId === concept.id)
    return { conceptId: concept.id, name: concept.name, subject: concept.subject, mastery: Math.round(state?.mastery_score ?? 0), attempts: conceptAttempts.length, accuracy: conceptAttempts.length ? Math.round(conceptAttempts.filter((item) => item.isCorrect).length / conceptAttempts.length * 100) : 0 }
  })
  const difficulty = ['EASY', 'MEDIUM', 'HARD'].map((level) => { const items = attempts.filter((item) => demoQuestions.some((question) => question.id === item.questionId && question.difficulty === level)); return { level, accuracy: items.length ? Math.round(items.filter((item) => item.isCorrect).length / items.length * 100) : 0 } })
  const now = Date.now()
  const activity = Array.from({ length: 14 }, (_, index) => { const dayStart = now - (13 - index) * 86_400_000; const dayEnd = dayStart + 86_400_000; return attempts.filter((item) => { const timestamp = new Date(item.submittedAt).getTime(); return timestamp >= dayStart && timestamp < dayEnd }).length })
  const teacher = demoTeacherData()
  return NextResponse.json({ success: true, analytics: { students: teacher.stats.students, averageMastery: Math.round(teacher.students.reduce((sum, student) => sum + student.mastery, 0) / teacher.students.length), concepts, difficulty, activity } })
}
