'use client'

import { useState } from 'react'
import { Icon } from '@/components/seekito/SeekitoUI'

type Props = { conceptId: string; conceptName: string; description?: string | null; mastery?: number; confidence?: number }
type Explanation = { title: string; explanation: string; example: string[]; keyPoints: string[]; commonMistake: string; checkQuestion: string; source: 'AI' | 'DEMO' }
type Question = { question: string; options: string[]; correctAnswer: string; explanation: string; hint: string; difficulty: string }

export function SeekitoAI({ conceptId, conceptName, description, mastery, confidence }: Props) {
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState<'explain' | 'questions' | null>(null)
  const [timeMinutes, setTimeMinutes] = useState(10)
  const [error, setError] = useState<string | null>(null)
  async function run(kind: 'explain' | 'questions') {
    setLoading(kind); setError(null)
    try {
      const response = await fetch(`/api/ai/${kind}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ conceptId, mastery, confidence, count: 5, timeMinutes }) })
      const body = await response.json()
      if (!response.ok || !body.success) throw new Error(body.error ?? 'Seekito AI is unavailable')
      if (kind === 'explain') setExplanation(body.explanation)
      else setQuestions(body.questions)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Seekito AI is unavailable') } finally { setLoading(null) }
  }
  return <section className="seekito-ai-card"><div className="seekito-ai-header"><div><p className="eyebrow">SEEKITO AI GUIDE</p><h2>Learn {conceptName} your way.</h2><p>{description ?? 'Get a clear explanation or a fresh set of practice questions.'}</p></div><span className="seekito-ai-mark"><Icon name="spark" /></span></div><div className="seekito-ai-actions"><button className="secondary-button" onClick={() => run('explain')} disabled={loading !== null}><Icon name="lightbulb" />{loading === 'explain' ? 'Explaining…' : 'Explain this concept'}</button><button className="primary-button" onClick={() => run('questions')} disabled={loading !== null}><Icon name="pen" />{loading === 'questions' ? 'Generating…' : 'Generate 5 questions'}</button></div>{error && <p className="inline-error">{error}</p>}{explanation && <article className="seekito-ai-result"><div className="seekito-ai-result-label"><span>CONCEPT EXPLANATION</span><small>{explanation.source === 'AI' ? 'AI generated' : 'Demo content'}</small></div><h3>{explanation.title}</h3><p>{explanation.explanation}</p>{explanation.example.length > 0 && <div className="seekito-ai-example"><strong>Worked example</strong><ol>{explanation.example.map((step) => <li key={step}>{step}</li>)}</ol></div>}<div className="seekito-ai-columns"><div><strong>Remember</strong><ul>{explanation.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></div><div><strong>Watch for</strong><p>{explanation.commonMistake}</p></div></div><div className="seekito-ai-check"><strong>Quick check</strong><span>{explanation.checkQuestion}</span></div></article>}{questions.length > 0 && <article className="seekito-ai-result"><div className="seekito-ai-result-label"><span>QUESTION SET</span><small>{questions.length} questions · {questions[0].difficulty.toLowerCase()} starting point</small></div><h3>Fresh practice for {conceptName}</h3><div className="seekito-ai-question-list">{questions.map((question, index) => <div className="seekito-ai-question" key={`${question.question}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{question.question}</strong><small>{question.options.join(' · ')}</small></div><em>{question.difficulty}</em></div>)}</div><p className="seekito-ai-note">These questions are content suggestions. Submit answers through Practice so correctness and hint use become learner evidence.</p></article>}</section>
}
