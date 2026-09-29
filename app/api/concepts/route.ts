import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { demoConcepts, demoPrerequisites, isDemoMode } from '@/lib/demo/store'

export async function GET() {
  try {
    if (isDemoMode()) return NextResponse.json({ success: true, concepts: demoConcepts, prerequisites: demoPrerequisites })
    const supabase = getSupabaseServerClient()
    const [{ data: concepts, error: conceptsError }, { data: prerequisites, error: prerequisitesError }] = await Promise.all([
      supabase.from('concepts').select('id,name,slug,description,subject,difficulty,estimated_minutes,is_active').eq('is_active', true).in('subject', ['ALGEBRA', 'SCIENCE']).order('name'),
      supabase.from('concept_prerequisites').select('id,concept_id,prerequisite_concept_id,required_mastery,priority').order('priority'),
    ])
    if (conceptsError) throw conceptsError
    if (prerequisitesError) throw prerequisitesError
    return NextResponse.json({ success: true, concepts, prerequisites })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load concept graph' }, { status: 503 })
  }
}
