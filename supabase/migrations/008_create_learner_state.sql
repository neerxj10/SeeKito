create table public.learner_state (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  concept_id uuid not null references public.concepts(id) on delete restrict,
  mastery_score numeric(5,4) not null default 0 check (mastery_score between 0 and 1),
  confidence_score numeric(5,4) not null default 0 check (confidence_score between 0 and 1),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  independent_success_count integer not null default 0 check (independent_success_count >= 0),
  hinted_success_count integer not null default 0 check (hinted_success_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  recent_streak integer not null default 0 check (recent_streak >= 0),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_review_at timestamptz,
  state_version integer not null default 1 check (state_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, concept_id)
);

create trigger learner_state_set_updated_at
before update on public.learner_state
for each row execute function public.set_updated_at();

