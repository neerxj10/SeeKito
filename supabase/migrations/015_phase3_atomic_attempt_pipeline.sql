drop policy if exists attempts_insert_own on public.attempts;

create or replace function public.record_attempt_pipeline(
  p_student_id uuid,
  p_question_id uuid,
  p_concept_id uuid,
  p_submitted_answer jsonb,
  p_is_correct boolean,
  p_difficulty text,
  p_used_hint boolean,
  p_hint_count integer,
  p_response_time_ms integer,
  p_started_at timestamptz,
  p_submitted_at timestamptz,
  p_evidence_events jsonb,
  p_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt_id uuid := gen_random_uuid();
  v_retry_number integer;
  v_state public.learner_state%rowtype;
begin
  select count(*)::integer into v_retry_number
  from public.attempts
  where student_id = p_student_id and question_id = p_question_id;

  insert into public.attempts (
    id, student_id, question_id, concept_id, submitted_answer, correctness,
    response_time_ms, hint_count, retry_number, attempt_context, is_correct,
    difficulty, used_hint, started_at, submitted_at
  ) values (
    v_attempt_id, p_student_id, p_question_id, p_concept_id, p_submitted_answer,
    case when p_is_correct then 1 else 0 end, p_response_time_ms, p_hint_count,
    v_retry_number, 'practice', p_is_correct, p_difficulty, p_used_hint,
    p_started_at, p_submitted_at
  );

  insert into public.evidence_events (
    attempt_id, student_id, concept_id, evidence_type, value, weight, metadata
  )
  select v_attempt_id, p_student_id, p_concept_id,
    event_type, coalesce(event_value, 0), 1, coalesce(metadata, '{}'::jsonb)
  from jsonb_to_recordset(coalesce(p_evidence_events, '[]'::jsonb)) as events(
    event_type text, event_value numeric, metadata jsonb
  );

  insert into public.learner_state (
    student_id, concept_id, mastery_score, confidence_score, evidence_count,
    independent_success_count, hinted_success_count, failure_count,
    recent_streak, last_attempt_at, last_success_at, state_version,
    attempt_count, correct_count, incorrect_count, repeated_failure_count,
    hint_usage_count
  ) values (
    p_student_id, p_concept_id,
    (p_state->>'mastery_score')::numeric,
    (p_state->>'confidence_score')::numeric,
    (p_state->>'evidence_count')::integer,
    (p_state->>'independent_success_count')::integer,
    (p_state->>'hinted_success_count')::integer,
    (p_state->>'failure_count')::integer,
    (p_state->>'recent_streak')::integer,
    nullif(p_state->>'last_attempt_at', '')::timestamptz,
    nullif(p_state->>'last_success_at', '')::timestamptz,
    1,
    (p_state->>'attempt_count')::integer,
    (p_state->>'correct_count')::integer,
    (p_state->>'incorrect_count')::integer,
    (p_state->>'repeated_failure_count')::integer,
    (p_state->>'hint_usage_count')::integer
  )
  on conflict (student_id, concept_id) do update set
    mastery_score = excluded.mastery_score,
    confidence_score = excluded.confidence_score,
    evidence_count = excluded.evidence_count,
    independent_success_count = excluded.independent_success_count,
    hinted_success_count = excluded.hinted_success_count,
    failure_count = excluded.failure_count,
    recent_streak = excluded.recent_streak,
    last_attempt_at = excluded.last_attempt_at,
    last_success_at = excluded.last_success_at,
    attempt_count = excluded.attempt_count,
    correct_count = excluded.correct_count,
    incorrect_count = excluded.incorrect_count,
    repeated_failure_count = excluded.repeated_failure_count,
    hint_usage_count = excluded.hint_usage_count,
    state_version = public.learner_state.state_version + 1,
    updated_at = now();

  select * into v_state
  from public.learner_state
  where student_id = p_student_id and concept_id = p_concept_id;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'state', to_jsonb(v_state)
  );
end;
$$;

revoke execute on function public.record_attempt_pipeline(uuid, uuid, uuid, jsonb, boolean, text, boolean, integer, integer, timestamptz, timestamptz, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.record_attempt_pipeline(uuid, uuid, uuid, jsonb, boolean, text, boolean, integer, integer, timestamptz, timestamptz, jsonb, jsonb) to service_role;

