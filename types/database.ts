export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: UserInsert; Update: Partial<UserInsert> }
      students: { Row: Student; Insert: StudentInsert; Update: Partial<StudentInsert> }
      teachers: { Row: Teacher; Insert: TeacherInsert; Update: Partial<TeacherInsert> }
      concepts: { Row: Concept; Insert: ConceptInsert; Update: Partial<ConceptInsert> }
      subjects: { Row: Subject; Insert: SubjectInsert; Update: Partial<SubjectInsert> }
      topics: { Row: Topic; Insert: TopicInsert; Update: Partial<TopicInsert> }
      learning_content: { Row: LearningContent; Insert: LearningContentInsert; Update: Partial<LearningContentInsert> }
      concept_prerequisites: { Row: ConceptPrerequisite; Insert: ConceptPrerequisiteInsert; Update: Partial<ConceptPrerequisiteInsert> }
      questions: { Row: Question; Insert: QuestionInsert; Update: Partial<QuestionInsert> }
      attempts: { Row: Attempt; Insert: AttemptInsert; Update: never }
      evidence_events: { Row: EvidenceEvent; Insert: EvidenceEventInsert; Update: never }
      learner_state: { Row: LearnerState; Insert: LearnerStateInsert; Update: Partial<LearnerStateInsert> }
      recommendations: { Row: Recommendation; Insert: RecommendationInsert; Update: never }
      practice_sessions: { Row: PracticeSession; Insert: PracticeSessionInsert; Update: Partial<PracticeSessionInsert> }
      teacher_overrides: { Row: TeacherOverride; Insert: TeacherOverrideInsert; Update: Partial<TeacherOverrideInsert> }
      audit_events: { Row: AuditEvent; Insert: AuditEventInsert; Update: never }
    }
  }
}

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json | undefined }
export type UUID = string
export type Timestamp = string
export type Action = 'diagnostic' | 'teach_prerequisite' | 'practice' | 'remediation' | 'review' | 'advance' | 'teacher_intervention'
export type ConceptDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export type User = { id: UUID; auth_user_id: UUID; name: string; email: string; role: 'student' | 'teacher' | 'admin'; created_at: Timestamp; updated_at: Timestamp }
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<User, 'id' | 'created_at' | 'updated_at'>>
export type Student = { id: UUID; user_id: UUID; created_at: Timestamp; updated_at: Timestamp }
export type StudentInsert = Partial<Pick<Student, 'id' | 'created_at' | 'updated_at'>> & Pick<Student, 'user_id'>
export type Teacher = Student
export type TeacherInsert = StudentInsert
export type Concept = { id: UUID; name: string; slug: string; description: string | null; subject: string; difficulty: ConceptDifficulty; estimated_minutes: number; is_active: boolean; diagnostic_weight: number; created_at: Timestamp; updated_at: Timestamp }
export type ConceptInsert = Partial<Pick<Concept, 'id' | 'created_at' | 'updated_at'>> & Pick<Concept, 'name' | 'slug' | 'subject' | 'difficulty' | 'estimated_minutes'> & Partial<Pick<Concept, 'description' | 'is_active' | 'diagnostic_weight'>>
export type Subject = { id: UUID; name: string; slug: string; description: string | null; icon: string | null; created_at: Timestamp; updated_at: Timestamp }
export type SubjectInsert = Partial<Pick<Subject, 'id' | 'created_at' | 'updated_at'>> & Pick<Subject, 'name' | 'slug'> & Partial<Pick<Subject, 'description' | 'icon'>>
export type Topic = { id: UUID; subject_id: UUID; name: string; slug: string; description: string | null; created_at: Timestamp; updated_at: Timestamp }
export type TopicInsert = Partial<Pick<Topic, 'id' | 'created_at' | 'updated_at'>> & Pick<Topic, 'subject_id' | 'name' | 'slug'> & Partial<Pick<Topic, 'description'>>
export type ContentType = 'LESSON' | 'EXPLANATION' | 'WORKED_EXAMPLE' | 'SUMMARY' | 'PRACTICE' | 'REVIEW' | 'REMEDIATION'
export type LearningContent = { id: UUID; concept_id: UUID; content_type: ContentType; title: string; description: string | null; body: Json; difficulty: ConceptDifficulty; estimated_minutes: number; order_index: number; metadata: Json; version: number; is_active: boolean; created_at: Timestamp; updated_at: Timestamp }
export type LearningContentInsert = Partial<Pick<LearningContent, 'id' | 'created_at' | 'updated_at'>> & Pick<LearningContent, 'concept_id' | 'content_type' | 'title'> & Partial<Pick<LearningContent, 'description' | 'body' | 'difficulty' | 'estimated_minutes' | 'order_index' | 'metadata' | 'version' | 'is_active'>>
export type ConceptPrerequisite = { id: UUID; concept_id: UUID; prerequisite_concept_id: UUID; required_mastery: number; priority: number; created_at: Timestamp }
export type ConceptPrerequisiteInsert = Partial<Pick<ConceptPrerequisite, 'id' | 'created_at'>> & Pick<ConceptPrerequisite, 'concept_id' | 'prerequisite_concept_id'> & Partial<Pick<ConceptPrerequisite, 'required_mastery' | 'priority'>>
export type QuestionType = 'MCQ' | 'SHORT_ANSWER'
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type Question = { id: UUID; concept_id: UUID; question_text: string; question_type: QuestionType; difficulty: QuestionDifficulty; options: Json; correct_answer: Json; explanation: string; hint: string; metadata: Json; is_active: boolean; is_diagnostic: boolean; created_at: Timestamp; updated_at: Timestamp }
export type QuestionInsert = Partial<Pick<Question, 'id' | 'created_at' | 'updated_at'>> & Pick<Question, 'concept_id' | 'question_text' | 'question_type' | 'difficulty' | 'correct_answer' | 'explanation' | 'hint'> & Partial<Pick<Question, 'options' | 'metadata' | 'is_active' | 'is_diagnostic'>>
export type Attempt = { id: UUID; student_id: UUID; question_id: UUID; concept_id: UUID; submitted_answer: Json; correctness: number; is_correct: boolean; difficulty: QuestionDifficulty; response_time_ms: number | null; hint_count: number; used_hint: boolean; retry_number: number; attempt_context: 'diagnostic' | 'practice' | 'review' | 'remediation'; started_at: Timestamp | null; submitted_at: Timestamp; created_at: Timestamp }
export type AttemptInsert = Partial<Pick<Attempt, 'id' | 'created_at' | 'submitted_at'>> & Pick<Attempt, 'student_id' | 'question_id' | 'concept_id' | 'submitted_answer' | 'is_correct' | 'difficulty'> & Partial<Pick<Attempt, 'response_time_ms' | 'hint_count' | 'used_hint' | 'retry_number' | 'attempt_context' | 'started_at'>>
export type EvidenceType = 'CORRECT_INDEPENDENT' | 'CORRECT_WITH_HINT' | 'INCORRECT' | 'REPEATED_FAILURE' | 'FAST_SUCCESS' | 'SLOW_SUCCESS'
export type EvidenceEvent = { id: UUID; attempt_id: UUID; student_id: UUID; concept_id: UUID; evidence_type: EvidenceType; value: number; weight: number; metadata: Json; created_at: Timestamp }
export type EvidenceEventInsert = Partial<Pick<EvidenceEvent, 'id' | 'created_at'>> & Pick<EvidenceEvent, 'attempt_id' | 'student_id' | 'concept_id' | 'evidence_type' | 'value' | 'weight'> & Partial<Pick<EvidenceEvent, 'metadata'>>
export type LearnerState = { id: UUID; student_id: UUID; concept_id: UUID; mastery_score: number; confidence_score: number; evidence_count: number; independent_success_count: number; hinted_success_count: number; failure_count: number; recent_streak: number; last_attempt_at: Timestamp | null; last_success_at: Timestamp | null; next_review_at: Timestamp | null; state_version: number; attempt_count: number; correct_count: number; incorrect_count: number; repeated_failure_count: number; hint_usage_count: number; created_at: Timestamp; updated_at: Timestamp }
export type LearnerStateInsert = Partial<Pick<LearnerState, 'id' | 'created_at' | 'updated_at'>> & Pick<LearnerState, 'student_id' | 'concept_id'> & Partial<Omit<LearnerState, 'id' | 'student_id' | 'concept_id' | 'created_at' | 'updated_at'>>
export type Recommendation = { id: UUID; student_id: UUID; concept_id: UUID; action: Action; reason_codes: string[]; evidence_ids: UUID[]; state_snapshot: Json; engine_version: string; created_at: Timestamp }
export type RecommendationInsert = Partial<Pick<Recommendation, 'id' | 'created_at'>> & Pick<Recommendation, 'student_id' | 'concept_id' | 'action' | 'engine_version'> & Partial<Pick<Recommendation, 'reason_codes' | 'evidence_ids' | 'state_snapshot'>>
export type PracticeSessionStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
export type PracticeSession = { id: UUID; student_id: UUID; recommendation_id: UUID | null; concept_id: UUID; action_type: Exclude<Action, 'diagnostic' | 'teacher_intervention'>; question_ids: UUID[]; completed_question_ids: UUID[]; current_question: number; score: number; total_questions: number; status: PracticeSessionStatus; started_at: Timestamp; completed_at: Timestamp | null; created_at: Timestamp }
export type PracticeSessionInsert = Partial<Pick<PracticeSession, 'id' | 'started_at' | 'completed_at' | 'created_at'>> & Pick<PracticeSession, 'student_id' | 'concept_id' | 'action_type' | 'question_ids' | 'total_questions'> & Partial<Pick<PracticeSession, 'recommendation_id' | 'completed_question_ids' | 'current_question' | 'score' | 'status'>>
export type TeacherOverride = { id: UUID; teacher_id: UUID; student_id: UUID; concept_id: UUID; previous_action: Action; new_action: Action; reason: string; active: boolean; created_at: Timestamp; updated_at: Timestamp }
export type TeacherOverrideInsert = Partial<Pick<TeacherOverride, 'id' | 'created_at' | 'updated_at'>> & Pick<TeacherOverride, 'teacher_id' | 'student_id' | 'concept_id' | 'previous_action' | 'new_action' | 'reason'> & Partial<Pick<TeacherOverride, 'active'>>
export type AuditEvent = { id: UUID; actor_user_id: UUID | null; entity_type: string; entity_id: UUID; action: string; before_data: Json | null; after_data: Json | null; metadata: Json; created_at: Timestamp }
export type AuditEventInsert = Partial<Pick<AuditEvent, 'id' | 'created_at'>> & Pick<AuditEvent, 'entity_type' | 'entity_id' | 'action'> & Partial<Pick<AuditEvent, 'actor_user_id' | 'before_data' | 'after_data' | 'metadata'>>
