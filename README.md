# Seekito database layer

Phase 1 contains only the Supabase PostgreSQL foundation. It does not include UI, the deterministic decision engine, or OpenAI integration.

Phase 2 adds the bounded Algebra concept graph, graph validation utilities, concept APIs, and the `/student/concepts` React Flow view. It does not implement mastery, evidence processing, recommendations, or AI content generation.

Phase 3 adds deterministic assessment submission, immutable attempts, evidence processing, persistent learner state, and the student practice/progress/history routes. It deliberately stops before recommendation or Decision Engine logic.

Phase 4 adds the pure deterministic Decision Engine, authenticated decision API, historical decision events, and `/student/decision/[conceptId]`. It evaluates a requested target concept only; it does not choose arbitrary next concepts or generate recommendations.

## Applying the database

Run the migrations with the Supabase CLI in filename order, then apply `supabase/seed.sql` only in a development project. The seed never creates `auth.users` records; it uses the first two existing Auth users when they exist.

The local environment currently has no Supabase CLI or PostgreSQL client, so SQL execution against a live database is not available in this workspace.

## Phase 2 graph setup

Apply migration `013_add_concept_graph_metadata.sql`, then run `supabase/seed.sql` in development. The seed creates 10 Algebra concepts and 11 directed prerequisite relationships. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the server-side concept APIs. The service-role key must remain server-only.

Available routes:

- `GET /api/concepts` returns the active Algebra graph.
- `GET /api/concepts/[id]` returns one concept with direct prerequisites and dependents.
- `/student/concepts` renders the graph and dynamically shows roots, leaves, and node details.
- `/student/learn` is the learner workspace: it combines the real concept graph, prerequisite status, learner state, and the current Decision Engine result into one next-action view.
- `/student/learn/[conceptId]` runs a five-question concept session. Questions are selected from active database content, answers are submitted through the atomic attempt pipeline, and the final screen requests a fresh Decision Engine result.

## End-to-end learner loop

The learner flow is intentionally server-authoritative:

1. Learn loads active concepts, prerequisite relationships, and the current learner state.
2. Locked concepts link to the first unmet prerequisite; available concepts link to their own session.
3. A session presents up to five active questions without exposing correct answers to the browser.
4. A submitted answer is evaluated on the server and recorded through `record_attempt_pipeline`, which writes the immutable attempt, evidence events, and derived learner state together.
5. After the final question, the UI requests the existing deterministic Decision Engine and links to its explainable decision history view.

The new UI does not create or infer backend records. If Supabase is not configured, the screens show the existing loading/error states and no fake learner statistics are rendered. For local development, configure the public URL, anon key, service-role key, and a real Supabase Auth student mapped to `public.users` and `public.students` before exercising the protected loop.

## Phase 3 state model

The prototype mastery update is incremental and bounded:

- Independent correct: `+20`
- Correct with hint: `+10`
- Incorrect: `-15`
- Repeated failure: additional `-10`

Mastery is clamped to `0–100`. Confidence is computed independently from attempt quantity, independent-success consistency, hinted-success penalty, and repeated-failure penalty, then clamped to `0–100`. These are deterministic prototype heuristics, not a validated psychometric model.

Attempt submission uses the server-only `record_attempt_pipeline` RPC so attempt, evidence, and learner-state persistence commit as one database operation. Students cannot directly insert attempts or mutate derived records through RLS.

## Security boundary

Students can read their own learner-facing records and submit attempts for themselves. Questions are intentionally not exposed through a broad client-side SELECT policy because the table contains `correct_answer`; trusted server-side code should return only the prompt/content needed by the student. Students cannot write evidence, learner state, recommendations, overrides, or audit events. Historical attempts, evidence, recommendations, and audit events are protected by both RLS and database triggers.

Phase 1 intentionally has no teacher-to-student assignment table. Consequently, teachers have no broad client-side read policy. Trusted server-side operations using the Supabase service role must perform derived-state writes and any teacher data access until an assignment model is added.

## Validation

Run:

```sh
npm run test:db
```

This performs dependency-free static checks for migration ordering, table coverage, key invariants, RLS coverage, historical immutability, recommendation evidence validation, and seed safety. Full constraint and RLS behavior tests require a configured Supabase test project.
