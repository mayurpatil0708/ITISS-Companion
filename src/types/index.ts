import { z } from 'zod';

export type Subject =
  | 'linux'
  | 'windows'
  | 'cross_platform'
  | 'cosa'
  | 'fundamental-computer-networks'
  | 'fcn'
  | 'programming-concepts'
  | 'pc'
  | 'it-infrastructure-devops'
  | 'iimd'
  | 'itid'
  | string;

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
  id: 'A' | 'B' | 'C' | 'D' | string;
  text: string;
}

export interface QuestionSource {
  document_id?: string;
  pdf_page_start?: number | null;
  pdf_page_end?: number | null;
  printed_page?: number | string | null;
  section?: string;
  evidence_summary?: string;
  [key: string]: any;
}

export interface Question {
  question_id: string;
  id?: string;
  subject: Subject;
  subjectId?: string;
  topic_id: string;
  topicId?: string;
  subtopic_id: string;
  subtopicId?: string;
  topic: string;
  topicName?: string;
  subtopic: string;
  subtopicName?: string;
  difficulty: Difficulty;
  question_type: QuestionType;
  questionType?: QuestionType;
  question_text: string;
  question?: string;
  options: QuestionOption[];
  correct_option_id: 'A' | 'B' | 'C' | 'D' | string;
  correctOptionId?: 'A' | 'B' | 'C' | 'D' | string;
  correctOptionIds?: string[];
  explanation: string;
  option_explanations: Record<string, string>;
  optionExplanations?: Record<string, string>;
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
  subtopicFilter?: string[];
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
  id: z.string(),
  text: z.string().min(1, 'Option text cannot be empty'),
});

export const QuestionSourceSchema = z.object({
  document_id: z.string().optional(),
  pdf_page_start: z.number().nullable().optional(),
  pdf_page_end: z.number().nullable().optional(),
  printed_page: z.union([z.number(), z.string()]).nullable().optional(),
  section: z.string().optional(),
  evidence_summary: z.string().optional(),
}).passthrough();

export const QuestionSchema = z.object({
  question_id: z.string().optional(),
  id: z.string().optional(),
  subject: z.string(),
  subjectId: z.string().optional(),
  topic_id: z.string().optional(),
  topicId: z.string().optional(),
  subtopic_id: z.string().optional(),
  subtopicId: z.string().optional(),
  topic: z.string().optional(),
  topicName: z.string().optional(),
  subtopic: z.string().optional(),
  subtopicName: z.string().optional(),
  difficulty: z.string().optional().default('intermediate'),
  question_type: z.string().optional().default('conceptual'),
  questionType: z.string().optional(),
  question_text: z.string().optional(),
  question: z.string().optional(),
  options: z.array(QuestionOptionSchema).min(2, 'Must contain at least 2 options'),
  correct_option_id: z.string().optional(),
  correctOptionId: z.string().optional(),
  correctOptionIds: z.array(z.string()).optional(),
  explanation: z.string().optional().default(''),
  option_explanations: z.record(z.string()).optional().default({}),
  optionExplanations: z.record(z.string()).optional().default({}),
  source: z.any().optional().default({ document_id: 'unknown' }),
  tags: z.array(z.string()).optional().default([]),
  related_question_ids: z.array(z.string()).optional().default([]),
  estimated_time_seconds: z.number().optional().default(60),
}).passthrough();

export const QuestionBankFileSchema = z.object({
  schema_version: z.string().optional().default('1.0.0'),
  subject: z.string().optional(),
  question_count: z.number().optional(),
  questions: z.array(z.any()),
}).passthrough();

export const CombinedManifestSchema = z.object({
  schema_version: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  questions_generated: z.number().optional(),
  question_counts_by_subject: z.record(z.number()).optional(),
}).passthrough();
