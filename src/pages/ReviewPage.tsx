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
      if (subjectFilter === 'cosa') {
        list = list.filter((q) => q.subject === 'cosa' || q.subject === 'linux' || q.subject === 'windows' || q.subject === 'cross_platform');
      } else if (subjectFilter === 'fundamental-computer-networks') {
        list = list.filter((q) => q.subject === 'fundamental-computer-networks' || q.subject === 'fcn');
      } else if (subjectFilter === 'programming-concepts') {
        list = list.filter((q) => q.subject === 'programming-concepts' || q.subject === 'pc');
      } else if (subjectFilter === 'it-infrastructure-devops') {
        list = list.filter((q) => q.subject === 'it-infrastructure-devops' || q.subject === 'itid' || q.subject === 'iimd');
      } else {
        list = list.filter((q) => q.subject === subjectFilter);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (q) =>
          q.question_id.toLowerCase().includes(query) ||
          (q.question_text || q.question || '').toLowerCase().includes(query) ||
          (q.topic || '').toLowerCase().includes(query)
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
        randomizeOptions: false,
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
              { id: 'all', label: 'All Modules' },
              { id: 'fundamental-computer-networks', label: 'Networks (FCN)' },
              { id: 'programming-concepts', label: 'Programming (PC)' },
              { id: 'cosa', label: 'Operating Systems (COSA)' },
              { id: 'it-infrastructure-devops', label: 'Infra & DevOps (IIMD)' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSubjectFilter(sub.id as any)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap ${
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

              {/* 4 Answer Options (A, B, C, D) Canonically Ordered */}
              <div className="space-y-2">
                {QuizService.sortOptionsCanonically(q.options).map((opt, optIdx) => {
                  const isKey = opt.id === q.correct_option_id;
                  const displayLetter = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-md border text-xs flex items-start gap-2.5 transition-colors ${
                        isKey
                          ? 'bg-nexus-success/15 border-nexus-success text-nexus-text font-medium'
                          : 'bg-nexus-surface border-nexus-border text-nexus-text-secondary'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0 ${
                          isKey
                            ? 'bg-nexus-success text-white'
                            : 'bg-nexus-elevated border border-nexus-border text-nexus-text-muted'
                        }`}
                      >
                        {displayLetter}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt.text}</span>
                      {isKey && (
                        <span className="text-[10px] font-mono text-nexus-success font-bold uppercase tracking-wider">
                          Correct Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pedagogical Explanation & Distractor Rationales */}
              <div className="p-3.5 rounded-lg bg-nexus-elevated/40 border border-nexus-border text-xs space-y-2 mt-2">
                <div>
                  <span className="font-semibold text-nexus-accent block mb-1">Pedagogical Explanation</span>
                  <p className="text-nexus-text leading-relaxed">{q.explanation}</p>
                </div>

                {q.option_explanations && (
                  <div className="pt-2 border-t border-nexus-border/60 space-y-1.5 text-nexus-text-secondary">
                    {Object.entries(q.option_explanations).map(([id, exp]) => (
                      <div key={id} className="flex items-start gap-2 text-[11px]">
                        <span className="font-mono font-bold text-nexus-text-muted">[{id}]</span>
                        <span className="leading-relaxed">{exp}</span>
                      </div>
                    ))}
                  </div>
                )}

                {q.source?.document_id && (
                  <div className="pt-2 border-t border-nexus-border/60 flex items-center justify-between text-[11px] font-mono text-nexus-text-muted">
                    <span>Verified Source: {q.source.document_id}</span>
                    <span>{q.source.pdf_page_start ? `Pages ${q.source.pdf_page_start}-${q.source.pdf_page_end}` : ''}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
