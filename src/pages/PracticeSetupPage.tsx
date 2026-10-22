import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Sparkles,
  Terminal,
  Server,
  Layers,
  Check,
  Search,
  Sliders,
  Clock,
  Shuffle,
  Eye,
  FileQuestion,
  HelpCircle,
  Play,
  RotateCcw,
  Network,
  Code2,
  Monitor,
  Cloud,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { QuizService, PracticeConfig } from '@/services/quiz/quiz.service';
import { Subject, Difficulty, Question } from '@/types';

interface SubtopicInfo {
  subtopic: string;
  subtopicId?: string;
  count: number;
}

interface TopicGroup {
  topic: string;
  topicId?: string;
  count: number;
  subject: Subject;
  subtopics: SubtopicInfo[];
}

export const PracticeSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectParam } = useParams<{ subjectParam?: string }>();

  // Detect subject from URL query param or path
  const initialSubject: Subject | 'all' = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const querySubject = searchParams.get('subject') || searchParams.get('module');
    if (querySubject) {
      if (querySubject === 'fcn' || querySubject === 'fundamental-computer-networks') return 'fundamental-computer-networks';
      if (querySubject === 'pc' || querySubject === 'programming-concepts') return 'programming-concepts';
      if (querySubject === 'cosa' || querySubject === 'linux' || querySubject === 'windows' || querySubject === 'cross_platform') return 'cosa';
      if (querySubject === 'itid' || querySubject === 'iimd' || querySubject === 'it-infrastructure-devops') return 'it-infrastructure-devops';
      return querySubject as Subject;
    }
    if (location.pathname.includes('/fcn') || location.pathname.includes('/fundamental-computer-networks')) return 'fundamental-computer-networks';
    if (location.pathname.includes('/pc') || location.pathname.includes('/programming-concepts')) return 'programming-concepts';
    if (location.pathname.includes('/cosa') || location.pathname.includes('/linux') || location.pathname.includes('/windows') || location.pathname.includes('/cross-platform')) return 'cosa';
    if (location.pathname.includes('/itid') || location.pathname.includes('/iimd') || location.pathname.includes('/it-infrastructure-devops')) return 'it-infrastructure-devops';
    if (location.state && location.state.subject) return location.state.subject;
    return 'all';
  }, [location]);

  const [subject, setSubject] = useState<Subject | 'all'>(initialSubject);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() => {
    if (location.state && location.state.topics) return location.state.topics;
    return [];
  });
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>(() => {
    if (location.state && location.state.subtopics) return location.state.subtopics;
    return [];
  });
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [topicSearch, setTopicSearch] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'mixed'>('mixed');
  const [selection, setSelection] = useState<
    'all' | 'unseen' | 'incorrect' | 'bookmarked' | 'randomized' | 'previously_attempted'
  >('all');
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [enableTimer, setEnableTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(20);

  // Question bank state
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [availableTopics, setAvailableTopics] = useState<TopicGroup[]>([]);
  const [eligibleCount, setEligibleCount] = useState<number>(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize subject when route changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const querySubject = searchParams.get('subject') || searchParams.get('module');
    if (querySubject) {
      if (querySubject === 'fcn' || querySubject === 'fundamental-computer-networks') setSubject('fundamental-computer-networks');
      else if (querySubject === 'pc' || querySubject === 'programming-concepts') setSubject('programming-concepts');
      else if (querySubject === 'cosa' || querySubject === 'linux' || querySubject === 'windows' || querySubject === 'cross_platform') setSubject('cosa');
      else if (querySubject === 'itid' || querySubject === 'iimd' || querySubject === 'it-infrastructure-devops') setSubject('it-infrastructure-devops');
      else setSubject(querySubject as Subject);
    } else if (location.pathname.includes('/fcn') || location.pathname.includes('/fundamental-computer-networks')) {
      setSubject('fundamental-computer-networks');
    } else if (location.pathname.includes('/pc') || location.pathname.includes('/programming-concepts')) {
      setSubject('programming-concepts');
    } else if (location.pathname.includes('/cosa') || location.pathname.includes('/linux') || location.pathname.includes('/windows') || location.pathname.includes('/cross-platform')) {
      setSubject('cosa');
    } else if (location.pathname.includes('/itid') || location.pathname.includes('/iimd') || location.pathname.includes('/it-infrastructure-devops')) {
      setSubject('it-infrastructure-devops');
    }
  }, [location.pathname, location.search]);

  // Load all questions from repository
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const questions = await questionRepository.getAllQuestions();
        if (isMounted) {
          setAllQuestions(questions);
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute available topics and nested subtopics based on chosen subject
  useEffect(() => {
    const topicMap: Record<
      string,
      {
        count: number;
        subject: Subject;
        topicId?: string;
        subtopics: Record<string, { count: number; subtopicId?: string }>;
      }
    > = {};

    for (const q of allQuestions) {
      const matchesSubject =
        subject === 'all' ||
        q.subject === subject ||
        (subject === 'cosa' && (q.subject === 'linux' || q.subject === 'windows' || q.subject === 'cross_platform')) ||
        (subject === 'fundamental-computer-networks' && q.subject === 'fcn') ||
        (subject === 'programming-concepts' && q.subject === 'pc') ||
        (subject === 'it-infrastructure-devops' && (q.subject === 'iimd' || q.subject === 'itid'));

      if (matchesSubject) {
        const topName = q.topic || 'General';
        if (!topicMap[topName]) {
          topicMap[topName] = {
            count: 0,
            subject: q.subject,
            topicId: q.topic_id || q.topicId,
            subtopics: {},
          };
        }
        topicMap[topName].count++;

        const subName = q.subtopic || topName;
        if (!topicMap[topName].subtopics[subName]) {
          topicMap[topName].subtopics[subName] = {
            count: 0,
            subtopicId: q.subtopic_id || q.subtopicId,
          };
        }
        topicMap[topName].subtopics[subName].count++;
      }
    }

    const list: TopicGroup[] = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      topicId: data.topicId,
      count: data.count,
      subject: data.subject,
      subtopics: Object.entries(data.subtopics)
        .map(([subtopic, subData]) => ({
          subtopic,
          subtopicId: subData.subtopicId,
          count: subData.count,
        }))
        .sort((a, b) => b.count - a.count),
    }));

    setAvailableTopics(list.sort((a, b) => b.count - a.count));
  }, [allQuestions, subject]);

  // Calculate live preview of eligible questions count
  useEffect(() => {
    let isMounted = true;
    const calculateEligible = async () => {
      try {
        const matches = await questionRepository.getQuestions({
          subject,
          topics: selectedTopics.length > 0 ? selectedTopics : undefined,
          subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
          difficulty,
          selection,
        });
        if (isMounted) {
          setEligibleCount(matches.length);
        }
      } catch (e) {
        console.error(e);
      }
    };
    calculateEligible();
    return () => {
      isMounted = false;
    };
  }, [subject, selectedTopics, selectedSubtopics, difficulty, selection]);

  // Filtered topics for search
  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return availableTopics;
    const query = topicSearch.toLowerCase();
    return availableTopics.filter(
      (t) =>
        t.topic.toLowerCase().includes(query) ||
        t.subtopics.some((st) => st.subtopic.toLowerCase().includes(query))
    );
  }, [availableTopics, topicSearch]);

  const toggleTopic = (topicName: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicName) ? prev.filter((t) => t !== topicName) : [...prev, topicName]
    );
  };

  const toggleSubtopic = (subtopicName: string, parentTopicName: string) => {
    setSelectedSubtopics((prev) => {
      if (prev.includes(subtopicName)) {
        return prev.filter((st) => st !== subtopicName);
      } else {
        return [...prev, subtopicName];
      }
    });
  };

  const toggleTopicExpand = (topicName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicName)) next.delete(topicName);
      else next.add(topicName);
      return next;
    });
  };

  const selectAllTopics = () => {
    setSelectedTopics(filteredTopics.map((t) => t.topic));
    setSelectedSubtopics([]);
  };

  const clearTopicSelection = () => {
    setSelectedTopics([]);
    setSelectedSubtopics([]);
  };

  const handleStartPractice = async () => {
    if (eligibleCount === 0) return;
    setIsStarting(true);
    try {
      const config: PracticeConfig = {
        subject,
        topics: selectedTopics,
        subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
        difficulty,
        questionCount: Math.min(customQuestionCount, eligibleCount),
        selection,
        mode,
        randomizeQuestions,
        randomizeOptions,
        timeLimitMinutes: enableTimer ? timerMinutes : undefined,
      };

      const attempt = await QuizService.createAttempt(config);
      navigate(`/quiz/${attempt.id}`);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to generate quiz');
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Practice Engine</Badge>
          <span className="text-xs font-mono text-nexus-text-muted">CDAC CMCE Assessment Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight mt-1">
          Custom Practice Configuration
        </h1>
        <p className="text-xs sm:text-sm text-nexus-text-secondary mt-1">
          Tailor your study session by curriculum domain, specific topics, target difficulty, and feedback mode.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Configuration Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Subject Selection */}
          <Card padding="md">
            <label className="text-xs font-semibold text-nexus-text uppercase tracking-wider block mb-3">
              1. Select Certification Subject / Module
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: 'all', label: 'All CMCE', count: '7,783', icon: Sparkles, color: 'text-nexus-accent' },
                { id: 'fundamental-computer-networks', label: 'Networks (FCN)', count: '2,103', icon: Network, color: 'text-blue-400' },
                { id: 'programming-concepts', label: 'Programming (PC)', count: '1,734', icon: Code2, color: 'text-violet-400' },
                { id: 'cosa', label: 'OS & Admin (COSA)', count: '2,680', icon: Monitor, color: 'text-indigo-400' },
                { id: 'it-infrastructure-devops', label: 'Infra & DevOps (IIMD)', count: '1,266', icon: Cloud, color: 'text-sky-400' },
              ].map((sub) => {
                const Icon = sub.icon;
                const isSelected = subject === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSubject(sub.id as Subject | 'all');
                      setSelectedTopics([]);
                      setSelectedSubtopics([]);
                    }}
                    className={`p-3 rounded border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-nexus-accent/15 border-nexus-accent text-nexus-text font-semibold shadow-xs'
                        : 'bg-nexus-elevated/40 border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:border-nexus-border'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Icon className={`w-4 h-4 ${sub.color}`} />
                      <span className="text-[10px] font-mono text-nexus-text-muted">{sub.count}</span>
                    </div>
                    <span className="text-xs truncate font-medium">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Step 2: Topics & Subtopics Selection */}
          <Card padding="md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-xs font-semibold text-nexus-text uppercase tracking-wider block">
                  2. Select Topics & Subtopics (
                  {selectedTopics.length === 0 && selectedSubtopics.length === 0
                    ? 'All Selected'
                    : `${selectedTopics.length} Topics, ${selectedSubtopics.length} Subtopics`}
                  )
                </label>
                <span className="text-[11px] text-nexus-text-muted">
                  Click a topic to toggle, or expand to drill down into specific subtopics
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllTopics}>
                  Select All
                </Button>
                {(selectedTopics.length > 0 || selectedSubtopics.length > 0) && (
                  <Button variant="ghost" size="sm" onClick={clearTopicSelection}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Topic Search input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-nexus-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search topics or subtopics (e.g. DNS, Routing, Pointers, Docker)..."
                className="w-full bg-nexus-elevated border border-nexus-border rounded pl-9 pr-3 py-1.5 text-xs text-nexus-text placeholder:text-nexus-text-muted focus:outline-none focus:border-nexus-accent"
              />
            </div>

            {/* Topics & Subtopics Scrollable List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {filteredTopics.map((top) => {
                const isSelected = selectedTopics.includes(top.topic);
                const isExpanded = expandedTopics.has(top.topic);
                const activeSubtopicsInTopic = top.subtopics.filter((st) => selectedSubtopics.includes(st.subtopic));

                return (
                  <div
                    key={top.topic}
                    className={`rounded border transition-colors ${
                      isSelected || activeSubtopicsInTopic.length > 0
                        ? 'border-nexus-accent/60 bg-nexus-accent/5'
                        : 'border-nexus-border/60 bg-nexus-elevated/20'
                    }`}
                  >
                    <div
                      onClick={() => toggleTopic(top.topic)}
                      className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer rounded transition-colors ${
                        isSelected
                          ? 'bg-nexus-accent/15 text-nexus-text font-semibold'
                          : 'text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-nexus-accent border-nexus-accent text-white'
                              : 'border-nexus-border'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{top.topic}</span>
                        {activeSubtopicsInTopic.length > 0 && !isSelected && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-nexus-accent/20 text-nexus-accent">
                            {activeSubtopicsInTopic.length} subtopics
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-nexus-surface border border-nexus-border text-nexus-text-muted">
                          {top.count} Qs
                        </span>
                        {top.subtopics.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => toggleTopicExpand(top.topic, e)}
                            className="p-1 rounded hover:bg-nexus-surface text-nexus-text-muted hover:text-nexus-text transition-colors"
                            title={isExpanded ? 'Collapse subtopics' : 'Expand subtopics'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subtopics Indented Drawer */}
                    {isExpanded && top.subtopics.length > 0 && (
                      <div className="pl-7 pr-3 pb-2 pt-1 space-y-1 border-t border-nexus-border/30 bg-nexus-surface/40">
                        {top.subtopics.map((st) => {
                          const isSubSelected = selectedSubtopics.includes(st.subtopic);
                          return (
                            <div
                              key={st.subtopic}
                              onClick={() => toggleSubtopic(st.subtopic, top.topic)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] cursor-pointer border transition-colors ${
                                isSubSelected
                                  ? 'bg-nexus-cyan/15 border-nexus-cyan/50 text-nexus-text font-medium'
                                  : 'bg-nexus-elevated/40 border-nexus-border/40 text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-elevated'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <div
                                  className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                                    isSubSelected
                                      ? 'bg-nexus-cyan border-nexus-cyan text-black'
                                      : 'border-nexus-border'
                                  }`}
                                >
                                  {isSubSelected && <Check className="w-2 h-2 stroke-[3]" />}
                                </div>
                                <span className="truncate">{st.subtopic}</span>
                              </div>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-nexus-surface text-nexus-text-muted flex-shrink-0">
                                {st.count} Qs
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Step 3: Difficulty & Question Pool Selection */}
          <Card padding="md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Difficulty */}
              <div>
                <label className="text-xs font-semibold text-nexus-text uppercase tracking-wider block mb-2">
                  3. Difficulty
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'mixed', label: 'Mixed Difficulty' },
                    { id: 'foundational', label: 'Foundational' },
                    { id: 'intermediate', label: 'Intermediate' },
                    { id: 'advanced', label: 'Advanced' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficulty(d.id as Difficulty | 'mixed')}
                      className={`px-3 py-2 rounded border text-xs text-center transition-all ${
                        difficulty === d.id
                          ? 'bg-nexus-accent/15 border-nexus-accent text-nexus-text font-semibold'
                          : 'bg-nexus-elevated/40 border-nexus-border text-nexus-text-secondary hover:text-nexus-text'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pool Selection */}
              <div>
                <label className="text-xs font-semibold text-nexus-text uppercase tracking-wider block mb-2">
                  4. Question Filter Pool
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'all', label: 'All Eligible Questions' },
                    { id: 'unseen', label: 'Unseen Only (Not Attempted)' },
                    { id: 'incorrect', label: 'Incorrect Only (Past Mistakes)' },
                    { id: 'bookmarked', label: 'Bookmarked Only' },
                    { id: 'previously_attempted', label: 'Previously Attempted' },
                  ].map((sel) => (
                    <label
                      key={sel.id}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded border text-xs cursor-pointer transition-colors ${
                        selection === sel.id
                          ? 'bg-nexus-accent/10 border-nexus-accent/50 text-nexus-text'
                          : 'bg-nexus-elevated/30 border-nexus-border text-nexus-text-secondary hover:text-nexus-text'
                      }`}
                    >
                      <input
                        type="radio"
                        name="question_pool_selection"
                        checked={selection === sel.id}
                        onChange={() => setSelection(sel.id as any)}
                        className="text-nexus-accent focus:ring-nexus-accent"
                      />
                      <span>{sel.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Step 4: Mode & Behavior */}
          <Card padding="md">
            <label className="text-xs font-semibold text-nexus-text uppercase tracking-wider block mb-3">
              5. Examination Behavior
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Practice Mode */}
              <div
                onClick={() => setMode('practice')}
                className={`p-4 rounded border cursor-pointer transition-all ${
                  mode === 'practice'
                    ? 'bg-nexus-accent/10 border-nexus-accent'
                    : 'bg-nexus-elevated/30 border-nexus-border hover:bg-nexus-elevated/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-nexus-cyan" />
                    <span className="text-xs font-semibold text-nexus-text">Practice Mode</span>
                  </div>
                  {mode === 'practice' && <Check className="w-4 h-4 text-nexus-accent" />}
                </div>
                <p className="text-[11px] text-nexus-text-secondary mt-1.5 leading-relaxed">
                  Instant answer verification and detailed distractor explanations after every question choice. Ideal for initial concept acquisition.
                </p>
              </div>

              {/* Exam Mode */}
              <div
                onClick={() => setMode('exam')}
                className={`p-4 rounded border cursor-pointer transition-all ${
                  mode === 'exam'
                    ? 'bg-nexus-accent/10 border-nexus-accent'
                    : 'bg-nexus-elevated/30 border-nexus-border hover:bg-nexus-elevated/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileQuestion className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-nexus-text">Exam Mode</span>
                  </div>
                  {mode === 'exam' && <Check className="w-4 h-4 text-nexus-accent" />}
                </div>
                <p className="text-[11px] text-nexus-text-secondary mt-1.5 leading-relaxed">
                  Real test environment. Answers remain sealed until final submission. Detailed scorecard and review rendered after completion.
                </p>
              </div>
            </div>

            {/* Randomization & Timer toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-nexus-border">
              <label className="flex items-center gap-2 text-xs text-nexus-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                  className="rounded text-nexus-accent focus:ring-nexus-accent"
                />
                <span>Shuffle Questions</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-nexus-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={randomizeOptions}
                  onChange={(e) => setRandomizeOptions(e.target.checked)}
                  className="rounded text-nexus-accent focus:ring-nexus-accent"
                />
                <span>Shuffle Options (A–D)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-nexus-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTimer}
                  onChange={(e) => setEnableTimer(e.target.checked)}
                  className="rounded text-nexus-accent focus:ring-nexus-accent"
                />
                <span>Enable Timer ({timerMinutes}m)</span>
              </label>
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Session Summary & Launch Panel */}
        <div className="space-y-5">
          <Card variant="elevated" padding="lg" className="sticky top-20 border-t-2 border-t-nexus-accent">
            <h3 className="text-sm font-semibold text-nexus-text uppercase tracking-wider mb-4">
              Session Manifest
            </h3>

            {/* Eligible Questions Preview Count */}
            <div className="p-4 rounded bg-nexus-surface border border-nexus-border text-center mb-5">
              <div className="text-xs text-nexus-text-secondary">Matching Questions in Bank</div>
              <div className="text-3xl font-bold font-mono text-nexus-cyan mt-1">
                {eligibleCount}
              </div>
              <div className="text-[11px] text-nexus-text-muted mt-1">
                Subject: {subject.toUpperCase()} • Diff: {difficulty.toUpperCase()}
              </div>
            </div>

            {/* Question Count Slider */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-nexus-text-secondary">Session Question Count:</span>
                <span className="font-mono font-bold text-nexus-text">
                  {Math.min(customQuestionCount, eligibleCount || 1)}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max={Math.max(eligibleCount, 5)}
                step="5"
                value={Math.min(customQuestionCount, eligibleCount || 5)}
                onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
                disabled={eligibleCount === 0}
                className="w-full accent-nexus-accent"
              />
              <div className="flex justify-between text-[10px] font-mono text-nexus-text-muted">
                <span>5</span>
                <span>Max: {eligibleCount}</span>
              </div>
            </div>

            {/* Live Filter Summary list */}
            <div className="space-y-2 text-xs text-nexus-text-secondary border-t border-nexus-border pt-4 mb-6">
              <div className="flex justify-between">
                <span>Target Subject:</span>
                <span className="text-nexus-text font-medium capitalize">{subject.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Topics:</span>
                <span className="text-nexus-text font-medium">
                  {selectedTopics.length === 0 ? 'All' : `${selectedTopics.length}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="text-nexus-text font-medium capitalize">{mode}</span>
              </div>
              <div className="flex justify-between">
                <span>Filter Pool:</span>
                <span className="text-nexus-text font-medium capitalize">{selection.replace('_', ' ')}</span>
              </div>
              {enableTimer && (
                <div className="flex justify-between">
                  <span>Time Limit:</span>
                  <span className="text-nexus-text font-medium">{timerMinutes} Minutes</span>
                </div>
              )}
            </div>

            {/* Launch Button or Empty Warning */}
            {eligibleCount > 0 ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isStarting}
                icon={<Play className="w-4 h-4 fill-current" />}
                onClick={handleStartPractice}
              >
                Launch Practice Session
              </Button>
            ) : (
              <div className="p-3 rounded bg-nexus-error/10 border border-nexus-error/30 text-center">
                <p className="text-xs font-medium text-nexus-error">No Questions Match Criteria</p>
                <p className="text-[11px] text-nexus-text-muted mt-1">
                  Adjust your subject, topics, or difficulty settings above to find eligible questions.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
