create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  question_id uuid not null,
  concept_id uuid not null,
  submitted_answer jsonb not null,
  correctness numeric(4,3) not null check (correctness between 0 and 1),
  response_time_ms integer check (response_time_ms is null or response_time_ms >= 0),
  hint_count integer not null default 0 check (hint_count >= 0),
  retry_number integer not null default 0 check (retry_number >= 0),
  attempt_context text not null check (attempt_context in ('diagnostic', 'practice', 'review', 'remediation')),
  created_at timestamptz not null default now(),
  unique (id, student_id, concept_id),
  foreign key (question_id, concept_id) references public.questions(id, concept_id) on delete restrict
);

