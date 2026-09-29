import { NextResponse } from 'next/server'
import { demoConcepts, isDemoMode } from '@/lib/demo/store'
import { demoLearningContent, demoTopics } from '@/lib/content/demo-content'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ success: true, subjects: [
      { id: '50000000-0000-4000-8000-000000000001', name: 'Mathematics', slug: 'mathematics', icon: '∑', description: 'Build fluency from number sense to algebra.' },
      { id: '50000000-0000-4000-8000-000000000002', name: 'Science', slug: 'science', icon: '⚗', description: 'Explain the world with evidence and models.' },
    ], topics: demoTopics, concepts: demoConcepts, contentCount: demoLearningContent.length })
  }
  try {
    const supabase = getSupabaseServerClient()
    const [{ data: subjects, error: subjectError }, { data: topics, error: topicError }] = await Promise.all([
      supabase.from('subjects').select('id,name,slug,description,icon').order('name'),
      supabase.from('topics').select('id,subject_id,name,slug,description').order('name'),
    ])
    if (subjectError) throw subjectError
    if (topicError) throw topicError
    return NextResponse.json({ success: true, subjects: subjects ?? [], topics: topics ?? [] })
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load subjects' }, { status: 503 }) }
}
