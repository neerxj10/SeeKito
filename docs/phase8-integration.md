# Phase 8 integration guide

## Runtime flow

`Student → learner state + evidence → Phase 4 DecisionResult → Phase 5 Recommendation → Learn/Practice UI`.

Content is selected by concept and subject. The Phase 6 session chooses five questions, records each answer, records hint usage separately, updates the state, and presents a completion summary. The dashboard and Progress page read the same state rather than maintaining a second progress model.

## Important routes

- `/student` — dashboard and next best action
- `/student/learn` — subject/concept path
- `/student/learn/[conceptId]` — lesson, worked example, quick check, and evidence context
- `/student/practice/[conceptId]` — adaptive five-question session
- `/student/progress` — computed learner analytics
- `/student/concepts` — prerequisite graph
- `/student/history` — captured attempts
- `/teacher` and `/teacher/analytics` — teacher demo and computed class analytics

## APIs

`/api/concepts`, `/api/subjects`, `/api/topics/[topicId]`, `/api/content/[conceptId]`, `/api/practice/start`, `/api/practice/submit`, `/api/attempts`, `/api/learner-state`, `/api/decision`, `/api/recommendations`, `/api/analytics`, and `/api/teacher/analytics` are the integration surface. Demo routes read `lib/demo/store.ts`; live routes must authenticate and scope queries to the current user/teacher.

## Supabase deployment

Apply migrations in order, including `017_phase6_practice_sessions.sql` and `018_phase7_content_intelligence.sql`. Seed concepts, prerequisites, content, question banks, and policies before switching off `SEEKITO_DEMO_MODE`. Never expose the service-role key to a browser. Live auth must use Supabase cookies and RLS policies must remain the final data boundary.

## UI contract

Every data-driven screen needs loading, empty, and actionable error states. A successful answer should visibly update score/evidence and the next action. A failed API call must never render `[object Object]` or a blank panel.
