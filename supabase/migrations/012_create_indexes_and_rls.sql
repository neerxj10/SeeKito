create index students_user_id_idx on public.students(user_id);
create index teachers_user_id_idx on public.teachers(user_id);
create index questions_concept_id_idx on public.questions(concept_id);
create index attempts_student_id_idx on public.attempts(student_id);
create index attempts_question_id_idx on public.attempts(question_id);
create index attempts_concept_id_idx on public.attempts(concept_id);
create index attempts_created_at_idx on public.attempts(created_at);
create index evidence_events_attempt_id_idx on public.evidence_events(attempt_id);
create index evidence_events_student_id_idx on public.evidence_events(student_id);
create index evidence_events_concept_id_idx on public.evidence_events(concept_id);
create index learner_state_student_id_idx on public.learner_state(student_id);
create index learner_state_concept_id_idx on public.learner_state(concept_id);
create index learner_state_next_review_at_idx on public.learner_state(next_review_at);
create index recommendations_student_id_idx on public.recommendations(student_id);
create index recommendations_concept_id_idx on public.recommendations(concept_id);
create index recommendations_created_at_idx on public.recommendations(created_at);
create index teacher_overrides_student_id_idx on public.teacher_overrides(student_id);
create index teacher_overrides_concept_id_idx on public.teacher_overrides(concept_id);
create index audit_events_entity_idx on public.audit_events(entity_type, entity_id);

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid();
$$;

create or replace function public.student_belongs_to_current_user(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.users u on u.id = s.user_id
    where s.id = p_student_id and u.auth_user_id = auth.uid()
  );
$$;

create or replace function public.teacher_belongs_to_current_user(p_teacher_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teachers t
    join public.users u on u.id = t.user_id
    where t.id = p_teacher_id and u.auth_user_id = auth.uid()
  );
$$;

create or replace function public.reject_historical_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% records are immutable', tg_table_name using errcode = '23000';
end;
$$;

create trigger attempts_immutable_update
before update or delete on public.attempts
for each row execute function public.reject_historical_mutation();

create trigger evidence_events_immutable_update
before update or delete on public.evidence_events
for each row execute function public.reject_historical_mutation();

create trigger recommendations_immutable_update
before update or delete on public.recommendations
for each row execute function public.reject_historical_mutation();

create trigger audit_events_immutable_update
before update or delete on public.audit_events
for each row execute function public.reject_historical_mutation();

create or replace function public.validate_recommendation_evidence()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from unnest(new.evidence_ids) as evidence_id
    left join public.evidence_events e on e.id = evidence_id
    where e.id is null or e.student_id <> new.student_id or e.concept_id <> new.concept_id
  ) then
    raise exception 'Recommendation evidence must exist and match its student and concept' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger recommendations_validate_evidence
before insert on public.recommendations
for each row execute function public.validate_recommendation_evidence();

alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_prerequisites enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.evidence_events enable row level security;
alter table public.learner_state enable row level security;
alter table public.recommendations enable row level security;
alter table public.teacher_overrides enable row level security;
alter table public.audit_events enable row level security;

create policy users_select_own on public.users
for select to authenticated
using (auth_user_id = auth.uid());

create policy students_select_own on public.students
for select to authenticated
using (public.student_belongs_to_current_user(id));

create policy teachers_select_own on public.teachers
for select to authenticated
using (public.teacher_belongs_to_current_user(id));

create policy concepts_select_authenticated on public.concepts
for select to authenticated using (true);

create policy prerequisites_select_authenticated on public.concept_prerequisites
for select to authenticated using (true);

-- Questions contain correct_answer, so they are served by trusted server-side
-- code rather than exposed through a broad client-side SELECT policy.

create policy attempts_select_own on public.attempts
for select to authenticated
using (public.student_belongs_to_current_user(student_id));

create policy attempts_insert_own on public.attempts
for insert to authenticated
with check (public.student_belongs_to_current_user(student_id));

create policy evidence_select_own on public.evidence_events
for select to authenticated
using (public.student_belongs_to_current_user(student_id));

create policy learner_state_select_own on public.learner_state
for select to authenticated
using (public.student_belongs_to_current_user(student_id));

create policy recommendations_select_own on public.recommendations
for select to authenticated
using (public.student_belongs_to_current_user(student_id));

create policy teacher_overrides_select_own_teacher on public.teacher_overrides
for select to authenticated
using (public.teacher_belongs_to_current_user(teacher_id));

-- There is intentionally no authenticated policy for writes to evidence,
-- learner_state, recommendations, teacher_overrides, or audit_events.
-- Trusted server-side code using the Supabase service role performs those writes.
