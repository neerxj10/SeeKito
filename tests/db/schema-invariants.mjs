import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const migrationDir = path.join(root, 'supabase/migrations')
const files = fs.readdirSync(migrationDir).filter((file) => file.endsWith('.sql')).sort()
const sql = files.map((file) => fs.readFileSync(path.join(migrationDir, file), 'utf8')).join('\n')

const tables = [
  'users', 'students', 'teachers', 'concepts', 'concept_prerequisites',
  'questions', 'attempts', 'evidence_events', 'learner_state',
  'recommendations', 'teacher_overrides', 'audit_events',
  'practice_sessions', 'subjects', 'topics', 'learning_content',
]

assert.deepEqual(files, [
  'create_users', 'create_students_teachers', 'create_concepts',
  'create_concept_prerequisites', 'create_questions', 'create_attempts',
  'create_evidence_events', 'create_learner_state', 'create_recommendations',
  'create_teacher_overrides', 'create_audit_events', 'create_indexes_and_rls',
  'add_concept_graph_metadata',
  'phase3_assessment_schema', 'phase3_atomic_attempt_pipeline',
  'phase4_decision_events', 'phase6_practice_sessions', 'phase7_content_intelligence',
].map((name, index) => `${String(index + 1).padStart(3, '0')}_${name}.sql`))

for (const table of tables) {
  assert.match(sql, new RegExp(`create table (?:if not exists )?public\\.${table} \\(`))
  assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`))
}

assert.match(sql, /unique \(student_id, concept_id\)/)
assert.match(sql, /check \(concept_id <> prerequisite_concept_id\)/)
assert.match(sql, /unique \(concept_id, prerequisite_concept_id\)/)
assert.match(sql, /foreign key \(question_id, concept_id\) references public\.questions\(id, concept_id\)/)
assert.match(sql, /foreign key \(attempt_id, student_id, concept_id\)/)
assert.match(sql, /check \(mastery_score between 0 and 1\)/)
assert.match(sql, /check \(confidence_score between 0 and 1\)/)
assert.match(sql, /create trigger attempts_immutable_update/)
assert.match(sql, /create trigger evidence_events_immutable_update/)
assert.match(sql, /create trigger recommendations_immutable_update/)
assert.match(sql, /create trigger audit_events_immutable_update/)
assert.match(sql, /create trigger recommendations_validate_evidence/)
assert.match(sql, /create policy attempts_select_own/)
assert.match(sql, /create policy learner_state_select_own/)
assert.match(sql, /create policy recommendations_select_own/)
assert.match(sql, /create policy practice_sessions_select_own/)
assert.match(sql, /create policy subjects_select_authenticated/)
assert.match(sql, /create policy topics_select_authenticated/)
assert.match(sql, /create policy learning_content_select_authenticated/)
assert.doesNotMatch(sql, /create policy .*teacher.*using \(true\)/i)
assert.match(sql, /add column options jsonb/)
assert.match(sql, /add column is_correct boolean/)
assert.match(sql, /add column attempt_count integer/)
assert.match(sql, /record_attempt_pipeline/)
assert.match(sql, /attempts_immutable_update/)

const seed = fs.readFileSync(path.join(root, 'supabase/seed.sql'), 'utf8')
assert.match(seed, /basic-arithmetic/)
assert.match(seed, /coordinate-algebra/)
assert.match(seed, /on conflict \(concept_id, prerequisite_concept_id\)/)
assert.equal((seed.match(/'20000000-0000-0000/g) ?? []).length, 30)

const conceptMetadataMigration = fs.readFileSync(path.join(root, 'supabase/migrations/013_add_concept_graph_metadata.sql'), 'utf8')
assert.match(conceptMetadataMigration, /if difficulty_type in \('numeric', 'real', 'double precision'\)/)
assert.match(conceptMetadataMigration, /elsif difficulty_type = 'text'/)
assert.match(conceptMetadataMigration, /add column if not exists slug text/)
const numericConversion = conceptMetadataMigration.indexOf('alter column difficulty type text using')
const numericGuard = conceptMetadataMigration.indexOf("if difficulty_type in ('numeric', 'real', 'double precision')")
const textGuard = conceptMetadataMigration.indexOf("elsif difficulty_type = 'text'")
assert(numericGuard >= 0 && numericConversion > numericGuard && numericConversion < textGuard, 'Numeric difficulty conversion must remain inside the numeric-type branch')

const attemptsRoute = fs.readFileSync(path.join(root, 'app/api/attempts/route.ts'), 'utf8')
const attemptService = fs.readFileSync(path.join(root, 'lib/assessment/record-attempt.ts'), 'utf8')
const questionRoute = fs.readFileSync(path.join(root, 'app/api/questions/[id]/route.ts'), 'utf8')
assert.match(attemptService, /isAnswerCorrect/)
assert.match(attemptsRoute, /recordAttempt/)
assert.match(attemptService, /record_attempt_pipeline/)
assert.doesNotMatch(questionRoute, /correct_answer/)

console.log(`Validated ${files.length} ordered migrations, ${tables.length} tables, RLS coverage, immutable-history triggers, and development seed safeguards.`)
