# SeeKito

SeeKito is an evidence-driven adaptive learning prototype. It helps each learner work on the right concept at the right time by combining concept dependencies, attempt evidence, learner mastery, and an explainable decision engine.

> **Prototype status:** The repository supports a complete local jury demonstration in demo mode, plus a Supabase-backed production path.

## What problem does it solve?

Fixed learning sequences treat every student the same. SeeKito instead keeps a per-student, per-concept state and updates it after every response. It records correctness, hint usage, response time, retries, question difficulty, and review timing so recommendations are based on learning evidence rather than completion percentage alone.

## Core capabilities

- **Onboarding:** captures learner name, grade, subject, selected concepts, goal, confidence, available practice time, and preferred support style.
- **10-question diagnostic:** creates starting evidence without assuming that every learner starts at zero.
- **Concept graph:** includes 10 concepts with prerequisite relationships across Algebra and Science.
- **Learner state:** maintains mastery, confidence, attempt count, correct count, failure count, and evidence count per concept.
- **Decision engine:** selects `Advance`, `Practice`, `Review`, `Remediate`, or `Blocked` based on mastery, confidence, recent evidence, review gaps, and prerequisites.
- **Explainability:** displays the evidence and prerequisite reason behind each next action.
- **Integrity controls:** hints, rapid retries, repeated failures, and response times affect evidence strength; repeated guessing does not inflate mastery like independent success.
- **Spaced review:** strong concepts return after review intervals and can be flagged when evidence suggests uncertainty or forgetting.
- **Teacher dashboard:** shows learner roster, mastery, uncertainty, recommendations, recent attempts, hints, retries, response time, decision history, and logged teacher overrides.
- **SeeKito AI:** generates concept explanations, worked examples, memory ideas, common-mistake guidance, and student-selected timed quizzes with 10, 15, or 20 questions.
- **Replay/comparison:** provides learner profiles and history differences so the same latest score can lead to different next actions.

## Adaptive decision model

The prototype uses explainable weighted heuristics rather than an opaque model:

1. Check whether prerequisite concepts meet the required mastery threshold.
2. Check for remediation signals: low mastery, repeated failures, or more recent errors than successes.
3. Check whether a strong concept is stale, uncertain, or due for spaced review.
4. Advance only when mastery and confidence are both strong.
5. Otherwise select targeted practice and collect more evidence.

Decision priority:

```text
Prerequisite block → Remediate → Review → Advance → Practice
```

The implementation is in `lib/decision-engine/`, with demo-state behavior in `lib/demo/store.ts`.

## Evidence captured

| Signal | Why it matters |
| --- | --- |
| Correctness | Measures demonstrated performance |
| Hint count | Separates independent success from supported success |
| Response time | Helps identify fluency and uncertainty |
| Retry number | Prevents rapid repeated guesses from looking independent |
| Difficulty | Keeps content difficulty separate from learner mastery |
| Attempt context | Distinguishes diagnostic and practice evidence |

These signals appear in the teacher workspace under **Recent learner attempts** and in the decision trace.

## Demo workflow

1. Open `/student/onboarding`.
2. Enter a new learner name and profile details.
3. Select a subject and concept.
4. Click **Start quick check** and complete the 10-question diagnostic.
5. Use a hint on one question, answer one incorrectly, and answer others independently to demonstrate different evidence signals.
6. Open the student dashboard to show mastery and the next best action.
7. Open `/teacher` to show the learner name and recent attempts with correctness, hints, retries, and response time.
8. Open **Decision History** to show the evidence-to-recommendation trace.
9. Open `/student/ai` to explain a concept or generate a timed quiz.
10. Use the teacher **Intervention Desk** to override a recommendation and show the audit history.

Starting onboarding with a new learner resets the local demo learner state. The sidebar **Reset demo** action restores seeded comparison data for the jury walkthrough.

## Data storage

When `SEEKITO_DEMO_MODE=true`, demo attempts, learner state, practice sessions, and overrides are stored in memory in `lib/demo/store.ts`. This is ideal for a local presentation and resets when the demo is reset or the server restarts.

The Supabase-backed path persists the corresponding records in:

- `attempts`
- `evidence_events`
- `learner_state`
- `decision_events`
- `teacher_overrides`
- `practice_sessions`

The server-side attempt pipeline keeps attempt history and derived learner state consistent. Correct answers remain server-only in the database path.

## SeeKito AI configuration

Add the key to `.env.local` on the server side:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

AI is used for educational content generation and explanations. It does not replace the deterministic mastery state or decision engine. Without a key, bounded demo content keeps the prototype demonstrable.

## Local setup

```sh
npm install
npm run dev
```

Useful routes:

- `/student/onboarding` — learner setup and diagnostic entry
- `/student` — learner dashboard
- `/student/concepts` — prerequisite concept map
- `/student/ai` — SeeKito AI explanations and quiz generation
- `/student/history` — attempt evidence history
- `/teacher` — teacher overview and recent learner attempts
- `/teacher/insights` — explainable decision trace
- `/teacher/overrides` — auditable recommendation override
- `/teacher/simulation` — learner comparison/replay

## Validation

```sh
npm run lint
npm test
npm run build
```

The prototype has passing TypeScript validation, database invariant checks, automated tests, and a production build.

## Project structure

```text
app/                         Next.js pages and route handlers
components/                  Shared learner, teacher, and AI UI
lib/decision-engine/         Explainable recommendation rules
lib/evidence/                Attempt classification and evidence logic
lib/learner-state/           Mastery and confidence updates
lib/demo/store.ts            Local jury-demo state and seed data
lib/ai/                      SeeKito AI prompts and safe fallbacks
supabase/                    Migrations, schema, seed, and policies
tests/                       Database invariants and unit tests
```
