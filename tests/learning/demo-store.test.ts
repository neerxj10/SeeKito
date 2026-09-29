import { afterEach, describe, expect, it } from 'vitest'
import { demoQuestions, demoStates, demoSubmit, resetDemo } from '@/lib/demo/store'

describe('demo assessment persistence', () => {
  afterEach(() => resetDemo())

  it('initializes state for a concept that has no prior mastery entry', () => {
    const question = demoQuestions.find((item) => item.concept_id.endsWith('000000000006'))
    expect(question).toBeDefined()

    demoSubmit(question!.id, question!.correctAnswer, false)

    const state = demoStates().find((item) => item.concept_id === question!.concept_id)
    expect(state?.mastery_score).toBe(20)
    expect(Number.isNaN(state?.mastery_score ?? NaN)).toBe(false)
    expect(state?.attempt_count).toBe(1)
  })
})
