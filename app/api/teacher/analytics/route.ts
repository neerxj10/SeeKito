import { NextResponse } from 'next/server'
import { demoAttempts, demoConcepts, demoStates, demoTeacherData, isDemoMode } from '@/lib/demo/store'

export async function GET() {
  if (!isDemoMode()) return NextResponse.json({ success: false, error: 'Teacher analytics requires an authenticated teacher workspace.' }, { status: 401 })
  const states = demoStates()
  const attempts = demoAttempts()
  const concepts = demoConcepts.map((concept) => {
    const state = states.find((item) => item.concept_id === concept.id)
    const conceptAttempts = attempts.filter((item) => item.conceptId === concept.id)
    return { conceptId: concept.id, name: concept.name, subject: concept.subject, mastery: Math.round(state?.mastery_score ?? 0), attempts: conceptAttempts.length, accuracy: conceptAttempts.length ? Math.round(conceptAttempts.filter((item) => item.isCorrect).length / conceptAttempts.length * 100) : 0 }
  })
  const difficulty = ['EASY', 'MEDIUM', 'HARD'].map((level) => { const items = attempts.filter((item) => demoConcepts.some((concept) => concept.id === item.conceptId) && (item.question.includes('²') || level === 'EASY' || level === 'MEDIUM')) ; return { level, accuracy: items.length ? Math.round(items.filter((item) => item.isCorrect).length / items.length * 100) : level === 'EASY' ? 92 : level === 'MEDIUM' ? 68 : 41 } })
  const activity = Array.from({ length: 14 }, (_, index) => Math.max(8, attempts.filter((item) => new Date(item.submittedAt).getDate() % 14 === index).length * 18 + (index % 3) * 12))
  const teacher = demoTeacherData()
  return NextResponse.json({ success: true, analytics: { students: teacher.stats.students, averageMastery: Math.round(teacher.students.reduce((sum, student) => sum + student.mastery, 0) / teacher.students.length), concepts, difficulty, activity } })
}
