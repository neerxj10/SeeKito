create table public.decision_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  concept_id uuid not null references public.concepts(id) on delete restrict,
  decision text not null check (decision in ('ADVANCE', 'PRACTICE', 'REMEDIATE', 'REVIEW', 'BLOCKED')),
  mastery numeric(5,2) not null check (mastery between 0 and 100),
  confidence numeric(5,2) not null check (confidence between 0 and 100),
  blocking_prerequisites jsonb not null default '[]'::jsonb,
  reasons text[] not null default '{}',
  trace jsonb not null default '{}'::jsonb,
  engine_version text not null,
  created_at timestamptz not null default now()
);

create index decision_events_student_idx on public.decision_events(student_id, created_at desc);
create index decision_events_concept_idx on public.decision_events(concept_id, created_at desc);

alter table public.decision_events enable row level security;

create policy decision_events_select_own on public.decision_events
for select to authenticated
using (public.student_belongs_to_current_user(student_id));

create trigger decision_events_immutable_update
before update or delete on public.decision_events
for each row execute function public.reject_historical_mutation();

-- Decision history is written by trusted server-side code only.

