import { Question, QuestionOption, AttemptRecord, QuizQuestionItem, Subject, Difficulty } from '@/types';
import { questionRepository } from '../storage/indexeddb.repository';

export interface PracticeConfig {
  subject: Subject | 'all';
  topics: string[];
  subtopics?: string[];
  difficulty: Difficulty | 'mixed';
  questionCount: number;
  selection: 'all' | 'unseen' | 'incorrect' | 'bookmarked' | 'randomized' | 'previously_attempted';
  mode: 'practice' | 'exam';
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  timeLimitMinutes?: number;
}

export interface QuizScoreBreakdown {
  rawScore: number;
  total: number;
  accuracyPct: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeSpentSeconds: number;
  topicBreakdown: Record<string, { total: number; correct: number; accuracyPct: number }>;
  difficultyBreakdown: Record<Difficulty, { total: number; correct: number; accuracyPct: number }>;
}

export class QuizService {
  /**
   * Helper to shuffle an array immutably
   */
  public static shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Prepare options for display. If randomizeOptions is true, shuffles them
   * while keeping their original id intact.
   */
  public static prepareDisplayOptions(options: QuestionOption[], randomize: boolean): QuestionOption[] {
    if (!randomize) {
      return [...options];
    }
    return this.shuffle(options);
  }

  /**
   * Generates a new quiz attempt from practice configuration
   */
  public static async createAttempt(config: PracticeConfig): Promise<AttemptRecord> {
    const eligibleQuestions = await questionRepository.getQuestions({
      subject: config.subject,
      topics: config.topics,
      subtopics: config.subtopics,
      difficulty: config.difficulty,
      selection: config.selection,
    });

    if (eligibleQuestions.length === 0) {
      throw new Error('No questions match the selected criteria. Try adjusting your subject, topics, or difficulty.');
    }

    let selectedQuestions = [...eligibleQuestions];
    if (config.randomizeQuestions) {
      selectedQuestions = this.shuffle(selectedQuestions);
    }

    const count = Math.min(config.questionCount, selectedQuestions.length);
    selectedQuestions = selectedQuestions.slice(0, count);

    const items: QuizQuestionItem[] = selectedQuestions.map((q) => {
      return {
        questionId: q.question_id,
        originalQuestion: q,
        displayOptions: this.prepareDisplayOptions(q.options, config.randomizeOptions),
        selectedOptionId: null,
        isMarkedForReview: false,
        timeSpentSeconds: 0,
      };
    });

    const now = new Date().toISOString();
    const subjectTitle = config.subject === 'all' ? 'Comprehensive' : config.subject.toUpperCase();
    const modeTitle = config.mode === 'exam' ? 'Mock Exam' : 'Practice Session';

    const attempt: AttemptRecord = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      mode: config.mode,
      title: `${subjectTitle} ${modeTitle}`,
      subjectFilter: config.subject,
      topicFilter: config.topics,
      subtopicFilter: config.subtopics,
      difficultyFilter: config.difficulty,
      startedAt: now,
      totalQuestions: items.length,
      timeSpentSeconds: 0,
      isCompleted: false,
      items,
    };

    await questionRepository.saveAttempt(attempt);
    return attempt;
  }

  /**
   * Calculates detailed score breakdown for a completed or in-progress attempt
   */
  public static calculateScore(attempt: AttemptRecord): QuizScoreBreakdown {
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const topicStats: Record<string, { total: number; correct: number }> = {};
    const diffStats: Record<Difficulty, { total: number; correct: number }> = {
      foundational: { total: 0, correct: 0 },
      intermediate: { total: 0, correct: 0 },
      advanced: { total: 0, correct: 0 },
    };

    for (const item of attempt.items) {
      const q = item.originalQuestion;
      const topic = q.topic || 'General';
      const diff = q.difficulty || 'intermediate';

      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 };
      }
      topicStats[topic].total++;

      if (diffStats[diff]) {
        diffStats[diff].total++;
      }

      if (!item.selectedOptionId) {
        unansweredCount++;
      } else if (item.selectedOptionId === q.correct_option_id) {
        correctCount++;
        topicStats[topic].correct++;
        if (diffStats[diff]) diffStats[diff].correct++;
      } else {
        incorrectCount++;
      }
    }

    const total = attempt.items.length;
    const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const topicBreakdown: Record<string, { total: number; correct: number; accuracyPct: number }> = {};
    for (const [top, stats] of Object.entries(topicStats)) {
      topicBreakdown[top] = {
        total: stats.total,
        correct: stats.correct,
        accuracyPct: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      };
    }

    const difficultyBreakdown: Record<Difficulty, { total: number; correct: number; accuracyPct: number }> = {
      foundational: {
        total: diffStats.foundational.total,
        correct: diffStats.foundational.correct,
        accuracyPct:
          diffStats.foundational.total > 0
            ? Math.round((diffStats.foundational.correct / diffStats.foundational.total) * 100)
            : 0,
      },
      intermediate: {
        total: diffStats.intermediate.total,
        correct: diffStats.intermediate.correct,
        accuracyPct:
          diffStats.intermediate.total > 0
            ? Math.round((diffStats.intermediate.correct / diffStats.intermediate.total) * 100)
            : 0,
      },
      advanced: {
        total: diffStats.advanced.total,
        correct: diffStats.advanced.correct,
        accuracyPct:
          diffStats.advanced.total > 0
            ? Math.round((diffStats.advanced.correct / diffStats.advanced.total) * 100)
            : 0,
      },
    };

    return {
      rawScore: correctCount,
      total,
      accuracyPct,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeSpentSeconds: attempt.timeSpentSeconds,
      topicBreakdown,
      difficultyBreakdown,
    };
  }

  /**
   * Finalizes an attempt submission safely, guarding against duplicate submits
   */
  public static async submitAttempt(attemptId: string): Promise<AttemptRecord> {
    const attempt = await questionRepository.getAttemptById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt ${attemptId} not found`);
    }

    if (attempt.isCompleted) {
      return attempt; // Safe idempotent return
    }

    const score = this.calculateScore(attempt);

    attempt.isCompleted = true;
    attempt.submittedAt = new Date().toISOString();
    attempt.score = {
      rawScore: score.rawScore,
      total: score.total,
      accuracyPct: score.accuracyPct,
      correctCount: score.correctCount,
      incorrectCount: score.incorrectCount,
      unansweredCount: score.unansweredCount,
    };

    await questionRepository.saveAttempt(attempt);
    return attempt;
  }
}
