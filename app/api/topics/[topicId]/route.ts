import { NextResponse } from 'next/server'
import { demoConcepts, isDemoMode } from '@/lib/demo/store'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { demoTopics } from '@/lib/content/demo-content'

export async function GET(_request: Request, { params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params
  if (isDemoMode()) {
    const topic = demoTopics.find((item) => item.id === topicId)
    const concepts = topic ? demoConcepts.filter((item) => item.subject === topic.subject && (topic.subject === 'SCIENCE' ? ['Scientific Basics', 'Force & Motion', "Newton's Laws", 'Work & Energy', 'Momentum'].includes(item.name) : true)) : []
    return NextResponse.json({ success: true, topic: topic ?? { id: topicId, name: 'Learning topic', description: 'A focused learning path.' }, concepts })
  }
  try {
    const supabase = getSupabaseServerClient()
    const [{ data: topic, error: topicError }, { data: concepts, error: conceptsError }] = await Promise.all([
      supabase.from('topics').select('id,subject_id,name,slug,description').eq('id', topicId).single(),
      supabase.from('concepts').select('id,name,slug,description,subject,difficulty,estimated_minutes,is_active').eq('topic_id', topicId).eq('is_active', true).order('name'),
    ])
    if (topicError) throw topicError
    if (conceptsError) throw conceptsError
    return NextResponse.json({ success: true, topic, concepts: concepts ?? [] })
  } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to load topic' }, { status: 404 }) }
}
