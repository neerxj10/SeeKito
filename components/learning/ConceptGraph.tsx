'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ReactFlow, Background, Controls, Handle, Position, type Edge, type Node, type NodeProps } from '@xyflow/react'
import type { ConceptDifficulty } from '@/types/database'

type Concept = { id: string; name: string; slug: string; description: string | null; subject: string; difficulty: ConceptDifficulty; estimated_minutes: number; is_active: boolean }
type Prerequisite = { id: string; concept_id: string; prerequisite_concept_id: string; required_mastery: number; priority: number }
type LearnerState = { concept_id: string; mastery_score: number; confidence_score: number; attempt_count: number; failure_count: number; last_attempt_at: string | null }

type Props = { concepts: Concept[]; prerequisites: Prerequisite[]; states?: LearnerState[] }
type NodeData = { concept: Concept; status: string; onSelect: (id: string) => void }

function statusFor(state: LearnerState | undefined, blocked = false) {
  if (blocked) return 'BLOCKED'
  if (!state) return 'AVAILABLE'
  if (Number(state.mastery_score) >= 80) return 'MASTERED'
  if (Number(state.failure_count) >= 2) return 'NEEDS ATTENTION'
  return 'LEARNING'
}

function ConceptNode({ data }: NodeProps<Node<NodeData>>) {
  return <div className="concept-node" data-difficulty={data.concept.difficulty} data-status={data.status}>
    <Handle type="target" position={Position.Left} />
    <button onClick={() => data.onSelect(data.concept.id)}>
      <strong>{data.concept.name}</strong>
      <div className="node-meta"><span>{data.concept.difficulty}</span><span className="node-status">{data.status}</span></div>
    </button>
    <Handle type="source" position={Position.Right} />
  </div>
}

const nodeTypes = { concept: ConceptNode }

export function ConceptGraph({ concepts, prerequisites, states = [] }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [decision, setDecision] = useState<{ decision: string; reasons: string[] } | null>(null)
  const stateByConcept = useMemo(() => new Map(states.map((state) => [state.concept_id, state])), [states])
  useEffect(() => { if (!selectedId) return; setDecision(null); fetch('/api/decision', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targetConceptId: selectedId }) }).then((response) => response.json()).then((body) => { if (body.success) setDecision(body.result) }).catch(() => undefined) }, [selectedId])
  const { nodes, edges } = useMemo(() => {
    const incoming = new Map(concepts.map((concept) => [concept.id, prerequisites.filter((edge) => edge.concept_id === concept.id).map((edge) => edge.prerequisite_concept_id)]))
    const depth = new Map<string, number>()
    const getDepth = (id: string, trail = new Set<string>()): number => {
      if (depth.has(id)) return depth.get(id) as number
      if (trail.has(id)) return 0
      const nextTrail = new Set(trail).add(id)
      const value = Math.max(0, ...(incoming.get(id) ?? []).map((parent) => getDepth(parent, nextTrail) + 1))
      depth.set(id, value)
      return value
    }
    concepts.forEach((concept) => getDepth(concept.id))
    const columns = new Map<number, number>()
    const graphNodes: Node<NodeData>[] = concepts.map((concept) => {
      const column = depth.get(concept.id) ?? 0
      const row = columns.get(column) ?? 0
      columns.set(column, row + 1)
      const blocked = (incoming.get(concept.id) ?? []).some((parent) => { const relationship = prerequisites.find((edge) => edge.concept_id === concept.id && edge.prerequisite_concept_id === parent); return Number(stateByConcept.get(parent)?.mastery_score ?? 0) < Number(relationship?.required_mastery ?? 0.5) * 100 })
      return { id: concept.id, type: 'concept', position: { x: column * 260 + 40, y: row * 150 + 40 }, data: { concept, status: statusFor(stateByConcept.get(concept.id), blocked), onSelect: setSelectedId } }
    })
    const graphEdges: Edge[] = prerequisites.map((relationship) => ({ id: relationship.id, source: relationship.prerequisite_concept_id, target: relationship.concept_id, label: 'prerequisite', animated: false, style: { stroke: '#94a3b8' } }))
    return { nodes: graphNodes, edges: graphEdges }
  }, [concepts, prerequisites, stateByConcept])

  const selected = concepts.find((concept) => concept.id === selectedId)
  const selectedPrerequisites = prerequisites.filter((edge) => edge.concept_id === selectedId).map((edge) => concepts.find((concept) => concept.id === edge.prerequisite_concept_id)).filter(Boolean) as Concept[]
  const selectedDependents = prerequisites.filter((edge) => edge.prerequisite_concept_id === selectedId).map((edge) => concepts.find((concept) => concept.id === edge.concept_id)).filter(Boolean) as Concept[]
  const selectedState = selectedId ? stateByConcept.get(selectedId) : undefined
  const selectedBlockedPrerequisites = selectedId ? prerequisites.filter((edge) => edge.concept_id === selectedId && Number(stateByConcept.get(edge.prerequisite_concept_id)?.mastery_score ?? 0) < Number(edge.required_mastery) * 100).map((edge) => concepts.find((concept) => concept.id === edge.prerequisite_concept_id)).filter(Boolean) as Concept[] : []

  return <div className="graph-canvas" style={{ position: 'relative' }}>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.35} maxZoom={1.3}>
      <Background color="#eef1f5" gap={24} />
      <Controls />
    </ReactFlow>
    {selected && <aside className="concept-insight-stack">
      <section className="concept-focus-card"><button className="close-button" onClick={() => setSelectedId(null)} aria-label="Close concept details">×</button><span className="concept-focus-label">{statusFor(selectedState, selectedBlockedPrerequisites.length > 0)}</span><h2>{selected.name}{selectedState ? ` · ${Math.round(Number(selectedState.mastery_score))}%` : ''}</h2><p>{selectedBlockedPrerequisites.length ? `Complete ${selectedBlockedPrerequisites[0].name} first to unlock this concept.` : selected.description ?? 'Build evidence for this concept to unlock the next step.'}</p><div className="concept-focus-track"><span style={{ width: `${Math.min(100, Number(selectedState?.mastery_score ?? 0))}%` }} /></div><Link className="concept-focus-action" href={selectedBlockedPrerequisites[0] ? `/student/learn/${selectedBlockedPrerequisites[0].id}` : `/student/learn/${selected.id}`}>{selectedBlockedPrerequisites.length ? `Practice ${selectedBlockedPrerequisites[0].name}` : 'Practice this concept'}</Link></section>
      <section className="concept-stats-card"><div><span>Accuracy</span><strong>{selectedState?.attempt_count ? `${Math.round(((selectedState.attempt_count - selectedState.failure_count) / selectedState.attempt_count) * 100)}%` : '—'}</strong></div><div><span>Attempts</span><strong>{selectedState?.attempt_count ?? '—'}</strong></div><div><span>Hint dependence</span><strong>{selectedState?.confidence_score ? `${Math.max(0, 100 - Math.round(Number(selectedState.confidence_score)))}%` : '—'}</strong></div><div><span>Prerequisite for</span><strong>{selectedDependents[0]?.name ?? '—'}</strong></div></section>
      <section className="concept-detail-more"><p className="eyebrow">Concept details</p><div className="detail-status"><span>{statusFor(selectedState, selectedBlockedPrerequisites.length > 0)}</span>{selectedState && <strong>{Math.round(Number(selectedState.mastery_score))}% mastery</strong>}</div><dl><div><dt>Difficulty</dt><dd>{selected.difficulty}</dd></div><div><dt>Time</dt><dd>{selected.estimated_minutes} min</dd></div><div><dt>Confidence</dt><dd>{selectedState ? `${Math.round(Number(selectedState.confidence_score))}%` : '—'}</dd></div></dl><h3>Prerequisites</h3><ul>{selectedPrerequisites.length ? selectedPrerequisites.map((concept) => <li key={concept.id}>{concept.name}</li>) : <li>None — root concept</li>}</ul>{decision && <div className="detail-decision"><span>Current decision</span><strong>{decision.decision}</strong><small>{decision.reasons[0]}</small></div>}<div className="detail-actions"><Link className="secondary-button" href={selectedBlockedPrerequisites[0] ? `/student/learn/${selectedBlockedPrerequisites[0].id}` : `/student/decision/${selected.id}`}>{selectedBlockedPrerequisites.length ? 'Open prerequisite' : 'View decision'}</Link></div></section>
    </aside>}
  </div>
}
