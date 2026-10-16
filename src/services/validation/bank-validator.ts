import { Question, QuestionSchema, QuestionBankFileSchema } from '@/types';

export interface ValidationErrorItem {
  questionId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationReport {
  isValid: boolean;
  totalParsed: number;
  validQuestions: Question[];
  errors: ValidationErrorItem[];
  warnings: string[];
  duplicateIds: string[];
  subjectCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
}

export class QuestionBankValidator {
  /**
   * Validates raw JSON string or parsed object
   */
  public static validateRawJson(content: string | unknown, existingQuestionIds: Set<string> = new Set()): ValidationReport {
    let parsed: unknown;
    const errors: ValidationErrorItem[] = [];
    const warnings: string[] = [];
    const duplicateIds: string[] = [];
    const validQuestions: Question[] = [];
    const seenIdsInBatch = new Set<string>();

    const subjectCounts: Record<string, number> = {
      linux: 0,
      windows: 0,
      cross_platform: 0,
    };

    const difficultyCounts: Record<string, number> = {
      foundational: 0,
      intermediate: 0,
      advanced: 0,
    };

    // 1. JSON parsing check
    if (typeof content === 'string') {
      try {
        parsed = JSON.parse(content);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Invalid JSON format';
        errors.push({
          message: `JSON Parse Error: ${errorMsg}`,
          severity: 'error',
        });
        return {
          isValid: false,
          totalParsed: 0,
          validQuestions: [],
          errors,
          warnings,
          duplicateIds,
          subjectCounts,
          difficultyCounts,
        };
      }
    } else {
      parsed = content;
    }

    if (!parsed || typeof parsed !== 'object') {
      errors.push({
        message: 'Input must be a valid JSON object or array of questions',
        severity: 'error',
      });
      return {
        isValid: false,
        totalParsed: 0,
        validQuestions: [],
        errors,
        warnings,
        duplicateIds,
        subjectCounts,
        difficultyCounts,
      };
    }

    // 2. Extract raw questions list
    let rawQuestions: unknown[] = [];
    const obj = parsed as Record<string, unknown>;

    if (Array.isArray(parsed)) {
      rawQuestions = parsed;
    } else if (Array.isArray(obj.questions)) {
      rawQuestions = obj.questions;
      // Validate container schema if present
      const bankResult = QuestionBankFileSchema.safeParse(obj);
      if (!bankResult.success) {
        for (const issue of bankResult.error.issues) {
          if (issue.path[0] !== 'questions') {
            warnings.push(`Bank Metadata: ${issue.path.join('.')} - ${issue.message}`);
          }
        }
      }
    } else {
      errors.push({
        message: 'No "questions" array found in JSON payload',
        severity: 'error',
      });
      return {
        isValid: false,
        totalParsed: 0,
        validQuestions: [],
        errors,
        warnings,
        duplicateIds,
        subjectCounts,
        difficultyCounts,
      };
    }

    // 3. Validate individual questions
    for (let i = 0; i < rawQuestions.length; i++) {
      const item = rawQuestions[i];
      const fallbackId = `Item[${i}]`;

      const result = QuestionSchema.safeParse(item);
      if (!result.success) {
        const qId = (item as Record<string, unknown>)?.question_id ? String((item as Record<string, unknown>).question_id) : fallbackId;
        for (const issue of result.error.issues) {
          errors.push({
            questionId: qId,
            field: issue.path.join('.'),
            message: issue.message,
            severity: 'error',
          });
        }
        continue;
      }

      const q = result.data as Question;

      // Check option IDs completeness (must have A, B, C, D)
      const optionIds = new Set(q.options.map((o) => o.id));
      const hasAllOptions = ['A', 'B', 'C', 'D'].every((letter) => optionIds.has(letter as 'A' | 'B' | 'C' | 'D'));
      if (!hasAllOptions) {
        errors.push({
          questionId: q.question_id,
          field: 'options',
          message: 'Question options must specifically include IDs A, B, C, and D',
          severity: 'error',
        });
        continue;
      }

      // Check correct_option_id matches one of the options
      if (!optionIds.has(q.correct_option_id)) {
        errors.push({
          questionId: q.question_id,
          field: 'correct_option_id',
          message: `Correct option ID "${q.correct_option_id}" does not exist in options list`,
          severity: 'error',
        });
        continue;
      }

      // Check duplicate in the batch
      if (seenIdsInBatch.has(q.question_id)) {
        duplicateIds.push(q.question_id);
        errors.push({
          questionId: q.question_id,
          field: 'question_id',
          message: `Duplicate question ID "${q.question_id}" found within the imported file`,
          severity: 'error',
        });
        continue;
      }
      seenIdsInBatch.add(q.question_id);

      // Warning if ID already exists in repository database
      if (existingQuestionIds.has(q.question_id)) {
        warnings.push(`Question ID "${q.question_id}" already exists in the database and will be updated/overwritten.`);
      }

      // Check source reference
      if (!q.source || !q.source.document_id) {
        warnings.push(`Question "${q.question_id}" has incomplete source document reference.`);
      }

      // Accumulate counts
      if (subjectCounts[q.subject] !== undefined) {
        subjectCounts[q.subject]++;
      }
      if (difficultyCounts[q.difficulty] !== undefined) {
        difficultyCounts[q.difficulty]++;
      }

      validQuestions.push(q);
    }

    return {
      isValid: errors.length === 0,
      totalParsed: rawQuestions.length,
      validQuestions,
      errors,
      warnings,
      duplicateIds,
      subjectCounts,
      difficultyCounts,
    };
  }
}
