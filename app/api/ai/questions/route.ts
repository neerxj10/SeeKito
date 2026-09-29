import { NextResponse } from 'next/server'
import { conceptContext, generateQuestions } from '@/lib/ai/seekito-ai'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { conceptId?: string; count?: number; difficulty?: string; mastery?: number; confidence?: number; learnerLevel?: string; timeMinutes?: number }
    if (!body.conceptId) return NextResponse.json({ success: false, error: 'conceptId is required' }, { status: 400 })
    const concept = conceptContext(body.conceptId)
    if (!concept) return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 })
    const result = await generateQuestions({ ...body, conceptId: concept.id, conceptName: concept.name, description: concept.description })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to generate questions' }, { status: 502 })
  }
}
