create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  concept_id uuid not null references public.concepts(id) on delete restrict,
  action_type text not null check (action_type in ('practice', 'remediation', 'review', 'advance', 'teach_prerequisite')),
  question_ids uuid[] not null check (cardinality(question_ids) > 0),
  completed_question_ids uuid[] not null default '{}',
  current_question integer not null default 0 check (current_question >= 0),
  score integer not null default 0 check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED', 'EXPIRED')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, student_id)
);

alter table public.practice_sessions enable row level security;

create policy practice_sessions_select_own on public.practice_sessions
  for select using (student_id in (select id from public.students where user_id = auth.uid()));
create policy practice_sessions_insert_own on public.practice_sessions
  for insert with check (student_id in (select id from public.students where user_id = auth.uid()));
create policy practice_sessions_update_own on public.practice_sessions
  for update using (student_id in (select id from public.students where user_id = auth.uid()))
  with check (student_id in (select id from public.students where user_id = auth.uid()));

create index practice_sessions_student_status_idx on public.practice_sessions(student_id, status, created_at desc);
