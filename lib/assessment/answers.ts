import type { QuestionType } from '@/types/database'

export function normalizeAnswer(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isAnswerCorrect(questionType: QuestionType, submittedAnswer: unknown, correctAnswer: unknown) {
  if (questionType === 'MCQ') return normalizeAnswer(submittedAnswer) === normalizeAnswer(correctAnswer)
  return normalizeAnswer(submittedAnswer) === normalizeAnswer(correctAnswer)
}

