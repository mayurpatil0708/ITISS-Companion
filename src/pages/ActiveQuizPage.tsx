import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Flag,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useApp } from '@/context/AppContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { QuizService } from '@/services/quiz/quiz.service';
import { AttemptRecord, QuizQuestionItem, QuestionOption } from '@/types';

export const ActiveQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toggleBookmark, isBookmarked, addNotification } = useApp();

  const [attempt, setAttempt] = useState<AttemptRecord | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showNavigatorDrawer, setShowNavigatorDrawer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-save timer tick
  useEffect(() => {
    let interval: any;
    if (attempt && !attempt.isCompleted && !isTimerPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attempt, isTimerPaused]);

  // Load attempt from database
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!quizId) return;
      try {
        const loaded = await questionRepository.getAttemptById(quizId);
        if (!loaded) {
          alert('Attempt not found');
          navigate('/');
          return;
        }

        if (loaded.isCompleted) {
          navigate(`/results/${loaded.id}`, { replace: true });
          return;
        }

        if (isMounted) {
          setAttempt(loaded);
          setElapsedSeconds(loaded.timeSpentSeconds || 0);
          // Default to first unanswered or index 0
          const firstUnanswered = loaded.items.findIndex((item) => !item.selectedOptionId);
          setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);
        }
      } catch (err) {
        console.error('Failed to load quiz attempt', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [quizId, navigate]);

  // Persist attempt progress to storage periodically and before unloading
  const persistProgress = useCallback(
    async (currentAttempt: AttemptRecord, timeSpent: number) => {
      const updated: AttemptRecord = {
        ...currentAttempt,
        timeSpentSeconds: timeSpent,
      };
      await questionRepository.saveAttempt(updated);
    },
    []
  );

  // Persist on elapsed time changes (every 5 seconds)
  useEffect(() => {
    if (attempt && !attempt.isCompleted && elapsedSeconds > 0 && elapsedSeconds % 5 === 0) {
      persistProgress(attempt, elapsedSeconds);
    }
  }, [elapsedSeconds, attempt, persistProgress]);

  // Handle keyboard shortcuts (1-4, A-D, ArrowLeft/ArrowRight, M for mark, B for bookmark)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or modal is open
      if (showSubmitModal) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key.toUpperCase();
      if (['1', 'A'].includes(key)) handleSelectOption('A');
      else if (['2', 'B'].includes(key)) handleSelectOption('B');
      else if (['3', 'C'].includes(key)) handleSelectOption('C');
      else if (['4', 'D'].includes(key)) handleSelectOption('D');
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (key === 'M') handleToggleMarkForReview();
      else if (key === 'K') {
        if (currentItem) toggleBookmark(currentItem.questionId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (isLoading || !attempt) {
    return (
      <div className="py-20 text-center animate-pulse">
        <div className="w-10 h-10 border-2 border-nexus-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-nexus-text-secondary">Loading examination environment...</p>
      </div>
    );
  }

  const items = attempt.items;
  const currentItem = items[currentIndex];
  const q = currentItem?.originalQuestion;

  const answeredCount = items.filter((i) => i.selectedOptionId !== null).length;
  const markedCount = items.filter((i) => i.isMarkedForReview).length;
  const progressPercent = Math.round((answeredCount / items.length) * 100);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectOption = async (optionId: string) => {
    if (!currentItem) return;

    // Toggle if same option clicked, or select new
    const updatedItems = [...items];
    const newSelected = currentItem.selectedOptionId === optionId ? null : optionId;
    updatedItems[currentIndex] = {
      ...currentItem,
      selectedOptionId: newSelected,
    };

    const updatedAttempt: AttemptRecord = {
      ...attempt,
      items: updatedItems,
      timeSpentSeconds: elapsedSeconds,
    };

    setAttempt(updatedAttempt);
    await questionRepository.saveAttempt(updatedAttempt);
  };

  const handleToggleMarkForReview = async () => {
    if (!currentItem) return;

    const updatedItems = [...items];
    updatedItems[currentIndex] = {
      ...currentItem,
      isMarkedForReview: !currentItem.isMarkedForReview,
    };

    const updatedAttempt: AttemptRecord = {
      ...attempt,
      items: updatedItems,
      timeSpentSeconds: elapsedSeconds,
    };

    setAttempt(updatedAttempt);
    await questionRepository.saveAttempt(updatedAttempt);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save final time spent
      await persistProgress(attempt, elapsedSeconds);
      const finished = await QuizService.submitAttempt(attempt.id);
      navigate(`/results/${finished.id}`, { replace: true });
    } catch (err: unknown) {
      console.error('Submission failed', err);
      alert(err instanceof Error ? err.message : 'Submission failed');
      setIsSubmitting(false);
    }
  };

  // Helper for navigator button status
  const getNavStatus = (item: QuizQuestionItem, index: number) => {
    const isCurrent = index === currentIndex;
    const isAnswered = item.selectedOptionId !== null;
    const isMarked = item.isMarkedForReview;

    let bgClass = 'bg-nexus-elevated/40 border-nexus-border text-nexus-text-secondary';
    if (isAnswered && isMarked) {
      bgClass = 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold';
    } else if (isMarked) {
      bgClass = 'bg-nexus-warning/15 border-nexus-warning text-nexus-warning';
    } else if (isAnswered) {
      bgClass = 'bg-nexus-accent/20 border-nexus-accent text-nexus-accent font-semibold';
    }

    if (isCurrent) {
      bgClass += ' ring-2 ring-white ring-offset-1 ring-offset-nexus-bg';
    }

    return bgClass;
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16 max-w-7xl mx-auto">
      {/* 1. Quiz Header Bar */}
      <div className="p-4 rounded-lg bg-nexus-surface border border-nexus-border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-subtle">
        {/* Left: Metadata & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNavigatorDrawer(!showNavigatorDrawer)}
            className="lg:hidden p-2 rounded bg-nexus-elevated border border-nexus-border text-nexus-text-secondary hover:text-nexus-text"
            aria-label="Toggle Question Navigator"
          >
            {showNavigatorDrawer ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-nexus-cyan uppercase">
                {attempt.title}
              </span>
              <Badge variant={attempt.mode === 'exam' ? 'warning' : 'primary'}>
                {attempt.mode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
              </Badge>
            </div>
            <div className="text-xs text-nexus-text-muted mt-0.5 truncate max-w-md">
              Question {currentIndex + 1} of {items.length} • {q?.topic}
            </div>
          </div>
        </div>

        {/* Center: Progress & Counts */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-nexus-text">
            <span className="text-nexus-accent font-bold">{answeredCount}</span>
            <span className="text-nexus-text-muted">/</span>
            <span>{items.length} Answered</span>
          </div>
          {markedCount > 0 && (
            <div className="flex items-center gap-1 text-amber-400">
              <Flag className="w-3.5 h-3.5" />
              <span>{markedCount} Flagged</span>
            </div>
          )}
        </div>

        {/* Right: Timer & Submit Action */}
        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-nexus-elevated border border-nexus-border text-xs font-mono text-nexus-text">
            <Clock className="w-3.5 h-3.5 text-nexus-cyan" />
            <span>{formatTimer(elapsedSeconds)}</span>
            <button
              onClick={() => setIsTimerPaused(!isTimerPaused)}
              className="ml-1 text-nexus-text-muted hover:text-nexus-text"
              title={isTimerPaused ? 'Resume timer' : 'Pause timer'}
            >
              {isTimerPaused ? <Play className="w-3 h-3 text-nexus-success" /> : <Pause className="w-3 h-3" />}
            </button>
          </div>

          <Button
            variant="cyan"
            size="sm"
            icon={<Send className="w-3.5 h-3.5" />}
            onClick={() => setShowSubmitModal(true)}
          >
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-nexus-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-nexus-accent to-nexus-cyan transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. Main Three-Part Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Question Navigator (Desktop persistent, Mobile expandable) */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            showNavigatorDrawer ? 'block' : 'hidden lg:block'
          }`}
        >
          <Card padding="md" className="sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-nexus-text uppercase tracking-wider">
                Question Navigator
              </span>
              <span className="text-[11px] font-mono text-nexus-text-muted">
                {items.length} Items
              </span>
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-1.5 max-h-[50vh] overflow-y-auto p-1">
              {items.map((item, idx) => {
                const navClass = getNavStatus(item, idx);
                return (
                  <button
                    key={item.questionId}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowNavigatorDrawer(false);
                    }}
                    className={`h-8 rounded text-xs font-mono transition-all flex items-center justify-center relative border ${navClass}`}
                    title={`Question ${idx + 1}: ${item.selectedOptionId ? 'Answered' : 'Unanswered'}`}
                  >
                    <span>{idx + 1}</span>
                    {item.isMarkedForReview && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigator Legend */}
            <div className="mt-4 pt-3 border-t border-nexus-border space-y-1.5 text-[10px] font-mono text-nexus-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-nexus-accent/20 border border-nexus-accent inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-nexus-warning/15 border border-nexus-warning inline-block" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500 inline-block" />
                <span>Answered & Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-nexus-elevated/40 border border-nexus-border inline-block" />
                <span>Unanswered</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Center Column: Question Card & Answer Options (Primary Focus) */}
        <div className="lg:col-span-6 space-y-4">
          <Card variant="elevated" padding="lg" className="border-t-2 border-t-nexus-accent">
            {/* Question Top Metadata & Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-nexus-border mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-nexus-accent px-2 py-0.5 rounded bg-nexus-accent/10 border border-nexus-accent/20">
                  {q?.question_id}
                </span>
                <Badge variant="default">{q?.difficulty}</Badge>
                <Badge variant="cyan">{q?.question_type}</Badge>
              </div>

              {/* Bookmark & Review Flag buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => q && toggleBookmark(q.question_id)}
                  className={`p-1.5 rounded border transition-colors ${
                    q && isBookmarked(q.question_id)
                      ? 'bg-nexus-accent/15 border-nexus-accent text-nexus-accent'
                      : 'border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated'
                  }`}
                  title={q && isBookmarked(q.question_id) ? 'Remove bookmark' : 'Bookmark for review'}
                  aria-label="Bookmark question"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleMarkForReview}
                  className={`p-1.5 rounded border transition-colors ${
                    currentItem.isMarkedForReview
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated'
                  }`}
                  title="Mark for review"
                  aria-label="Mark question for review"
                >
                  <Flag className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-semibold text-nexus-text leading-relaxed mb-6">
              {q?.question_text}
            </div>

            {/* Four Answer Options (A, B, C, D) */}
            <div className="space-y-3" role="radiogroup" aria-label="Answer options">
              {currentItem.displayOptions.map((opt: QuestionOption, optIdx: number) => {
                const isSelected = currentItem.selectedOptionId === opt.id;
                // In Practice mode, reveal feedback immediately if user made a choice
                const isPracticeMode = attempt.mode === 'practice';
                const hasAnswered = currentItem.selectedOptionId !== null;
                const isCorrect = opt.id === q?.correct_option_id;

                let optionStyles = 'bg-nexus-elevated/40 border-nexus-border text-nexus-text hover:bg-nexus-elevated hover:border-nexus-accent/40';

                if (isSelected) {
                  optionStyles = 'bg-nexus-accent/15 border-nexus-accent text-nexus-text ring-1 ring-nexus-accent shadow-xs';
                }

                if (isPracticeMode && hasAnswered) {
                  if (isCorrect) {
                    optionStyles = 'bg-nexus-success/15 border-nexus-success text-nexus-text ring-1 ring-nexus-success';
                  } else if (isSelected && !isCorrect) {
                    optionStyles = 'bg-nexus-error/15 border-nexus-error text-nexus-text ring-1 ring-nexus-error';
                  }
                }

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3.5 ${optionStyles}`}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                  >
                    {/* Option letter pill */}
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-nexus-accent text-white'
                          : 'bg-nexus-surface border border-nexus-border text-nexus-text-secondary'
                      }`}
                    >
                      {opt.id}
                    </div>

                    {/* Option Text */}
                    <div className="flex-1 text-sm text-nexus-text leading-normal pt-0.5">
                      {opt.text}
                    </div>

                    {/* Practice mode icon indicators */}
                    {isPracticeMode && hasAnswered && (
                      <div className="flex-shrink-0 pt-0.5">
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-nexus-success" />}
                        {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-nexus-error" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* In Practice Mode: Immediate Distractor & Explanation Feedback */}
            {attempt.mode === 'practice' && currentItem.selectedOptionId !== null && (
              <div className="mt-6 p-4 rounded-lg bg-nexus-elevated border border-nexus-border animate-fadeIn space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-nexus-cyan" />
                  <span className="text-xs font-semibold text-nexus-text uppercase tracking-wider">
                    Detailed Explanation
                  </span>
                </div>
                <p className="text-xs text-nexus-text leading-relaxed">
                  {q?.explanation}
                </p>

                {/* Distractor explanations if available */}
                {q?.option_explanations && (
                  <div className="mt-3 pt-3 border-t border-nexus-border space-y-1.5 text-xs text-nexus-text-secondary">
                    {Object.entries(q.option_explanations).map(([optId, exp]) => (
                      <div key={optId} className="flex items-start gap-2">
                        <span className="font-mono font-bold text-nexus-text-muted">[{optId}]</span>
                        <span>{exp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Nav: Prev / Next */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-nexus-border">
              <Button
                variant="outline"
                size="md"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <div className="text-xs font-mono text-nexus-text-muted hidden sm:block">
                Use Keys 1-4 to choose, Arrows to navigate
              </div>

              {currentIndex === items.length - 1 ? (
                <Button
                  variant="cyan"
                  size="md"
                  onClick={() => setShowSubmitModal(true)}
                  icon={<Send className="w-4 h-4" />}
                >
                  Review & Submit
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  icon={<ChevronRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Next
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Contextual Reference, Source Verification & Shortkeys */}
        <div className="lg:col-span-3 space-y-4">
          {/* Syllabus Section Info */}
          <Card padding="md">
            <h4 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-nexus-cyan" />
              Domain Reference
            </h4>
            <div className="space-y-2 text-xs text-nexus-text-secondary">
              <div>
                <span className="text-[11px] text-nexus-text-muted block">Curriculum Subject</span>
                <span className="text-nexus-text font-medium capitalize">
                  {q?.subject.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-nexus-text-muted block">Topic</span>
                <span className="text-nexus-text font-medium">{q?.topic}</span>
              </div>
              <div>
                <span className="text-[11px] text-nexus-text-muted block">Subtopic</span>
                <span className="text-nexus-text font-medium">{q?.subtopic}</span>
              </div>
              {q?.source?.document_id && (
                <div className="pt-2 border-t border-nexus-border">
                  <span className="text-[11px] text-nexus-text-muted block">Verified CDAC Source</span>
                  <span className="font-mono text-[11px] text-nexus-cyan">
                    {q.source.document_id} {q.source.pdf_page_start ? `(Pages ${q.source.pdf_page_start}-${q.source.pdf_page_end})` : ''}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Keyboard Reference Card */}
          <Card padding="md" className="bg-nexus-elevated/30">
            <h4 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-2">
              Keyboard Shortcuts
            </h4>
            <div className="space-y-1.5 text-xs text-nexus-text-secondary font-mono">
              <div className="flex justify-between">
                <span>1, 2, 3, 4</span>
                <span className="text-nexus-text">Select A, B, C, D</span>
              </div>
              <div className="flex justify-between">
                <span>← / →</span>
                <span className="text-nexus-text">Prev / Next</span>
              </div>
              <div className="flex justify-between">
                <span>M</span>
                <span className="text-nexus-text">Flag for Review</span>
              </div>
              <div className="flex justify-between">
                <span>K</span>
                <span className="text-nexus-text">Toggle Bookmark</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Exam Submission Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Examination Submission"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-nexus-text-secondary leading-relaxed">
            Please review your completion status before finalizing this attempt. Once submitted, your answers will be evaluated and recorded into your performance profile.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded bg-nexus-elevated border border-nexus-border">
              <span className="text-nexus-text-muted block">TOTAL QUESTIONS</span>
              <span className="text-lg font-bold text-nexus-text">{items.length}</span>
            </div>
            <div className="p-3 rounded bg-nexus-elevated border border-nexus-border">
              <span className="text-nexus-text-muted block">ANSWERED</span>
              <span className="text-lg font-bold text-nexus-accent">{answeredCount}</span>
            </div>
            <div className="p-3 rounded bg-nexus-elevated border border-nexus-border">
              <span className="text-nexus-text-muted block">UNANSWERED</span>
              <span className="text-lg font-bold text-nexus-error">
                {items.length - answeredCount}
              </span>
            </div>
            <div className="p-3 rounded bg-nexus-elevated border border-nexus-border">
              <span className="text-nexus-text-muted block">FLAGGED FOR REVIEW</span>
              <span className="text-lg font-bold text-amber-400">{markedCount}</span>
            </div>
          </div>

          {items.length - answeredCount > 0 && (
            <div className="p-3 rounded bg-nexus-warning/15 border border-nexus-warning/40 flex items-start gap-2.5 text-xs text-nexus-warning">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> You have {items.length - answeredCount} unanswered questions remaining. You can return to the examination to complete them.
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-nexus-border">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowSubmitModal(false)}
            >
              Return to Exam
            </Button>
            <Button
              variant="cyan"
              size="md"
              isLoading={isSubmitting}
              onClick={handleFinalSubmit}
            >
              Submit & View Results
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
