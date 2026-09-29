import { describe, expect, it } from 'vitest'
import {
  getDependents,
  getLeafConcepts,
  getPrerequisites,
  getRootConcepts,
  hasCircularDependency,
  validateConceptGraph,
} from '@/lib/learning/concept-graph'

const concepts = ['A', 'B', 'C', 'D'].map((id) => ({ id }))
const relationships = [
  { concept_id: 'B', prerequisite_concept_id: 'A' },
  { concept_id: 'C', prerequisite_concept_id: 'B' },
  { concept_id: 'D', prerequisite_concept_id: 'B' },
]

describe('concept graph', () => {
  it('loads and validates a DAG', () => {
    expect(validateConceptGraph(concepts, relationships)).toMatchObject({
      valid: true,
      conceptCount: 4,
      relationshipCount: 3,
      rootConceptCount: 1,
      leafConceptCount: 2,
    })
  })

  it('returns prerequisites and dependents', () => {
    expect(getPrerequisites('C', relationships)).toEqual(['B'])
    expect(getDependents('B', relationships)).toEqual(['C', 'D'])
  })

  it('detects roots and leaves dynamically', () => {
    expect(getRootConcepts(concepts, relationships)).toEqual(['A'])
    expect(getLeafConcepts(concepts, relationships)).toEqual(['C', 'D'])
  })

  it('detects a deliberately cyclic graph', () => {
    const cyclic = [
      { concept_id: 'A', prerequisite_concept_id: 'C' },
      { concept_id: 'B', prerequisite_concept_id: 'A' },
      { concept_id: 'C', prerequisite_concept_id: 'B' },
    ]
    expect(hasCircularDependency([{ id: 'A' }, { id: 'B' }, { id: 'C' }], cyclic)).toBe(true)
    expect(validateConceptGraph([{ id: 'A' }, { id: 'B' }, { id: 'C' }], cyclic)).toMatchObject({ valid: false, problem: { type: 'cycle' } })
  })

  it('identifies self-reference and missing concepts', () => {
    expect(validateConceptGraph([{ id: 'A' }], [{ concept_id: 'A', prerequisite_concept_id: 'A' }]).problem?.type).toBe('self_reference')
    expect(validateConceptGraph([{ id: 'A' }], [{ concept_id: 'A', prerequisite_concept_id: 'B' }]).problem?.type).toBe('missing_concept')
  })
})

