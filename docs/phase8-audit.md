# Phase 8 integration audit

## Status

The demo path is wired across the existing Phase 4 decision engine, Phase 5 recommendation engine, Phase 6 practice loop, and Phase 7 content system. The audit intentionally preserves those engines and adds integration at the route/UI boundary.

## Implemented

- Student dashboard, Learn, content-first concept pages, practice sessions, attempts, evidence, learner state, decisions, recommendations, concept map, and history routes are connected.
- Math and Science demo catalogs contain five concepts per subject and five questions per concept.
- `/api/analytics` computes overall mastery, subject mastery, concept mastery, accuracy, attempts, and recent evidence from the same learner state and attempt data used by the dashboard.
- Student Progress now renders those computed analytics instead of a separate learner-state-only view.
- Teacher Analytics now renders computed demo analytics for concept mastery, difficulty accuracy, average mastery, and activity.
- Student navigation includes Dashboard, Learn, Practice, Progress, Concept Map, History, and Profile. `/student/dashboard` is a compatibility alias to the existing dashboard route.
- Loading, empty, and error states are retained on data-driven pages.
- Onboarding now routes new learners through a diagnostic assessment and records attempts with diagnostic context.
- Learner state schedules `next_review_at` from mastery and the decision engine can surface stale successful concepts for review.
- Rapid correct retries receive dampened mastery gains; repeated failures remain explicit evidence.
- Teacher overrides are submitted through `/api/teacher/overrides` and persist to `teacher_overrides` in live mode; demo mode keeps an in-memory audit record.
- Teacher Replay Lab compares two learner evidence profiles and shows divergent estimated mastery/actions.

## Partial / environment-dependent

- Demo mode is fully self-contained and is the recommended jury path. Live Supabase mode requires valid public/service environment variables, applied migrations, seeded content, and real auth cookies.
- Auth pages currently provide the prototype entry flow; production OAuth/password verification still belongs to the Supabase deployment configuration.
- The demo teacher analytics endpoint is intentionally demo-gated. A production teacher endpoint should be enabled only after teacher membership/RLS policies are configured.
- Profile identity and some teacher summary values remain demo-friendly fallbacks when demo mode is enabled.

## Verification target

The adaptive loop is: select concept → load content → start practice → answer questions → write attempts/evidence → update learner state → recompute decision → generate recommendation → show next action. The final validation commands in the project README/checklist must pass before calling a release production-ready.
