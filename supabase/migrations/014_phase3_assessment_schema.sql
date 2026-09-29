alter table public.questions
  add column options jsonb not null default '[]'::jsonb,
  add column explanation text not null default '',
  add column hint text not null default '',
  add column is_active boolean not null default true;

alter table public.questions drop constraint if exists questions_question_type_check;
alter table public.questions drop constraint if exists questions_difficulty_check;

alter table public.questions
  alter column question_type type text using 'MCQ',
  alter column difficulty type text using (
    case
      when difficulty < 0.34 then 'EASY'
      when difficulty < 0.67 then 'MEDIUM'
      else 'HARD'
    end
  );

alter table public.questions
  add constraint questions_question_type_check check (question_type in ('MCQ', 'SHORT_ANSWER')),
  add constraint questions_difficulty_check check (difficulty in ('EASY', 'MEDIUM', 'HARD'));

create index questions_concept_active_idx on public.questions(concept_id, is_active);

alter table public.attempts
  add column is_correct boolean,
  add column difficulty text,
  add column used_hint boolean not null default false,
  add column started_at timestamptz,
  add column submitted_at timestamptz;

update public.attempts a
set
  is_correct = a.correctness >= 0.5,
  difficulty = q.difficulty,
  used_hint = a.hint_count > 0,
  started_at = a.created_at,
  submitted_at = a.created_at
from public.questions q
where q.id = a.question_id;

alter table public.attempts
  alter column is_correct set not null,
  alter column difficulty set not null,
  alter column submitted_at set not null,
  add constraint attempts_difficulty_check check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
  add constraint attempts_submitted_after_started_check check (started_at is null or submitted_at >= started_at);

create index attempts_student_concept_idx on public.attempts(student_id, concept_id);

alter table public.evidence_events drop constraint if exists evidence_events_evidence_type_check;

update public.evidence_events
set evidence_type = case evidence_type
  when 'independent_correct' then 'CORRECT_INDEPENDENT'
  when 'correct_after_hint' then 'CORRECT_WITH_HINT'
  when 'incorrect' then 'INCORRECT'
  when 'repeated_misconception' then 'REPEATED_FAILURE'
  when 'delayed_response' then 'SLOW_SUCCESS'
  when 'review_retention' then 'CORRECT_INDEPENDENT'
  else upper(evidence_type)
end;

alter table public.evidence_events
  add constraint evidence_events_evidence_type_check check (evidence_type in (
    'CORRECT_INDEPENDENT', 'CORRECT_WITH_HINT', 'INCORRECT',
    'REPEATED_FAILURE', 'FAST_SUCCESS', 'SLOW_SUCCESS'
  ));

create index evidence_events_student_concept_idx on public.evidence_events(student_id, concept_id);

alter table public.learner_state
  drop constraint if exists learner_state_mastery_score_check,
  drop constraint if exists learner_state_confidence_score_check;

alter table public.learner_state
  alter column mastery_score type numeric(5,2) using mastery_score * 100,
  alter column confidence_score type numeric(5,2) using confidence_score * 100;

alter table public.learner_state
  add column attempt_count integer not null default 0,
  add column correct_count integer not null default 0,
  add column incorrect_count integer not null default 0,
  add column repeated_failure_count integer not null default 0,
  add column hint_usage_count integer not null default 0;

update public.learner_state s
set
  attempt_count = counts.attempt_count,
  correct_count = counts.correct_count,
  incorrect_count = counts.incorrect_count,
  hint_usage_count = counts.hint_usage_count
from (
  select student_id, concept_id,
    count(*)::integer as attempt_count,
    count(*) filter (where is_correct)::integer as correct_count,
    count(*) filter (where not is_correct)::integer as incorrect_count,
    coalesce(sum(hint_count), 0)::integer as hint_usage_count
  from public.attempts
  group by student_id, concept_id
) counts
where counts.student_id = s.student_id and counts.concept_id = s.concept_id;

alter table public.learner_state
  add constraint learner_state_mastery_score_check check (mastery_score between 0 and 100),
  add constraint learner_state_confidence_score_check check (confidence_score between 0 and 100),
  add constraint learner_state_counts_nonnegative_check check (
    attempt_count >= 0 and correct_count >= 0 and incorrect_count >= 0 and
    repeated_failure_count >= 0 and hint_usage_count >= 0
  );

