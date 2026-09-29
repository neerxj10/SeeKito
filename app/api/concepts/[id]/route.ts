import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { canonicalDemoConceptId, demoConcepts, demoPrerequisites, isDemoMode } from '@/lib/demo/store'

type Relationship = { id: string; concept_id: string; prerequisite_concept_id: string; required_mastery: number; priority: number }
type RelatedConcept = { id: string; name: string; slug: string }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (isDemoMode()) {
      const concept = demoConcepts.find((item) => item.id === canonicalDemoConceptId(id))
      if (!concept) return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 })
      return NextResponse.json({ success: true, concept, prerequisites: demoPrerequisites.filter((item) => item.concept_id === id).map((item) => ({ ...item, concept: demoConcepts.find((candidate) => candidate.id === item.prerequisite_concept_id) ?? null })), dependents: demoPrerequisites.filter((item) => item.prerequisite_concept_id === id).map((item) => ({ ...item, concept: demoConcepts.find((candidate) => candidate.id === item.concept_id) ?? null })) })
    }
    const supabase = getSupabaseServerClient()
    const [{ data: concept, error: conceptError }, { data: relationshipData, error: relationshipsError }] = await Promise.all([
      supabase.from('concepts').select('id,name,slug,description,subject,difficulty,estimated_minutes,is_active').eq('id', id).eq('is_active', true).single(),
      supabase.from('concept_prerequisites').select('id,concept_id,prerequisite_concept_id,required_mastery,priority').or(`concept_id.eq.${id},prerequisite_concept_id.eq.${id}`).order('priority'),
    ])
    if (conceptError) throw conceptError
    if (relationshipsError) throw relationshipsError
    const relationships = (relationshipData ?? []) as Relationship[]
    const prerequisiteRelationships = (relationships ?? []).filter((relationship) => relationship.concept_id === id)
    const dependentRelationships = (relationships ?? []).filter((relationship) => relationship.prerequisite_concept_id === id)
    const relatedIds = [...new Set([
      ...prerequisiteRelationships.map((relationship) => relationship.prerequisite_concept_id),
      ...dependentRelationships.map((relationship) => relationship.concept_id),
    ])]
    const { data: relatedConceptData, error: relatedConceptsError } = relatedIds.length
      ? await supabase.from('concepts').select('id,name,slug').in('id', relatedIds).eq('is_active', true)
      : { data: [], error: null }
    if (relatedConceptsError) throw relatedConceptsError
    const relatedConcepts = (relatedConceptData ?? []) as RelatedConcept[]
    const relatedById = new Map(relatedConcepts.map((related) => [related.id, related]))
    const prerequisites = prerequisiteRelationships.map((relationship) => ({
      ...relationship,
      concept: relatedById.get(relationship.prerequisite_concept_id) ?? null,
    }))
    const dependents = dependentRelationships.map((relationship) => ({
      ...relationship,
      concept: relatedById.get(relationship.concept_id) ?? null,
    }))
    return NextResponse.json({ success: true, concept, prerequisites, dependents })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load concept' }, { status: 404 })
  }
}
