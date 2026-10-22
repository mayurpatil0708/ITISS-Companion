import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Terminal,
  Server,
  Layers,
  Search,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { AnalyticsService } from '@/services/analytics/analytics.service';
import { TopicItem, Question, Subject, Difficulty } from '@/types';

interface TopicNodeData {
  topic_id: string;
  topic: string;
  subject: Subject;
  questions: Question[];
  subtopics: {
    subtopic_id: string;
    subtopic: string;
    description?: string;
    questions: Question[];
  }[];
  difficultyCounts: Record<Difficulty, number>;
  attemptCount: number;
  accuracyPct: number;
}

export const TopicExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const { moduleSlug } = useParams<{ moduleSlug?: string }>();

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (moduleSlug) {
      if (moduleSlug === 'fcn' || moduleSlug === 'fundamental-computer-networks') {
        setSubjectFilter('fundamental-computer-networks');
      } else if (moduleSlug === 'pc' || moduleSlug === 'programming-concepts') {
        setSubjectFilter('programming-concepts');
      } else if (moduleSlug === 'cosa') {
        setSubjectFilter('cosa');
      } else if (moduleSlug === 'itid' || moduleSlug === 'iimd' || moduleSlug === 'it-infrastructure-devops') {
        setSubjectFilter('it-infrastructure-devops');
      }
    }
  }, [moduleSlug]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [allTopics, allQuestions] = await Promise.all([
          questionRepository.getAllTopics(),
          questionRepository.getAllQuestions(),
        ]);
        if (isMounted) {
          setTopics(allTopics);
          setQuestions(allQuestions);
          // Expand first 2 topics by default
          if (allTopics.length > 0) {
            setExpandedTopics(new Set(allTopics.slice(0, 2).map((t) => t.topic_id)));
          }
        }
      } catch (err) {
        console.error('Failed to load topic hierarchy', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Organize questions into topic hierarchy
  const hierarchyNodes = useMemo(() => {
    const questionByTopicId = new Map<string, Question[]>();
    const questionByTopicName = new Map<string, Question[]>();

    for (const q of questions) {
      if (!questionByTopicId.has(q.topic_id)) questionByTopicId.set(q.topic_id, []);
      questionByTopicId.get(q.topic_id)!.push(q);

      if (!questionByTopicName.has(q.topic)) questionByTopicName.set(q.topic, []);
      questionByTopicName.get(q.topic)!.push(q);
    }

    const nodes: TopicNodeData[] = topics.map((t) => {
      const topicQuestions = questionByTopicId.get(t.topic_id) || questionByTopicName.get(t.topic) || [];

      // Map subtopics
      const subtopics = t.subtopics.map((st) => {
        const subQuestions = topicQuestions.filter(
          (q) => q.subtopic_id === st.subtopic_id || q.subtopic === st.subtopic
        );
        return {
          subtopic_id: st.subtopic_id,
          subtopic: st.subtopic,
          description: st.description,
          questions: subQuestions,
        };
      });

      const difficultyCounts: Record<Difficulty, number> = {
        foundational: 0,
        intermediate: 0,
        advanced: 0,
      };

      for (const q of topicQuestions) {
        if (difficultyCounts[q.difficulty] !== undefined) {
          difficultyCounts[q.difficulty]++;
        }
      }

      return {
        topic_id: t.topic_id,
        topic: t.topic,
        subject: t.subject,
        questions: topicQuestions,
        subtopics,
        difficultyCounts,
        attemptCount: 0,
        accuracyPct: 0,
      };
    });

    return nodes;
  }, [topics, questions]);

  // Filter hierarchy nodes by subject, search, and difficulty
  const filteredNodes = useMemo(() => {
    return hierarchyNodes.filter((node) => {
      if (subjectFilter !== 'all') {
        if (subjectFilter === 'cosa') {
          if (node.subject !== 'cosa' && node.subject !== 'linux' && node.subject !== 'windows' && node.subject !== 'cross_platform') return false;
        } else if (subjectFilter === 'fundamental-computer-networks') {
          if (node.subject !== 'fundamental-computer-networks' && node.subject !== 'fcn') return false;
        } else if (subjectFilter === 'programming-concepts') {
          if (node.subject !== 'programming-concepts' && node.subject !== 'pc') return false;
        } else if (subjectFilter === 'it-infrastructure-devops') {
          if (node.subject !== 'it-infrastructure-devops' && node.subject !== 'itid' && node.subject !== 'iimd') return false;
        } else if (node.subject !== subjectFilter) {
          return false;
        }
      }

      if (difficultyFilter !== 'all' && node.difficultyCounts[difficultyFilter] === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = node.topic.toLowerCase().includes(q) || node.topic_id.toLowerCase().includes(q);
        const matchesSubtopic = node.subtopics.some(
          (st) => st.subtopic.toLowerCase().includes(q) || (st.description && st.description.toLowerCase().includes(q))
        );
        const matchesQuestions = node.questions.some((item) => (item.question_text || item.question || '').toLowerCase().includes(q));
        if (!matchesTopic && !matchesSubtopic && !matchesQuestions) return false;
      }

      return true;
    });
  }, [hierarchyNodes, subjectFilter, difficultyFilter, searchQuery]);

  const toggleExpand = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTopics(new Set(filteredNodes.map((n) => n.topic_id)));
  };

  const collapseAll = () => {
    setExpandedTopics(new Set());
  };

  const startTopicPractice = (topicName: string, subject: Subject) => {
    navigate('/practice', {
      state: { subject, topics: [topicName] },
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Curriculum Explorer</Badge>
          <span className="text-xs font-mono text-nexus-text-muted">CDAC CMCE Syllabus Structure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight mt-1">
          Topic & Subtopic Explorer
        </h1>
        <p className="text-xs sm:text-sm text-nexus-text-secondary mt-1">
          Navigate the complete pedagogical taxonomy from curriculum subjects down to examinable concepts and live question banks.
        </p>
      </div>

      {/* Filter Toolbar */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Curricula (34 Topics)' },
              { id: 'fundamental-computer-networks', label: 'Networks (FCN - 8)' },
              { id: 'programming-concepts', label: 'Programming (PC - 8)' },
              { id: 'cosa', label: 'Operating Systems (COSA - 8)' },
              { id: 'it-infrastructure-devops', label: 'Infra & DevOps (IIMD - 10)' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSubjectFilter(sub.id as any)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  subjectFilter === sub.id
                    ? 'bg-nexus-accent text-white font-semibold'
                    : 'bg-nexus-elevated text-nexus-text-secondary hover:text-nexus-text'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Expand/Collapse All */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        {/* Search Input & Difficulty Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-nexus-border">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-nexus-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, subtopics, or concepts..."
              className="w-full bg-nexus-elevated border border-nexus-border rounded pl-9 pr-3 py-1.5 text-xs text-nexus-text placeholder:text-nexus-text-muted focus:outline-none focus:border-nexus-accent"
            />
          </div>

          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="w-full bg-nexus-elevated border border-nexus-border rounded px-3 py-1.5 text-xs text-nexus-text focus:outline-none focus:border-nexus-accent"
            >
              <option value="all">Any Difficulty</option>
              <option value="foundational">Foundational</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Hierarchical Topic Tree */}
      <div className="space-y-4">
        {filteredNodes.length === 0 ? (
          <div className="py-16 text-center text-xs text-nexus-text-muted bg-nexus-elevated/20 rounded border border-dashed border-nexus-border">
            No topics match the selected search criteria.
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isExpanded = expandedTopics.has(node.topic_id);
            const questionCount = node.questions.length;
            const hasQuestions = questionCount > 0;

            return (
              <Card
                key={node.topic_id}
                padding="none"
                className={`overflow-hidden border transition-all ${
                  isExpanded ? 'border-nexus-accent/40 shadow-card' : 'border-nexus-border'
                }`}
              >
                {/* Topic Header Row */}
                <div
                  onClick={() => toggleExpand(node.topic_id)}
                  className="p-4 bg-nexus-surface hover:bg-nexus-elevated/40 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-1 rounded text-nexus-text-muted">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>

                    {/* Subject Icon Badge */}
                    <div className="flex items-center gap-2">
                      {node.subject === 'linux' && <Terminal className="w-4 h-4 text-indigo-400" />}
                      {node.subject === 'windows' && <Server className="w-4 h-4 text-cyan-400" />}
                      {node.subject === 'cross_platform' && <Layers className="w-4 h-4 text-emerald-400" />}
                      <span className="font-mono text-xs text-nexus-text-muted">{node.topic_id}</span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-nexus-text truncate">{node.topic}</h3>
                      <span className="text-[11px] text-nexus-text-muted">
                        {node.subtopics.length} Subtopics
                      </span>
                    </div>
                  </div>

                  {/* Right: Question Count & Action */}
                  <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-nexus-text-muted">
                      <span title="Foundational">F:{node.difficultyCounts.foundational}</span>
                      <span>•</span>
                      <span title="Intermediate">I:{node.difficultyCounts.intermediate}</span>
                      <span>•</span>
                      <span title="Advanced">A:{node.difficultyCounts.advanced}</span>
                    </div>

                    <Badge variant={hasQuestions ? 'primary' : 'outline'}>
                      {hasQuestions ? `${questionCount} Questions` : 'Incomplete'}
                    </Badge>

                    {hasQuestions && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Play className="w-3 h-3 fill-current" />}
                        onClick={() => startTopicPractice(node.topic, node.subject)}
                      >
                        Practice
                      </Button>
                    )}
                  </div>
                </div>

                {/* Subtopics Expanded Panel */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-nexus-elevated/30 border-t border-nexus-border space-y-3">
                    {node.subtopics.map((st) => (
                      <div
                        key={st.subtopic_id}
                        className="p-3 rounded bg-nexus-surface border border-nexus-border/60 hover:border-nexus-border transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-nexus-cyan" />
                            <span className="text-xs font-semibold text-nexus-text">{st.subtopic}</span>
                            <span className="font-mono text-[10px] text-nexus-text-muted">[{st.subtopic_id}]</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-mono text-nexus-cyan">
                              {st.questions.length} Questions
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate('/practice', {
                                  state: {
                                    subject: node.subject,
                                    topics: [node.topic],
                                    subtopics: [st.subtopic],
                                  },
                                })
                              }
                            >
                              Practice →
                            </Button>
                          </div>
                        </div>

                        {st.description && (
                          <p className="text-[11px] text-nexus-text-secondary mt-1 leading-normal pl-3.5">
                            {st.description}
                          </p>
                        )}

                        {/* Sample Question Previews if available */}
                        {st.questions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-nexus-border/40 pl-3.5 space-y-1">
                            {st.questions.slice(0, 2).map((sq) => (
                              <div
                                key={sq.question_id}
                                onClick={() => navigate(`/question-bank?id=${sq.question_id}`)}
                                className="text-[11px] text-nexus-text-muted hover:text-nexus-accent cursor-pointer truncate flex items-center gap-1.5"
                              >
                                <span className="font-mono text-nexus-accent">{sq.question_id}:</span>
                                <span>{sq.question_text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
