import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Bookmark,
  AlertCircle,
  Sparkles,
  Play,
  Terminal,
  Server,
  Layers,
  Search,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useApp } from '@/context/AppContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { QuizService } from '@/services/quiz/quiz.service';
import { Question, Subject, Difficulty } from '@/types';

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookmarks, toggleBookmark, isBookmarked } = useApp();

  const [activeTab, setActiveTab] = useState<'incorrect' | 'bookmarked'>('incorrect');
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [incorrectQuestionIds, setIncorrectQuestionIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [questions, attempts] = await Promise.all([
          questionRepository.getAllQuestions(),
          questionRepository.getAllAttempts(),
        ]);

        // Gather all questions that were ever answered incorrectly
        const missed = new Set<string>();
        for (const att of attempts) {
          for (const item of att.items) {
            if (item.selectedOptionId && item.selectedOptionId !== item.originalQuestion.correct_option_id) {
              missed.add(item.questionId);
            }
          }
        }

        if (isMounted) {
          setAllQuestions(questions);
          setIncorrectQuestionIds(Array.from(missed));
        }
      } catch (err) {
        console.error('Failed to load review items', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const questionMap = useMemo(() => {
    return new Map(allQuestions.map((q) => [q.question_id, q]));
  }, [allQuestions]);

  const targetQuestions = useMemo(() => {
    const ids = activeTab === 'incorrect' ? incorrectQuestionIds : Array.from(bookmarks);
    let list = ids.map((id) => questionMap.get(id)).filter((q): q is Question => q !== undefined);

    if (subjectFilter !== 'all') {
      list = list.filter((q) => q.subject === subjectFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (q) =>
          q.question_id.toLowerCase().includes(query) ||
          q.question_text.toLowerCase().includes(query) ||
          q.topic.toLowerCase().includes(query)
      );
    }

    return list;
  }, [activeTab, incorrectQuestionIds, bookmarks, questionMap, subjectFilter, searchQuery]);

  const startTargetedPractice = async () => {
    if (targetQuestions.length === 0) return;

    try {
      const attempt = await QuizService.createAttempt({
        subject: subjectFilter,
        topics: [],
        difficulty: 'mixed',
        questionCount: targetQuestions.length,
        selection: activeTab === 'incorrect' ? 'incorrect' : 'bookmarked',
        mode: 'practice',
        randomizeQuestions: true,
        randomizeOptions: true,
      });

      navigate(`/quiz/${attempt.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to launch targeted session');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">Remediation Suite</Badge>
            <span className="text-xs font-mono text-nexus-text-muted">Mistakes & Targeted Recall</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight mt-1">
            Review & Remediation Hub
          </h1>
          <p className="text-xs sm:text-sm text-nexus-text-secondary mt-1">
            Isolate incorrectly answered test items and starred concepts to reinforce system administration mastery.
          </p>
        </div>

        {targetQuestions.length > 0 && (
          <Button
            variant="cyan"
            size="md"
            icon={<Play className="w-4 h-4 fill-current" />}
            onClick={startTargetedPractice}
          >
            Practice Selected ({targetQuestions.length})
          </Button>
        )}
      </div>

      {/* Tabs & Controls */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Tab Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('incorrect')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-medium transition-all ${
                activeTab === 'incorrect'
                  ? 'bg-nexus-accent text-white font-semibold shadow-xs'
                  : 'bg-nexus-elevated text-nexus-text-secondary hover:text-nexus-text'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Incorrect Questions ({incorrectQuestionIds.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarked')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-medium transition-all ${
                activeTab === 'bookmarked'
                  ? 'bg-nexus-accent text-white font-semibold shadow-xs'
                  : 'bg-nexus-elevated text-nexus-text-secondary hover:text-nexus-text'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarked Questions ({bookmarks.size})</span>
            </button>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'linux', label: 'Linux' },
              { id: 'windows', label: 'Windows' },
              { id: 'cross_platform', label: 'Cross-plat' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSubjectFilter(sub.id as any)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  subjectFilter === sub.id
                    ? 'bg-nexus-elevated border border-nexus-accent text-nexus-accent font-semibold'
                    : 'bg-nexus-elevated/40 text-nexus-text-muted hover:text-nexus-text'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative pt-2 border-t border-nexus-border">
          <Search className="w-4 h-4 text-nexus-text-muted absolute left-3 top-4.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${activeTab} items by text, question ID or topic...`}
            className="w-full bg-nexus-elevated border border-nexus-border rounded pl-9 pr-3 py-1.5 text-xs text-nexus-text placeholder:text-nexus-text-muted focus:outline-none focus:border-nexus-accent"
          />
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {targetQuestions.length === 0 ? (
          <div className="py-16 text-center text-xs text-nexus-text-muted bg-nexus-elevated/20 rounded border border-dashed border-nexus-border">
            {activeTab === 'incorrect' ? (
              <div>
                <CheckCircle2 className="w-8 h-8 text-nexus-success mx-auto mb-2" />
                <p className="font-semibold text-nexus-text">No Recorded Mistakes</p>
                <p className="text-[11px] text-nexus-text-muted mt-1">
                  You have not answered any questions incorrectly yet, or all mistakes have been cleared.
                </p>
              </div>
            ) : (
              <div>
                <Bookmark className="w-8 h-8 text-nexus-accent/50 mx-auto mb-2" />
                <p className="font-semibold text-nexus-text">No Bookmarked Questions</p>
                <p className="text-[11px] text-nexus-text-muted mt-1">
                  Use the bookmark icon during practice or in the question bank to save items here.
                </p>
              </div>
            )}
          </div>
        ) : (
          targetQuestions.map((q) => (
            <Card key={q.question_id} padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-nexus-accent">{q.question_id}</span>
                  <Badge variant="default">{q.difficulty}</Badge>
                  <Badge variant="cyan">{q.topic}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleBookmark(q.question_id)}
                    className={`p-1.5 rounded border transition-colors ${
                      isBookmarked(q.question_id)
                        ? 'bg-nexus-accent/15 border-nexus-accent text-nexus-accent'
                        : 'border-nexus-border text-nexus-text-muted hover:text-nexus-text'
                    }`}
                    title={isBookmarked(q.question_id) ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm font-semibold text-nexus-text leading-relaxed">
                {q.question_text}
              </p>

              {/* Correct Option Display */}
              <div className="p-2.5 rounded bg-nexus-elevated/50 border border-nexus-border text-xs flex items-center justify-between">
                <span className="text-nexus-text-muted">
                  Correct Answer: <strong className="text-nexus-success">Option {q.correct_option_id}</strong> - {q.options.find((o) => o.id === q.correct_option_id)?.text}
                </span>
                <span className="font-mono text-[11px] text-nexus-cyan">
                  {q.estimated_time_seconds || 60}s target
                </span>
              </div>

              {/* Quick rationale */}
              <p className="text-xs text-nexus-text-secondary leading-normal">
                {q.explanation}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
