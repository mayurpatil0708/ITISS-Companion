import { Question, AttemptRecord, Subject, Difficulty } from '@/types';
import { questionRepository } from '../storage/indexeddb.repository';

export interface SubjectAnalytics {
  subject: Subject;
  totalQuestions: number;
  totalTopics: number;
  attemptedQuestions: number;
  correctAnswers: number;
  accuracyPct: number;
  coveragePct: number;
}

export interface TopicAnalytics {
  topic: string;
  subject: Subject;
  totalQuestions: number;
  attempted: number;
  correct: number;
  accuracyPct: number;
  isWeakArea: boolean;
}

export interface OverallAnalytics {
  totalQuestions: number;
  distinctAttemptedQuestions: number;
  totalAttempts: number;
  completedAttempts: number;
  overallAccuracyPct: number;
  studyStreakDays: number;
  trendPct?: number; // positive or negative improvement if >= 6 attempts exist
  subjectBreakdown: Record<Subject, SubjectAnalytics>;
  topicBreakdown: TopicAnalytics[];
  weakTopics: TopicAnalytics[];
  difficultyBreakdown: Record<Difficulty, { total: number; attempted: number; correct: number; accuracyPct: number }>;
  timelineData: { date: string; attempts: number; scoreAvg: number; questionCount: number }[];
  frequentlyMissedQuestions: { question: Question; missCount: number }[];
}

export class AnalyticsService {
  /**
   * Computes user study streak in days based on attempt timestamps
   */
  public static calculateStreak(attempts: AttemptRecord[]): number {
    if (attempts.length === 0) return 0;

    const dates = new Set<string>();
    for (const a of attempts) {
      if (a.startedAt) {
        dates.add(new Date(a.startedAt).toISOString().split('T')[0]);
      }
    }

    const sortedDates = Array.from(dates).sort().reverse();
    if (sortedDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If candidate didn't study today or yesterday, streak is 0
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let expectedDate = new Date(sortedDates[0]);

    for (const dateStr of sortedDates) {
      const d = new Date(dateStr);
      const diffDays = Math.round((expectedDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 1) {
        streak++;
        expectedDate = d;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculates comprehensive analytics across questions, attempts, and topics
   */
  public static async getAnalytics(): Promise<OverallAnalytics> {
    const questions = await questionRepository.getAllQuestions();
    const attempts = await questionRepository.getAllAttempts();

    const totalQuestions = questions.length;
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter((a) => a.isCompleted).length;

    // Build question map for instant lookup
    const questionMap = new Map<string, Question>();
    for (const q of questions) {
      questionMap.set(q.question_id, q);
    }

    // Collect distinct questions attempted, correct/incorrect counters
    const distinctAttemptedIds = new Set<string>();
    let totalAnsweredCount = 0;
    let totalCorrectCount = 0;

    const questionMissCounts: Record<string, number> = {};
    const topicAttemptMap: Record<string, { total: number; correct: number; subject: Subject }> = {};

    const diffStats: Record<Difficulty, { total: number; attempted: number; correct: number }> = {
      foundational: { total: 0, attempted: 0, correct: 0 },
      intermediate: { total: 0, attempted: 0, correct: 0 },
      advanced: { total: 0, attempted: 0, correct: 0 },
    };

    for (const q of questions) {
      if (diffStats[q.difficulty]) {
        diffStats[q.difficulty].total++;
      }
    }

    // Process attempts in chronological order
    for (const att of attempts) {
      for (const item of att.items) {
        if (item.selectedOptionId) {
          distinctAttemptedIds.add(item.questionId);
          totalAnsweredCount++;

          const originalQ = questionMap.get(item.questionId) || item.originalQuestion;
          const isCorrect = item.selectedOptionId === originalQ.correct_option_id;

          if (isCorrect) {
            totalCorrectCount++;
          } else {
            questionMissCounts[item.questionId] = (questionMissCounts[item.questionId] || 0) + 1;
          }

          // Topic stats
          const top = originalQ.topic;
          if (!topicAttemptMap[top]) {
            topicAttemptMap[top] = { total: 0, correct: 0, subject: originalQ.subject };
          }
          topicAttemptMap[top].total++;
          if (isCorrect) topicAttemptMap[top].correct++;

          // Difficulty stats
          if (diffStats[originalQ.difficulty]) {
            diffStats[originalQ.difficulty].attempted++;
            if (isCorrect) diffStats[originalQ.difficulty].correct++;
          }
        }
      }
    }

    const overallAccuracyPct = totalAnsweredCount > 0 ? Math.round((totalCorrectCount / totalAnsweredCount) * 100) : 0;
    const studyStreakDays = this.calculateStreak(attempts);

    // Honest trend calculation if at least 6 completed attempts exist
    let trendPct: number | undefined;
    const completedList = attempts.filter((a) => a.isCompleted && a.score);
    if (completedList.length >= 6) {
      const recent3 = completedList.slice(0, 3);
      const prior3 = completedList.slice(3, 6);

      const recentAvg = recent3.reduce((acc, curr) => acc + (curr.score?.accuracyPct || 0), 0) / recent3.length;
      const priorAvg = prior3.reduce((acc, curr) => acc + (curr.score?.accuracyPct || 0), 0) / prior3.length;

      trendPct = Math.round(recentAvg - priorAvg);
    }

    // Dynamic Subject breakdown supporting all 4 CMCE modules + legacy subjects
    const subjectBreakdown: Record<Subject, SubjectAnalytics> = {};
    const topicsBySubject: Record<Subject, Set<string>> = {};
    const attemptedBySubject: Record<Subject, Set<string>> = {};

    const defaultSubjects: Subject[] = [
      'cosa',
      'fundamental-computer-networks',
      'programming-concepts',
      'it-infrastructure-devops',
      'linux',
      'windows',
      'cross_platform',
    ];

    for (const s of defaultSubjects) {
      subjectBreakdown[s] = {
        subject: s,
        totalQuestions: 0,
        totalTopics: 0,
        attemptedQuestions: 0,
        correctAnswers: 0,
        accuracyPct: 0,
        coveragePct: 0,
      };
      topicsBySubject[s] = new Set();
      attemptedBySubject[s] = new Set();
    }

    for (const q of questions) {
      const s = q.subject || 'cosa';
      if (!subjectBreakdown[s]) {
        subjectBreakdown[s] = {
          subject: s,
          totalQuestions: 0,
          totalTopics: 0,
          attemptedQuestions: 0,
          correctAnswers: 0,
          accuracyPct: 0,
          coveragePct: 0,
        };
        topicsBySubject[s] = new Set();
        attemptedBySubject[s] = new Set();
      }

      subjectBreakdown[s].totalQuestions++;
      topicsBySubject[s].add(q.topic);
      if (distinctAttemptedIds.has(q.question_id)) {
        attemptedBySubject[s].add(q.question_id);
      }
    }

    for (const [subKey, stats] of Object.entries(subjectBreakdown)) {
      const s = subKey as Subject;
      stats.totalTopics = topicsBySubject[s].size;
      stats.attemptedQuestions = attemptedBySubject[s].size;
      stats.coveragePct = stats.totalQuestions > 0 ? Math.round((stats.attemptedQuestions / stats.totalQuestions) * 100) : 0;

      // Calculate accuracy for subject
      let subAttemptCount = 0;
      let subCorrectCount = 0;
      for (const att of attempts) {
        for (const item of att.items) {
          const q = questionMap.get(item.questionId) || item.originalQuestion;
          if (q.subject === s && item.selectedOptionId) {
            subAttemptCount++;
            if (item.selectedOptionId === q.correct_option_id) {
              subCorrectCount++;
            }
          }
        }
      }
      stats.correctAnswers = subCorrectCount;
      stats.accuracyPct = subAttemptCount > 0 ? Math.round((subCorrectCount / subAttemptCount) * 100) : 0;
    }

    // Topic breakdown and meaningful weak topics
    const topicBreakdown: TopicAnalytics[] = [];
    const topicQuestionCounts: Record<string, { total: number; subject: Subject }> = {};

    for (const q of questions) {
      if (!topicQuestionCounts[q.topic]) {
        topicQuestionCounts[q.topic] = { total: 0, subject: q.subject };
      }
      topicQuestionCounts[q.topic].total++;
    }

    for (const [topicName, info] of Object.entries(topicQuestionCounts)) {
      const attStats = topicAttemptMap[topicName] || { total: 0, correct: 0, subject: info.subject };
      const accuracy = attStats.total > 0 ? Math.round((attStats.correct / attStats.total) * 100) : 0;
      // Meaningful weak topic criterion: attempted at least 3 times and accuracy < 65%
      const isWeak = attStats.total >= 3 && accuracy < 65;

      topicBreakdown.push({
        topic: topicName,
        subject: info.subject,
        totalQuestions: info.total,
        attempted: attStats.total,
        correct: attStats.correct,
        accuracyPct: accuracy,
        isWeakArea: isWeak,
      });
    }

    const weakTopics = topicBreakdown
      .filter((t) => t.isWeakArea)
      .sort((a, b) => a.accuracyPct - b.accuracyPct || b.attempted - a.attempted);

    // Frequently missed questions
    const frequentlyMissedQuestions = Object.entries(questionMissCounts)
      .map(([qId, count]) => ({
        question: questionMap.get(qId)!,
        missCount: count,
      }))
      .filter((item) => item.question)
      .sort((a, b) => b.missCount - a.missCount)
      .slice(0, 10);

    // Timeline data (aggregated by date)
    const dateMap: Record<string, { count: number; totalScore: number; completedCount: number; questionCount: number }> = {};
    for (const a of attempts) {
      const date = a.startedAt.split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { count: 0, totalScore: 0, completedCount: 0, questionCount: 0 };
      }
      dateMap[date].count++;
      dateMap[date].questionCount += a.totalQuestions;
      if (a.score) {
        dateMap[date].totalScore += a.score.accuracyPct;
        dateMap[date].completedCount++;
      }
    }

    const timelineData = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // last 14 active days
      .map(([date, d]) => ({
        date,
        attempts: d.count,
        scoreAvg: d.completedCount > 0 ? Math.round(d.totalScore / d.completedCount) : 0,
        questionCount: d.questionCount,
      }));

    // Difficulty breakdown
    const difficultyBreakdown: Record<Difficulty, { total: number; attempted: number; correct: number; accuracyPct: number }> = {
      foundational: {
        total: diffStats.foundational.total,
        attempted: diffStats.foundational.attempted,
        correct: diffStats.foundational.correct,
        accuracyPct:
          diffStats.foundational.attempted > 0
            ? Math.round((diffStats.foundational.correct / diffStats.foundational.attempted) * 100)
            : 0,
      },
      intermediate: {
        total: diffStats.intermediate.total,
        attempted: diffStats.intermediate.attempted,
        correct: diffStats.intermediate.correct,
        accuracyPct:
          diffStats.intermediate.attempted > 0
            ? Math.round((diffStats.intermediate.correct / diffStats.intermediate.attempted) * 100)
            : 0,
      },
      advanced: {
        total: diffStats.advanced.total,
        attempted: diffStats.advanced.attempted,
        correct: diffStats.advanced.correct,
        accuracyPct:
          diffStats.advanced.attempted > 0
            ? Math.round((diffStats.advanced.correct / diffStats.advanced.attempted) * 100)
            : 0,
      },
    };

    return {
      totalQuestions,
      distinctAttemptedQuestions: distinctAttemptedIds.size,
      totalAttempts,
      completedAttempts,
      overallAccuracyPct,
      studyStreakDays,
      trendPct,
      subjectBreakdown,
      topicBreakdown,
      weakTopics,
      difficultyBreakdown,
      timelineData,
      frequentlyMissedQuestions,
    };
  }
}
