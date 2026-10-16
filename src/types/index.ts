import { z } from 'zod';

export type Subject = 'linux' | 'windows' | 'cross_platform';

export type Difficulty = 'foundational' | 'intermediate' | 'advanced';

export type QuestionType =
  | 'conceptual'
  | 'command_syntax'
  | 'troubleshooting'
  | 'comparison'
  | 'scenario'
  | 'sequence'
  | 'configuration'
  | 'security'
  | 'command_output';

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionSource {
  document_id: string;
  pdf_page_start?: number | null;
  pdf_page_end?: number | null;
  printed_page?: number | string | null;
  section?: string;
  evidence_summary?: string;
}

export interface Question {
  question_id: string;
  subject: Subject;
  topic_id: string;
  subtopic_id: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  question_type: QuestionType;
  question_text: string;
  options: QuestionOption[];
  correct_option_id: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  option_explanations: Record<'A' | 'B' | 'C' | 'D', string>;
  source: QuestionSource;
  tags: string[];
  related_question_ids?: string[];
  estimated_time_seconds?: number;
}

export interface QuestionBankFile {
  schema_version: string;
  subject: Subject;
  question_count: number;
  questions: Question[];
}

export interface TopicSubtopic {
  subtopic_id: string;
  subtopic: string;
  description?: string;
  concepts_to_cover?: string[];
  planned_question_count?: number;
  actual_question_count?: number;
  coverage_status?: string;
}

export interface TopicItem {
  topic_id: string;
  subject: Subject;
  topic: string;
  subtopics: TopicSubtopic[];
}

export interface TopicInventoryFile {
  schema_version: string;
  hierarchy: string;
  topics: TopicItem[];
}

export interface QuizQuestionItem {
  questionId: string;
  originalQuestion: Question;
  displayOptions: QuestionOption[]; // May be randomized or ordered
  selectedOptionId: string | null;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
}

export interface AttemptRecord {
  id: string;
  mode: 'practice' | 'exam';
  title: string;
  subjectFilter: Subject | 'all';
  topicFilter?: string[];
  difficultyFilter?: Difficulty | 'mixed';
  startedAt: string; // ISO
  submittedAt?: string; // ISO
  totalQuestions: number;
  timeSpentSeconds: number;
  isCompleted: boolean;
  items: QuizQuestionItem[];
  score?: {
    rawScore: number;
    total: number;
    accuracyPct: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
  };
}

export interface BookmarkRecord {
  questionId: string;
  bookmarkedAt: string;
  notes?: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  userName: string;
  sidebarCollapsed: boolean;
  practicePassingThreshold: number;
  soundEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  defaultTimerMinutes: number;
}

// Zod Validation Schemas
export const QuestionOptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1, 'Option text cannot be empty'),
});

export const QuestionSourceSchema = z.object({
  document_id: z.string(),
  pdf_page_start: z.number().nullable().optional(),
  pdf_page_end: z.number().nullable().optional(),
  printed_page: z.union([z.number(), z.string()]).nullable().optional(),
  section: z.string().optional(),
  evidence_summary: z.string().optional(),
});

export const QuestionSchema = z.object({
  question_id: z.string().min(1, 'Question ID is required'),
  subject: z.enum(['linux', 'windows', 'cross_platform']),
  topic_id: z.string(),
  subtopic_id: z.string(),
  topic: z.string(),
  subtopic: z.string(),
  difficulty: z.enum(['foundational', 'intermediate', 'advanced']),
  question_type: z.string().default('conceptual'),
  question_text: z.string().min(3, 'Question text must be at least 3 characters'),
  options: z.array(QuestionOptionSchema).length(4, 'Must contain exactly 4 options (A-D)'),
  correct_option_id: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(1, 'Explanation is required'),
  option_explanations: z.record(z.string()).optional().default({}),
  source: QuestionSourceSchema.optional().default({ document_id: 'unknown' }),
  tags: z.array(z.string()).optional().default([]),
  related_question_ids: z.array(z.string()).optional().default([]),
  estimated_time_seconds: z.number().optional().default(60),
});

export const QuestionBankFileSchema = z.object({
  schema_version: z.string().optional().default('1.0.0'),
  subject: z.enum(['linux', 'windows', 'cross_platform']),
  question_count: z.number().optional(),
  questions: z.array(QuestionSchema),
});

export const CombinedManifestSchema = z.object({
  schema_version: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  questions_generated: z.number().optional(),
  question_counts_by_subject: z.record(z.number()).optional(),
});
