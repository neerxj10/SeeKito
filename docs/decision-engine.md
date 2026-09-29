# Seekito Decision Engine

## Purpose

The Phase 4 engine evaluates a requested target concept using persisted learner state, recent evidence, and the prerequisite graph. It returns one deterministic learning decision. It does not generate questions, mutate learner state, call an LLM, or choose an arbitrary next concept.

## Inputs and outputs

`DecisionContext` contains the authenticated student, target concept, target learner state, prerequisite states, recent evidence, recent attempts, and the relevant concept graph. The pure evaluator is in `lib/decision-engine/evaluate.ts`.

`DecisionResult` contains the decision, target mastery and confidence, human-readable reasons, all blocking prerequisites, a recommended action label, engine version, evaluation time, and an internal rule trace.

## Decisions

- `BLOCKED`: a direct prerequisite has mastery below 50.
- `REMEDIATE`: mastery is below 40, repeated failures are at least 2, or recent incorrect evidence outweighs recent success.
- `REVIEW`: mastery was previously sufficient but confidence is below 60 or the last success is older than 14 days.
- `ADVANCE`: mastery is at least 80 and confidence is at least 60, with no blocking prerequisite.
- `PRACTICE`: fallback for partial understanding that does not match a higher-priority rule.

## Thresholds

All thresholds are centralized in `lib/decision-engine/config.ts`:

```text
advance mastery       80
practice mastery      50
remediation mastery   40
confidence            60
repeated failures      2
recent evidence        10
review interval       14 days
```

These are prototype heuristics, not a scientifically validated learning assessment model.

## Rule priority

The engine evaluates rules explicitly in this order:

1. `PREREQUISITE_BLOCK`
2. `TARGET_REMEDIATION`
3. `TARGET_REVIEW`
4. `TARGET_ADVANCE`
5. `TARGET_PRACTICE`

Prerequisites are evaluated before target mastery, so a highly mastered target can still be `BLOCKED` by a weak prerequisite.

## Explanation and trace

Reasons are generated from the matched rule and actual values. The result trace records every prerequisite check, each rule evaluation, and the final decision. Decision history stores this trace with `engine_version` in `decision_events`.

## API and security

`POST /api/decision` accepts only `targetConceptId`. Student identity comes from Supabase Auth, never from the request body. The API fetches data, calls the pure evaluator, and appends a historical decision event. It does not update learner state.

## Limitations

This is a deterministic prototype model. It does not model forgetting scientifically, infer mastery from raw answers itself, select the next concept automatically, or generate recommendations. Those concerns belong to later phases.

