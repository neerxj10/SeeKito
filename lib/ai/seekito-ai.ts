import { z } from 'zod'
import { contentForConcept } from '@/lib/content/demo-content'
import { demoConcepts, demoQuestions } from '@/lib/demo/store'

const questionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(5),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  hint: z.string().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
})

const questionSetSchema = z.object({ questions: z.array(questionSchema).min(1).max(10) })
export type SeekitoQuestion = z.infer<typeof questionSchema>

export type SeekitoExplanation = {
  concept: string
  title: string
  explanation: string
  example: string[]
  keyPoints: string[]
  commonMistake: string
  checkQuestion: string
  source: 'AI' | 'DEMO'
}

type AIContext = { conceptId: string; conceptName: string; description?: string | null; mastery?: number; confidence?: number; learnerLevel?: string; helpStyle?: string }

async function askModel(instruction: string) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini', temperature: 0.35, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are Seekito AI, a precise and encouraging educational content assistant. Return valid JSON only. Never claim a learner has mastered anything.' }, { role: 'user', content: instruction }] }) })
  if (!response.ok) throw new Error(`Seekito AI provider error (${response.status})`)
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = body.choices?.[0]?.message?.content
  if (!content) throw new Error('Seekito AI returned no content')
  return JSON.parse(content) as unknown
}

function fallbackExplanation(input: AIContext): SeekitoExplanation {
  const content = contentForConcept(input.conceptId)
  const lesson = content.find((item) => item.content_type === 'LESSON')
  const example = content.find((item) => item.content_type === 'WORKED_EXAMPLE')
  const summary = content.find((item) => item.content_type === 'SUMMARY')
  const mistakes = content.find((item) => item.content_type === 'REMEDIATION')
  return { concept: input.conceptName, title: `Understand ${input.conceptName}`, explanation: lesson?.body.paragraphs?.[0] ?? input.description ?? `Build a clear mental model of ${input.conceptName} before you practise.`, example: example?.body.steps ?? [], keyPoints: summary?.body.keyPoints ?? [], commonMistake: mistakes?.body.commonMistakes?.[0] ?? 'Check each step before finalising your answer.', checkQuestion: `In your own words, what is the main idea behind ${input.conceptName}?`, source: 'DEMO' }
}

export async function explainConcept(input: AIContext): Promise<SeekitoExplanation> {
  const fallback = fallbackExplanation(input)
  const result = await askModel(`Explain the concept "${input.conceptName}" for a ${input.learnerLevel ?? 'secondary school'} learner. Description: ${input.description ?? 'not provided'}. Mastery: ${input.mastery ?? 0}%. Confidence: ${input.confidence ?? 0}%. Preferred help: ${input.helpStyle ?? 'worked examples'}. Return JSON with exactly these string/array fields: concept, title, explanation, example (array of 3 short steps), keyPoints (array of 3 short points), commonMistake, checkQuestion.`)
  if (!result) return fallback
  const parsed = z.object({ concept: z.string(), title: z.string(), explanation: z.string(), example: z.array(z.string()).min(1), keyPoints: z.array(z.string()).min(1), commonMistake: z.string(), checkQuestion: z.string() }).safeParse(result)
  return parsed.success ? { ...parsed.data, source: 'AI' } : fallback
}

export async function generateQuestions(input: AIContext & { count?: number; difficulty?: string; timeMinutes?: number }): Promise<{ questions: SeekitoQuestion[]; source: 'AI' | 'DEMO' }> {
  const fallback = demoQuestions.filter((question) => question.concept_id === input.conceptId).slice(0, input.count ?? 5).map((question) => ({ question: question.question, options: question.options, correctAnswer: question.correctAnswer, explanation: question.explanation, hint: question.hint, difficulty: question.difficulty as 'EASY' | 'MEDIUM' | 'HARD' }))
  const result = await askModel(`Generate ${input.count ?? 5} original multiple-choice questions about "${input.conceptName}" for a ${input.learnerLevel ?? 'secondary school'} learner. Description: ${input.description ?? 'not provided'}. Target difficulty: ${input.difficulty ?? 'mixed'}. Mastery: ${input.mastery ?? 0}%. Build a focused quiz designed to fit within ${input.timeMinutes ?? 10} minutes, with a mix of recall and one transfer question. Return JSON: {"questions":[{"question":string,"options":[string,string,string,string],"correctAnswer":string,"explanation":string,"hint":string,"difficulty":"EASY"|"MEDIUM"|"HARD"}]}. The correctAnswer must exactly match one option.`)
  if (!result) return { questions: fallback, source: 'DEMO' }
  const parsed = questionSetSchema.safeParse(result)
  if (!parsed.success) return { questions: fallback, source: 'DEMO' }
  const valid = parsed.data.questions.filter((question) => question.options.includes(question.correctAnswer))
  return { questions: valid.length ? valid : fallback, source: valid.length ? 'AI' : 'DEMO' }
}

export function conceptContext(conceptId: string) {
  return demoConcepts.find((concept) => concept.id === conceptId) ?? null
}
