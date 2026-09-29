# Seekito demo checklist

## Start

1. Install dependencies with `npm install`.
2. Keep `.env.local` in demo mode: `SEEKITO_DEMO_MODE=true` and `NEXT_PUBLIC_SEEKITO_DEMO_MODE=true`.
3. Run `npm run dev` and open `http://localhost:3000/auth/login`.

## Student path

1. Enter the prototype through Login, complete onboarding, and choose Mathematics or Science.
2. Open Learn and select a concept.
3. Read the lesson, use the Quick Check, and continue to Practice.
4. Answer all five questions; try one hint and one incorrect answer so the evidence panel is meaningful.
5. Return to Dashboard, Progress, History, and Concept Map. Confirm mastery, accuracy, hint usage, and recent evidence changed.
6. Repeat with a Science concept to demonstrate multi-subject content.

## Teacher path

1. Open `/teacher`.
2. Review Students and Learner States.
3. Open a learner detail and inspect the recommendation explanation.
4. Open `/teacher/analytics` and confirm concept, difficulty, mastery, and activity charts are populated.
5. Use the override flow only as a clearly labelled demo action; it should record a reason.

## Release checks

Run `npm run lint`, `npm test`, and `npm run build`. For a live deployment, apply Supabase migrations, seed data, configure auth, and repeat the student and teacher paths with real accounts. If Supabase is unavailable, present the self-contained demo mode and say so explicitly.
