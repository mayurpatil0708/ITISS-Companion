import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Bookmark,
  Share2,
  ArrowRight,
  BookOpen,
  Filter,
  FileText,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useApp } from '@/context/AppContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { QuizService, QuizScoreBreakdown } from '@/services/quiz/quiz.service';
import { AttemptRecord, QuizQuestionItem, QuestionOption, Difficulty } from '@/types';

export const ResultsPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { preferences, toggleBookmark, isBookmarked } = useApp();

  const [attempt, setAttempt] = useState<AttemptRecord | null>(null);
  const [breakdown, setBreakdown] = useState<QuizScoreBreakdown | null>(null);
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'unanswered' | 'correct' | 'bookmarked'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!attemptId) return;
      try {
        const att = await questionRepository.getAttemptById(attemptId);
        if (!att) {
          alert('Attempt record not found');
          navigate('/');
          return;
        }

        const stats = QuizService.calculateScore(att);
        if (isMounted) {
          setAttempt(att);
          setBreakdown(stats);
        }
      } catch (err) {
        console.error('Failed to load attempt results', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [attemptId, navigate]);

  if (isLoading || !attempt || !breakdown) {
    return (
      <div className="py-20 text-center animate-pulse">
        <div className="w-10 h-10 border-2 border-nexus-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-nexus-text-secondary">Evaluating scorecard and analysis...</p>
      </div>
    );
  }

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const answeredOnlyCount = breakdown.correctCount + breakdown.incorrectCount;
  const answeredAccuracyPct = answeredOnlyCount > 0 ? Math.round((breakdown.correctCount / answeredOnlyCount) * 100) : 0;
  const passedBenchmark = breakdown.accuracyPct >= preferences.practicePassingThreshold;

  // Retry incorrect questions flow
  const handleRetryIncorrect = async () => {
    const incorrectIds = attempt.items
      .filter((item) => item.selectedOptionId && item.selectedOptionId !== item.originalQuestion.correct_option_id)
      .map((item) => item.questionId);

    if (incorrectIds.length === 0) {
      alert('You answered all attempted questions correctly!');
      return;
    }

    try {
      const allQ = await questionRepository.getAllQuestions();
      const qMap = new Map(allQ.map((q) => [q.question_id, q]));
      const incorrectQuestions = incorrectIds.map((id) => qMap.get(id)).filter(Boolean);

      const newAttempt = await QuizService.createAttempt({
        subject: attempt.subjectFilter,
        topics: [],
        difficulty: 'mixed',
        questionCount: incorrectQuestions.length,
        selection: 'incorrect',
        mode: 'practice',
        randomizeQuestions: true,
        randomizeOptions: false,
      });

      navigate(`/quiz/${newAttempt.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to launch retry session');
    }
  };

  // Filter questions list
  const filteredItems = attempt.items.filter((item) => {
    const q = item.originalQuestion;
    const isCorrect = item.selectedOptionId === q.correct_option_id;
    const isUnanswered = item.selectedOptionId === null;

    if (filter === 'incorrect') return item.selectedOptionId !== null && !isCorrect;
    if (filter === 'unanswered') return isUnanswered;
    if (filter === 'correct') return isCorrect;
    if (filter === 'bookmarked') return isBookmarked(q.question_id);
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-16">
      {/* 1. Header & Summary Hero */}
      <div className="p-6 sm:p-8 rounded-lg bg-nexus-surface border border-nexus-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-subtle">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={passedBenchmark ? 'success' : 'warning'}>
              {passedBenchmark ? 'Benchmark Achieved' : 'Review Required'}
            </Badge>
            <span className="text-xs font-mono text-nexus-text-muted">
              {new Date(attempt.startedAt).toLocaleDateString()} • {attempt.mode.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight">
            {attempt.title} Results
          </h1>
          <p className="text-xs sm:text-sm text-nexus-text-secondary leading-relaxed max-w-xl">
            Performance snapshot across {breakdown.total} questions. Benchmark threshold is set to {preferences.practicePassingThreshold}%.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {breakdown.incorrectCount > 0 && (
            <Button
              variant="cyan"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleRetryIncorrect}
            >
              Retry Incorrect ({breakdown.incorrectCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => navigate('/practice')}
          >
            New Practice Session
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Raw Score */}
        <Card padding="md">
          <span className="text-xs font-medium text-nexus-text-secondary block">Score</span>
          <div className="text-2xl font-bold font-mono text-nexus-text mt-1">
            {breakdown.correctCount} <span className="text-sm font-sans text-nexus-text-muted">/ {breakdown.total}</span>
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1">
            {breakdown.accuracyPct}% overall completion
          </div>
        </Card>

        {/* Accuracy among Answered */}
        <Card padding="md">
          <span className="text-xs font-medium text-nexus-text-secondary block">Answered Accuracy</span>
          <div className="text-2xl font-bold font-mono text-nexus-cyan mt-1">
            {answeredAccuracyPct}%
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1">
            {breakdown.correctCount} of {answeredOnlyCount} answered
          </div>
        </Card>

        {/* Correct vs Incorrect */}
        <Card padding="md">
          <span className="text-xs font-medium text-nexus-text-secondary block">Correct / Missed</span>
          <div className="text-2xl font-bold font-mono text-nexus-text mt-1 flex items-center gap-2">
            <span className="text-nexus-success">{breakdown.correctCount}</span>
            <span className="text-nexus-text-muted">/</span>
            <span className="text-nexus-error">{breakdown.incorrectCount}</span>
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1">
            {breakdown.unansweredCount} unanswered
          </div>
        </Card>

        {/* Time Spent */}
        <Card padding="md">
          <span className="text-xs font-medium text-nexus-text-secondary block">Pacing & Duration</span>
          <div className="text-2xl font-bold font-mono text-nexus-text mt-1 flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-nexus-text-muted" />
            <span>{formatDuration(breakdown.timeSpentSeconds)}</span>
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1">
            Avg {breakdown.total > 0 ? Math.round(breakdown.timeSpentSeconds / breakdown.total) : 0}s per question
          </div>
        </Card>
      </div>

      {/* 3. Performance Breakdown (By Topic & By Difficulty) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Topic */}
        <Card padding="md">
          <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-3">
            Performance by Topic
          </h3>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {Object.entries(breakdown.topicBreakdown).map(([topic, stats]) => (
              <div key={topic} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-nexus-text font-medium truncate pr-2">{topic}</span>
                  <span className="font-mono text-nexus-text-muted">
                    {stats.correct}/{stats.total} ({stats.accuracyPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-nexus-elevated overflow-hidden">
                  <div
                    className={`h-full ${
                      stats.accuracyPct >= 70 ? 'bg-nexus-success' : 'bg-nexus-warning'
                    }`}
                    style={{ width: `${stats.accuracyPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* By Difficulty */}
        <Card padding="md">
          <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-3">
            Performance by Difficulty
          </h3>
          <div className="space-y-4">
            {(['foundational', 'intermediate', 'advanced'] as Difficulty[]).map((d) => {
              const stats = breakdown.difficultyBreakdown[d];
              if (!stats || stats.total === 0) return null;
              return (
                <div key={d} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-nexus-text font-medium capitalize">{d}</span>
                    <span className="font-mono text-nexus-text-muted">
                      {stats.correct}/{stats.total} ({stats.accuracyPct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-nexus-elevated overflow-hidden">
                    <div
                      className={`h-full ${
                        stats.accuracyPct >= 70 ? 'bg-nexus-success' : 'bg-nexus-accent'
                      }`}
                      style={{ width: `${stats.accuracyPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 4. Detailed Answer Review List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-nexus-border">
          <div>
            <h2 className="text-lg font-bold text-nexus-text">Item-by-Item Review</h2>
            <p className="text-xs text-nexus-text-secondary">
              Examine user selection, key solutions, and deep distractor rationales
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All (${attempt.items.length})` },
              { id: 'incorrect', label: `Incorrect (${breakdown.incorrectCount})` },
              { id: 'unanswered', label: `Unanswered (${breakdown.unansweredCount})` },
              { id: 'correct', label: `Correct (${breakdown.correctCount})` },
              { id: 'bookmarked', label: 'Bookmarked' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as any)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  filter === f.id
                    ? 'bg-nexus-accent text-white font-semibold'
                    : 'bg-nexus-elevated text-nexus-text-secondary hover:text-nexus-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtered questions cards */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-nexus-text-muted bg-nexus-elevated/30 rounded border border-dashed border-nexus-border">
            No questions match the "{filter}" filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, idx) => {
              const q = item.originalQuestion;
              const isCorrect = item.selectedOptionId === q.correct_option_id;
              const isUnanswered = item.selectedOptionId === null;

              return (
                <Card
                  key={item.questionId}
                  padding="md"
                  className={`border-l-4 ${
                    isUnanswered
                      ? 'border-l-nexus-text-muted'
                      : isCorrect
                      ? 'border-l-nexus-success'
                      : 'border-l-nexus-error'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-nexus-text">
                        {q.question_id}
                      </span>
                      <Badge variant="default">{q.difficulty}</Badge>
                      <Badge variant="cyan">{q.topic}</Badge>
                      {isCorrect && (
                        <span className="text-xs font-mono text-nexus-success flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      )}
                      {!isCorrect && !isUnanswered && (
                        <span className="text-xs font-mono text-nexus-error flex items-center gap-1 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                      {isUnanswered && (
                        <span className="text-xs font-mono text-nexus-text-muted flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Unanswered
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleBookmark(q.question_id)}
                      className={`p-1.5 rounded border transition-colors ${
                        isBookmarked(q.question_id)
                          ? 'bg-nexus-accent/15 border-nexus-accent text-nexus-accent'
                          : 'border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                      }`}
                      title={isBookmarked(q.question_id) ? 'Remove bookmark' : 'Bookmark question'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm font-semibold text-nexus-text leading-relaxed mb-4">
                    {q.question_text}
                  </div>

                  {/* 4 Options breakdown */}
                  <div className="space-y-2 mb-4">
                    {QuizService.sortOptionsCanonically(q.options).map((opt: QuestionOption, optIdx: number) => {
                      const isCandidateChoice = item.selectedOptionId === opt.id;
                      const isCorrectKey = opt.id === q.correct_option_id;
                      const displayLetter = String.fromCharCode(65 + optIdx);

                      let style = 'bg-nexus-elevated/20 border-nexus-border/60 text-nexus-text-secondary';
                      if (isCorrectKey) {
                        style = 'bg-nexus-success/15 border-nexus-success text-nexus-text font-medium';
                      } else if (isCandidateChoice && !isCorrectKey) {
                        style = 'bg-nexus-error/15 border-nexus-error text-nexus-text';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded border text-xs flex items-start gap-2.5 ${style}`}
                        >
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0 ${
                              isCorrectKey
                                ? 'bg-nexus-success text-white'
                                : isCandidateChoice
                                ? 'bg-nexus-error text-white'
                                : 'bg-nexus-surface border border-nexus-border text-nexus-text-muted'
                            }`}
                          >
                            {displayLetter}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                          {isCorrectKey && (
                            <span className="text-[10px] font-mono text-nexus-success font-bold uppercase">
                              Key
                            </span>
                          )}
                          {isCandidateChoice && !isCorrectKey && (
                            <span className="text-[10px] font-mono text-nexus-error uppercase">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanations & Source details */}
                  <div className="p-3 rounded bg-nexus-elevated/40 border border-nexus-border text-xs space-y-2">
                    <div>
                      <span className="font-semibold text-nexus-cyan block mb-1">Concept Explanation</span>
                      <p className="text-nexus-text leading-relaxed">{q.explanation}</p>
                    </div>

                    {q.option_explanations && (
                      <div className="pt-2 border-t border-nexus-border/60 space-y-1 text-nexus-text-secondary">
                        {Object.entries(q.option_explanations).map(([id, exp]) => (
                          <div key={id} className="flex items-start gap-1.5 text-[11px]">
                            <span className="font-mono font-bold text-nexus-text-muted">[{id}]</span>
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.source?.document_id && (
                      <div className="pt-2 border-t border-nexus-border/60 flex items-center justify-between text-[11px] font-mono text-nexus-text-muted">
                        <span>Source: {q.source.document_id}</span>
                        <span>{q.source.section || 'Syllabus reference'}</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
