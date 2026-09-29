create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  concept_id uuid not null references public.concepts(id) on delete restrict,
  action text not null check (action in ('diagnostic', 'teach_prerequisite', 'practice', 'remediation', 'review', 'advance', 'teacher_intervention')),
  reason_codes text[] not null default '{}',
  evidence_ids uuid[] not null default '{}',
  state_snapshot jsonb not null default '{}'::jsonb,
  engine_version text not null,
  created_at timestamptz not null default now()
);

