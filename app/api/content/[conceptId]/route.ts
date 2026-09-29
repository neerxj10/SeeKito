import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { canonicalDemoConceptId, demoConcepts, demoPrerequisites, isDemoMode } from '@/lib/demo/store'
import { contentForConcept } from '@/lib/content/demo-content'

export async function GET(_request: Request, { params }: { params: Promise<{ conceptId: string }> }) {
  const { conceptId: rawId } = await params
  const conceptId = isDemoMode() ? canonicalDemoConceptId(rawId) : rawId
  if (isDemoMode()) {
    const concept = demoConcepts.find((item) => item.id === conceptId)
    if (!concept) return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 })
    return NextResponse.json({ success: true, concept: { ...concept, learning_objective: `Build confidence with ${concept.name}.` }, content: contentForConcept(conceptId), prerequisites: demoPrerequisites.filter((item) => item.concept_id === conceptId) })
  }
  try {
    const supabase = getSupabaseServerClient()
    const [{ data: concept, error: conceptError }, { data: content, error: contentError }, { data: prerequisites, error: prerequisiteError }] = await Promise.all([
      supabase.from('concepts').select('id,name,slug,description,subject,difficulty,estimated_minutes,is_active,learning_objective,misconceptions,topic_id,subject_id').eq('id', conceptId).eq('is_active', true).single(),
      supabase.from('learning_content').select('id,concept_id,content_type,title,description,body,difficulty,estimated_minutes,order_index,version,is_active').eq('concept_id', conceptId).eq('is_active', true).order('order_index'),
      supabase.from('concept_prerequisites').select('id,concept_id,prerequisite_concept_id,required_mastery,priority').eq('concept_id', conceptId).order('priority'),
    ])
    if (conceptError) throw conceptError
    if (contentError) throw contentError
    if (prerequisiteError) throw prerequisiteError
    return NextResponse.json({ success: true, concept, content: content ?? [], prerequisites: prerequisites ?? [] })
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load learning content' }, { status: 404 }) }
}
