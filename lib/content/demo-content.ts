import { demoConcepts } from '@/lib/demo/store'

export const demoTopics = [
  { id: '51000000-0000-4000-8000-000000000001', subject: 'ALGEBRA', name: 'Arithmetic & Number Sense', slug: 'arithmetic-number-sense', description: 'Numbers, operations, and fractions.' },
  { id: '51000000-0000-4000-8000-000000000002', subject: 'ALGEBRA', name: 'Algebra Foundations', slug: 'algebra-foundations', description: 'Expressions and equations.' },
  { id: '51000000-0000-4000-8000-000000000003', subject: 'SCIENCE', name: 'Scientific Foundations', slug: 'scientific-foundations', description: 'Evidence, models, and measurement.' },
  { id: '51000000-0000-4000-8000-000000000004', subject: 'SCIENCE', name: 'Physics in Motion', slug: 'physics-in-motion', description: 'Forces, energy, and momentum.' },
]

export type DemoContent = {
  id: string
  concept_id: string
  content_type: 'LESSON' | 'EXPLANATION' | 'WORKED_EXAMPLE' | 'SUMMARY' | 'PRACTICE' | 'REVIEW' | 'REMEDIATION'
  title: string
  description: string
  body: { objective?: string; paragraphs?: string[]; steps?: string[]; keyPoints?: string[]; commonMistakes?: string[] }
  difficulty: string
  estimated_minutes: number
  order_index: number
  version: number
  is_active: boolean
}

const contentTemplates: Record<string, { objective: string; explanation: string; example: string[]; keyPoints: string[]; mistakes: string[] }> = {
  'Basic Arithmetic': { objective: 'Use the four operations and order of operations with confidence.', explanation: 'Arithmetic is the foundation for every later algebraic step. Keep the operation structure visible before calculating.', example: ['Evaluate 18 − 3 × 4.', 'Multiply first: 3 × 4 = 12.', 'Subtract: 18 − 12 = 6.'], keyPoints: ['Multiply and divide before adding and subtracting.', 'Estimate first so an answer has a reasonable size.'], mistakes: ['Working left to right without applying operation priority.', 'Dropping a negative sign during subtraction.'] },
  Fractions: { objective: 'Compare, add, subtract, and simplify fractions.', explanation: 'A fraction names equal parts of a whole. Equivalent fractions have the same value even when their numerators and denominators differ.', example: ['Add 1/2 + 1/4.', 'Rewrite 1/2 as 2/4.', 'Add the numerators: 2/4 + 1/4 = 3/4.'], keyPoints: ['Use a common denominator before adding or subtracting.', 'Simplify by dividing numerator and denominator by the same factor.'], mistakes: ['Adding denominators directly.', 'Changing only the numerator when making equivalent fractions.'] },
  'Algebraic Operations': { objective: 'Simplify expressions by combining like terms and distributing factors.', explanation: 'Like terms have the same variable part. Their coefficients can be combined, while unlike terms must remain separate.', example: ['Simplify 2(a + 3) + a.', 'Distribute: 2a + 6 + a.', 'Combine like terms: 3a + 6.'], keyPoints: ['Distribute to every term inside parentheses.', 'Combine coefficients, not variable names.'], mistakes: ['Combining unlike terms such as a and a².', 'Forgetting to distribute a negative sign.'] },
  'Linear Equations': { objective: 'Solve one-variable equations using inverse operations.', explanation: 'An equation is balanced when both sides have equal value. Undo operations in reverse order and perform the same operation on both sides.', example: ['Solve 3x − 2 = 10.', 'Add 2: 3x = 12.', 'Divide by 3: x = 4.'], keyPoints: ['Keep both sides balanced.', 'Check the solution in the original equation.'], mistakes: ['Changing one side only.', 'Undoing operations in the wrong order.'] },
  'Quadratic Equations': { objective: 'Recognize quadratic structure and connect factor pairs to solutions.', explanation: 'A quadratic has a highest power of two. Factoring rewrites it as a product, making the zero-product rule useful.', example: ['Solve x² + 5x + 6 = 0.', 'Factor as (x + 2)(x + 3) = 0.', 'The solutions are x = −2 and x = −3.'], keyPoints: ['Look for two numbers with the right product and sum.', 'Each factor can equal zero.'], mistakes: ['Using factor pairs with the wrong signs.', 'Finding one root and stopping before checking the second factor.'] },
  'Scientific Basics': { objective: 'Use observations, variables, and evidence to explain scientific ideas.', explanation: 'Science turns a question into a testable investigation. Careful observations and controlled variables make conclusions more trustworthy.', example: ['Question: Does light affect plant growth?', 'Change light exposure, keep water and soil consistent.', 'Measure growth and compare the results.'], keyPoints: ['A hypothesis must be testable.', 'Evidence should be recorded before drawing a conclusion.'], mistakes: ['Changing multiple variables at once.', 'Treating an opinion as evidence.'] },
  'Force & Motion': { objective: 'Describe motion and explain how forces change it.', explanation: 'Motion describes how an object’s position changes. A force is a push or pull that can change speed, direction, or shape.', example: ['A bicycle speeds up when the rider pedals harder.', 'The unbalanced forward force changes velocity.', 'Friction and air resistance oppose the motion.'], keyPoints: ['Velocity includes direction, not just speed.', 'Unbalanced forces cause changes in motion.'], mistakes: ['Assuming a moving object always needs a forward force.', 'Confusing speed with velocity.'] },
  "Newton's Laws": { objective: 'Apply Newton’s three laws to everyday interactions.', explanation: 'Newton’s laws connect motion to forces. The net force, not any single force, determines acceleration.', example: ['A 2 kg cart experiences a net force of 6 N.', 'Use F = ma, so a = F/m.', 'The acceleration is 3 m/s² in the force direction.'], keyPoints: ['First law: motion changes only with unbalanced force.', 'Second law: F = ma.', 'Third law: interaction forces are equal and opposite on different objects.'], mistakes: ['Treating action-reaction forces as acting on the same object.', 'Using total force instead of net force.'] },
  'Work & Energy': { objective: 'Explain energy transfers and calculate work from force and distance.', explanation: 'Energy is the capacity to cause change. Work transfers energy when a force moves an object through a distance in the force direction.', example: ['A 10 N force moves a box 3 m forward.', 'Work = force × distance.', 'The work done is 30 J.'], keyPoints: ['Energy is conserved but can change form.', 'Work is measured in joules.'], mistakes: ['Confusing force with work when there is no movement.', 'Ignoring the direction of the force.'] },
  Momentum: { objective: 'Relate mass and velocity to motion in collisions.', explanation: 'Momentum measures motion and depends on both mass and velocity. In an isolated system, total momentum is conserved.', example: ['A 2 kg trolley moves at 4 m/s.', 'Momentum = mass × velocity.', 'The trolley has 8 kg·m/s of momentum.'], keyPoints: ['Momentum has direction.', 'Collisions transfer momentum between objects.'], mistakes: ['Using speed without direction in a vector situation.', 'Assuming momentum disappears after a collision.'] },
}

export const demoLearningContent: DemoContent[] = demoConcepts.flatMap((concept, conceptIndex) => {
  const template = contentTemplates[concept.name]
  if (!template) return []
  return [
    { content_type: 'LESSON' as const, title: `Understand ${concept.name}`, description: template.objective, body: { objective: template.objective, paragraphs: [template.explanation] } },
    { content_type: 'EXPLANATION' as const, title: 'The idea in plain language', description: 'A concise explanation before you practise.', body: { paragraphs: [template.explanation, `Use this idea to make your next ${concept.name} decision more deliberate.`] } },
    { content_type: 'WORKED_EXAMPLE' as const, title: 'Worked example', description: 'Follow the reasoning one step at a time.', body: { steps: template.example } },
    { content_type: 'SUMMARY' as const, title: 'Key points to remember', description: 'A quick retrieval summary.', body: { keyPoints: template.keyPoints } },
    { content_type: 'REMEDIATION' as const, title: 'Common mistakes', description: 'Use these checks when an answer feels uncertain.', body: { commonMistakes: template.mistakes } },
  ].map((item, itemIndex) => ({ id: `40000000-0000-4000-8000-${String(conceptIndex + 1).padStart(6, '0')}${String(itemIndex + 1).padStart(6, '0')}`, concept_id: concept.id, ...item, difficulty: concept.difficulty, estimated_minutes: itemIndex === 0 ? 8 : 4, order_index: itemIndex, version: 1, is_active: true }))
})

export function contentForConcept(conceptId: string) { return demoLearningContent.filter((item) => item.concept_id === conceptId) }
