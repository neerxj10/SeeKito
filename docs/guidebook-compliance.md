# Guide-book compliance map

Seekito’s demo is designed around the judge stress tests and technical expectations in the guide.

## Stress tests

- Hard transfer failure: question difficulty is stored separately from learner mastery. Hard independent successes add less mastery than easy successes, and hard failures carry a larger penalty.
- Strong prerequisite conflict: prerequisite checks run before target actions and the explanation names the blocked prerequisite and its mastery.
- Repeated guessing: rapid retries are retained in attempt history but receive dampened mastery and no additional confidence increment. Hints are separate evidence.
- Long-gap failure: a previously strong concept with a stale success is routed to `REVIEW`, while a first-time weak concept is routed to `REMEDIATE`.
- Teacher override: overrides are persisted, written to the audit log, shown in history, and applied on the next decision without deleting prior evidence.
- Same score, different history: the decision uses confidence, scheduled review time, recent evidence, and prerequisite state—not only the latest mastery percentage. Teacher Replay Lab demonstrates divergent paths.

## Technical expectations

- Learner state, attempts, evidence, decisions, recommendations, and teacher overrides persist in Supabase tables in live mode; demo mode mirrors the same flow in an in-memory store.
- Decisions are deterministic from stored state, evidence, graph relationships, thresholds, and engine version. The decision trace is stored with decision history.
- Content difficulty is a question/content property; learner mastery is a per-student/per-concept state.
- Teacher overrides and configuration-sensitive decisions are auditable through `teacher_overrides` and `audit_events`.
- No LLM is required for the adaptive core. Content can be expanded independently; the real state and decision model remains deterministic.

## Deliberately out of scope

Seekito does not disguise a fixed sequence as adaptation, use completion-only progress, depend on a generic chatbot, rank students for high-stakes use, or use biometric/emotion surveillance. Every adaptive change is tied to recorded evidence and an explainable rule trace.

## Judge demo route

Use `/teacher/simulation` for the same-score/different-history comparison, `/teacher/overrides` for the override-and-audit scenario, and the student Practice flow for hints, retries, difficulty, evidence, and updated recommendations.
