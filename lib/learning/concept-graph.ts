export type GraphConcept = { id: string }

export type GraphRelationship = {
  concept_id: string
  prerequisite_concept_id: string
}

export type ConceptGraphValidation = {
  valid: boolean
  conceptCount: number
  relationshipCount: number
  rootConceptCount: number
  leafConceptCount: number
  problem?: {
    type: 'missing_concept' | 'self_reference' | 'cycle'
    relationship?: GraphRelationship
    conceptId?: string
  }
}

function prerequisiteMap(concepts: GraphConcept[], relationships: GraphRelationship[]) {
  const map = new Map<string, string[]>()
  for (const concept of concepts) map.set(concept.id, [])
  for (const relationship of relationships) {
    const prerequisites = map.get(relationship.concept_id)
    if (prerequisites) prerequisites.push(relationship.prerequisite_concept_id)
  }
  return map
}

export function getPrerequisites(conceptId: string, relationships: GraphRelationship[]) {
  return relationships
    .filter((relationship) => relationship.concept_id === conceptId)
    .map((relationship) => relationship.prerequisite_concept_id)
}

export function getDependents(conceptId: string, relationships: GraphRelationship[]) {
  return relationships
    .filter((relationship) => relationship.prerequisite_concept_id === conceptId)
    .map((relationship) => relationship.concept_id)
}

export function getRootConcepts(concepts: GraphConcept[], relationships: GraphRelationship[]) {
  const prerequisiteIds = new Set(relationships.map((relationship) => relationship.concept_id))
  return concepts.filter((concept) => !prerequisiteIds.has(concept.id)).map((concept) => concept.id)
}

export function getLeafConcepts(concepts: GraphConcept[], relationships: GraphRelationship[]) {
  const dependentIds = new Set(relationships.map((relationship) => relationship.prerequisite_concept_id))
  return concepts.filter((concept) => !dependentIds.has(concept.id)).map((concept) => concept.id)
}

export function getConceptPath(fromConceptId: string, toConceptId: string, relationships: GraphRelationship[]) {
  const dependents = new Map<string, string[]>()
  for (const relationship of relationships) {
    const next = dependents.get(relationship.prerequisite_concept_id) ?? []
    next.push(relationship.concept_id)
    dependents.set(relationship.prerequisite_concept_id, next)
  }

  const queue: string[][] = [[fromConceptId]]
  const visited = new Set([fromConceptId])
  while (queue.length) {
    const path = queue.shift() as string[]
    const current = path[path.length - 1]
    if (current === toConceptId) return path
    for (const dependent of dependents.get(current) ?? []) {
      if (!visited.has(dependent)) {
        visited.add(dependent)
        queue.push([...path, dependent])
      }
    }
  }
  return null
}

export function hasCircularDependency(concepts: GraphConcept[], relationships: GraphRelationship[]) {
  const graph = prerequisiteMap(concepts, relationships)
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(conceptId: string): boolean {
    if (visiting.has(conceptId)) return true
    if (visited.has(conceptId)) return false
    visiting.add(conceptId)
    for (const prerequisite of graph.get(conceptId) ?? []) {
      if (visit(prerequisite)) return true
    }
    visiting.delete(conceptId)
    visited.add(conceptId)
    return false
  }

  return concepts.some((concept) => visit(concept.id))
}

export function validateConceptGraph(concepts: GraphConcept[], relationships: GraphRelationship[]): ConceptGraphValidation {
  const conceptIds = new Set(concepts.map((concept) => concept.id))
  const invalidRelationship = relationships.find((relationship) => {
    return relationship.concept_id === relationship.prerequisite_concept_id ||
      !conceptIds.has(relationship.concept_id) ||
      !conceptIds.has(relationship.prerequisite_concept_id)
  })

  if (invalidRelationship) {
    return {
      valid: false,
      conceptCount: concepts.length,
      relationshipCount: relationships.length,
      rootConceptCount: getRootConcepts(concepts, relationships).length,
      leafConceptCount: getLeafConcepts(concepts, relationships).length,
      problem: {
        type: invalidRelationship.concept_id === invalidRelationship.prerequisite_concept_id
          ? 'self_reference'
          : conceptIds.has(invalidRelationship.concept_id) && conceptIds.has(invalidRelationship.prerequisite_concept_id)
            ? 'cycle'
            : 'missing_concept',
        relationship: invalidRelationship,
      },
    }
  }

  if (hasCircularDependency(concepts, relationships)) {
    return {
      valid: false,
      conceptCount: concepts.length,
      relationshipCount: relationships.length,
      rootConceptCount: getRootConcepts(concepts, relationships).length,
      leafConceptCount: getLeafConcepts(concepts, relationships).length,
      problem: { type: 'cycle' },
    }
  }

  return {
    valid: true,
    conceptCount: concepts.length,
    relationshipCount: relationships.length,
    rootConceptCount: getRootConcepts(concepts, relationships).length,
    leafConceptCount: getLeafConcepts(concepts, relationships).length,
  }
}

