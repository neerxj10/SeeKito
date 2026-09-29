create table public.evidence_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  student_id uuid not null,
  concept_id uuid not null,
  evidence_type text not null check (evidence_type in (
    'independent_correct', 'correct_after_hint', 'incorrect',
    'repeated_misconception', 'delayed_response',
    'successful_prerequisite_transfer', 'review_retention'
  )),
  value numeric(8,4) not null,
  weight numeric(8,4) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (attempt_id, student_id, concept_id)
    references public.attempts(id, student_id, concept_id) on delete restrict
);

