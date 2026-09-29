# Seekito content system

Phase 7 adds a reusable content layer on top of the existing evidence, decision, recommendation, and adaptive-practice loop.

## Learning hierarchy

`Subject → Topic → Concept → Prerequisite → Learning content → Question → Evidence → Learner state → Decision → Recommendation`

Subjects are broad domains such as Mathematics and Science. Topics group related concepts. Concepts remain the unit used by Phase 4 decisions and Phase 5 recommendations. Prerequisites continue to use `concept_prerequisites`; Phase 7 adds the subject/topic ownership metadata without changing the graph rules.

## Content

`learning_content` stores versioned, active learning material. Supported content types are `LESSON`, `EXPLANATION`, `WORKED_EXAMPLE`, `SUMMARY`, `PRACTICE`, `REVIEW`, and `REMEDIATION`. The structured `body` JSON keeps content out of React components and leaves room for richer authoring later. Historical attempts continue to point at questions and are not changed when content versions change.

The demo catalog contains five concepts per subject and five content items per concept: a lesson, explanation, worked example, summary, and remediation/common-mistakes item. The demo also contains five questions per concept. Demo data is explicitly in-memory development data and is not presented as real learner activity.

## APIs

- `GET /api/subjects` returns subject and demo catalog metadata.
- `GET /api/topics/[topicId]` returns a topic and its active concepts.
- `GET /api/content/[conceptId]` returns a concept, structured content, and prerequisite edges. Correct answers are not included.
- `GET /api/concepts/[id]` remains the graph detail endpoint.
- `GET /api/questions?conceptId=...` returns public question data without answer keys.

## Student flow

The concept learn page loads the objective, lesson, worked example, summary, and common mistakes. A two-question Quick Check uses the existing `/api/attempts` pipeline, so correctness, hints, response time, evidence events, learner state, and the Phase 4/5 next action stay connected. The page then links to the Phase 6 adaptive practice route.

The demo catalog supports both Mathematics and Science, including Newton's Laws, Work & Energy, and Momentum. Subject/topic filtering can be added to the catalog UI without changing the engine contracts because subject identity is metadata on content and concepts.

## Engine integration

Phase 4 remains the sole decision authority. Phase 5 consumes its `DecisionResult` and chooses an action/content direction. Phase 6 records attempts through one trusted service and updates evidence and learner state. Phase 7 only supplies structured content and metadata to those layers; it does not add an LLM or duplicate decision logic.

## Security

Subjects, topics, and active learning content have authenticated read policies. Questions remain served through trusted server routes so `correct_answer` is not exposed to clients. Student evidence, learner state, and recommendations retain their existing student-scoped policies. Apply migration `018_phase7_content_intelligence.sql` to a real Supabase project before using the non-demo path.

## Seed and limitations

`supabase/seed.sql` remains the legacy deterministic Algebra seed and is safe to rerun. The in-memory demo catalog is the complete Phase 7 demo dataset today. The next production step is to mirror the demo subjects, topics, content, and Science questions into an idempotent Supabase seed after the migration is applied, then run the authenticated end-to-end flow against that project.
