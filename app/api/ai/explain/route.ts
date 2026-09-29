import { NextResponse } from 'next/server'
import { explainConcept, conceptContext } from '@/lib/ai/seekito-ai'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { conceptId?: string; mastery?: number; confidence?: number; learnerLevel?: string; helpStyle?: string }
    if (!body.conceptId) return NextResponse.json({ success: false, error: 'conceptId is required' }, { status: 400 })
    const concept = conceptContext(body.conceptId)
    if (!concept) return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 })
    const explanation = await explainConcept({ ...body, conceptId: concept.id, conceptName: concept.name, description: concept.description })
    return NextResponse.json({ success: true, explanation })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to explain concept' }, { status: 502 })
  }
}
