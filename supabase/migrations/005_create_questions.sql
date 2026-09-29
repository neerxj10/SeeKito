create table public.questions (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts(id) on delete restrict,
  question_text text not null,
  question_type text not null check (question_type in ('diagnostic', 'practice', 'review', 'remediation')),
  difficulty numeric(4,3) not null check (difficulty between 0 and 1),
  correct_answer jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  is_diagnostic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, concept_id)
);

create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

