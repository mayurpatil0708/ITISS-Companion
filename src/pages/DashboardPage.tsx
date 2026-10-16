import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  GraduationCap,
  Terminal,
  Server,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Bookmark,
  Target,
  Flame,
  HelpCircle,
  PlayCircle,
  FileQuestion,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useApp } from '@/context/AppContext';
import { AnalyticsService, OverallAnalytics } from '@/services/analytics/analytics.service';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { AttemptRecord, Question } from '@/types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, lastInProgressAttempt, bookmarks } = useApp();
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<AttemptRecord[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const [stats, attempts, allQuestions] = await Promise.all([
          AnalyticsService.getAnalytics(),
          questionRepository.getAllAttempts(),
          questionRepository.getAllQuestions(),
        ]);

        if (isMounted) {
          setAnalytics(stats);
          setRecentAttempts(attempts.slice(0, 5));

          const bms = await questionRepository.getBookmarks();
          const qMap = new Map(allQuestions.map((q) => [q.question_id, q]));
          const bmQuestions = bms
            .slice(0, 4)
            .map((b) => qMap.get(b.questionId))
            .filter((q): q is Question => q !== undefined);
          setBookmarkedQuestions(bmQuestions);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Compact Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-nexus-surface via-nexus-elevated to-nexus-surface border border-nexus-border p-6 sm:p-8">
        {/* Subtle technical background grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #7777FF 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-nexus-accent/10 border border-nexus-accent/20 text-nexus-accent text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-nexus-accent animate-ping" />
              CDAC CMCE / CCEE Certified Curriculum
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight">
              {getGreeting()}, <span className="text-nexus-cyan">{preferences.userName}</span>.
            </h1>
            <p className="text-sm text-nexus-text-secondary leading-relaxed">
              Your next session starts here. Master Linux process architectures, Windows Active Directory, and hybrid cross-platform administration.
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {lastInProgressAttempt ? (
              <Button
                variant="cyan"
                size="md"
                icon={<PlayCircle className="w-4 h-4" />}
                onClick={() => navigate(`/quiz/${lastInProgressAttempt.id}`)}
              >
                Resume Session
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => navigate('/practice')}
              >
                Continue Practice
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              icon={<GraduationCap className="w-4 h-4" />}
              onClick={() => navigate('/exam')}
            >
              Start Mock Exam
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Four Informative Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Questions Available */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-nexus-text-secondary">Total Available</span>
            <span className="p-1.5 rounded bg-nexus-elevated border border-nexus-border text-nexus-text-secondary">
              <FileQuestion className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-nexus-text">
              {analytics?.totalQuestions ?? 446}
            </div>
            <div className="text-xs text-nexus-text-muted mt-1">
              Linux (204) • Windows (218) • Cross (24)
            </div>
          </div>
        </Card>

        {/* Metric 2: Questions Attempted */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-nexus-text-secondary">Questions Attempted</span>
            <span className="p-1.5 rounded bg-nexus-elevated border border-nexus-border text-nexus-cyan">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-nexus-text">
              {analytics?.distinctAttemptedQuestions ?? 0}
            </div>
            <div className="text-xs text-nexus-text-muted mt-1">
              {analytics?.totalQuestions
                ? `${Math.round(((analytics.distinctAttemptedQuestions || 0) / analytics.totalQuestions) * 100)}% bank coverage`
                : '0% coverage'}
            </div>
          </div>
        </Card>

        {/* Metric 3: Overall Accuracy */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-nexus-text-secondary">Overall Accuracy</span>
            <span className="p-1.5 rounded bg-nexus-elevated border border-nexus-border text-nexus-success">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-nexus-text flex items-center gap-2">
              <span>{analytics?.overallAccuracyPct ?? 0}%</span>
              {analytics?.trendPct !== undefined && (
                <span
                  className={`inline-flex items-center text-xs font-mono px-1.5 py-0.5 rounded ${
                    analytics.trendPct >= 0
                      ? 'bg-nexus-success/15 text-nexus-success'
                      : 'bg-nexus-error/15 text-nexus-error'
                  }`}
                  title="Trend compared to previous 3 sessions"
                >
                  {analytics.trendPct >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {analytics.trendPct >= 0 ? `+${analytics.trendPct}%` : `${analytics.trendPct}%`}
                </span>
              )}
            </div>
            <div className="text-xs text-nexus-text-muted mt-1">
              {analytics && analytics.distinctAttemptedQuestions > 0
                ? `Benchmark: ${preferences.practicePassingThreshold}%`
                : 'No attempts recorded yet'}
            </div>
          </div>
        </Card>

        {/* Metric 4: Current Study Streak */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-nexus-text-secondary">Study Streak</span>
            <span className="p-1.5 rounded bg-nexus-elevated border border-nexus-border text-amber-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-nexus-text">
              {analytics?.studyStreakDays ?? 0} <span className="text-sm font-sans text-nexus-text-secondary">days</span>
            </div>
            <div className="text-xs text-nexus-text-muted mt-1">
              {analytics?.studyStreakDays && analytics.studyStreakDays > 0
                ? 'Consistency active'
                : 'Start a session to initiate streak'}
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Three Distinctive Subject Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-nexus-text">Domain Curricula</h2>
            <p className="text-xs text-nexus-text-secondary">Core certification subjects and coverage</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/topics')}>
            Explore all topics <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Subject 1: Linux and Operating Systems */}
          <Card
            variant="interactive"
            padding="lg"
            className="flex flex-col justify-between relative group border-t-2 border-t-indigo-500"
            onClick={() => navigate('/practice/linux')}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <Badge variant="primary">204 Questions</Badge>
              </div>
              <h3 className="text-base font-semibold text-nexus-text mt-4 group-hover:text-nexus-accent transition-colors">
                Linux & Operating Systems
              </h3>
              <p className="text-xs text-nexus-text-secondary mt-1 line-clamp-2">
                Process scheduling, ELF executables, systemd units, LVM storage, standard streams, and enterprise daemons.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-nexus-border/60">
              <div className="flex items-center justify-between text-xs text-nexus-text-secondary mb-2">
                <span>Coverage: {analytics?.subjectBreakdown.linux.attemptedQuestions ?? 0} / 204</span>
                <span className="font-mono text-nexus-text">
                  {analytics?.subjectBreakdown.linux.coveragePct ?? 0}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-nexus-elevated overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${analytics?.subjectBreakdown.linux.coveragePct ?? 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-mono text-nexus-text-muted">
                  Accuracy: {analytics?.subjectBreakdown.linux.accuracyPct ?? 0}%
                </span>
                <span className="inline-flex items-center text-xs font-medium text-nexus-accent group-hover:translate-x-1 transition-transform">
                  Start Practice <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          </Card>

          {/* Subject 2: Windows Server Administration */}
          <Card
            variant="interactive"
            padding="lg"
            className="flex flex-col justify-between relative group border-t-2 border-t-cyan-500"
            onClick={() => navigate('/practice/windows')}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Server className="w-5 h-5" />
                </div>
                <Badge variant="cyan">218 Questions</Badge>
              </div>
              <h3 className="text-base font-semibold text-nexus-text mt-4 group-hover:text-nexus-cyan transition-colors">
                Windows Server Administration
              </h3>
              <p className="text-xs text-nexus-text-secondary mt-1 line-clamp-2">
                Active Directory logical structures, FSMO operations, Group Policy enforcement, PowerShell cmdlets, and Hyper-V.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-nexus-border/60">
              <div className="flex items-center justify-between text-xs text-nexus-text-secondary mb-2">
                <span>Coverage: {analytics?.subjectBreakdown.windows.attemptedQuestions ?? 0} / 218</span>
                <span className="font-mono text-nexus-text">
                  {analytics?.subjectBreakdown.windows.coveragePct ?? 0}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-nexus-elevated overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${analytics?.subjectBreakdown.windows.coveragePct ?? 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-mono text-nexus-text-muted">
                  Accuracy: {analytics?.subjectBreakdown.windows.accuracyPct ?? 0}%
                </span>
                <span className="inline-flex items-center text-xs font-medium text-nexus-cyan group-hover:translate-x-1 transition-transform">
                  Start Practice <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          </Card>

          {/* Subject 3: Windows & Linux Cross-platform */}
          <Card
            variant="interactive"
            padding="lg"
            className="flex flex-col justify-between relative group border-t-2 border-t-emerald-500"
            onClick={() => navigate('/practice/cross-platform')}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
                <Badge variant="success">24 Questions</Badge>
              </div>
              <h3 className="text-base font-semibold text-nexus-text mt-4 group-hover:text-nexus-success transition-colors">
                Cross-platform Systems
              </h3>
              <p className="text-xs text-nexus-text-secondary mt-1 line-clamp-2">
                Active Directory realm joining, SSSD configuration, Kerberos authentication, SMB/NFS interoperability, and web server comparisons.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-nexus-border/60">
              <div className="flex items-center justify-between text-xs text-nexus-text-secondary mb-2">
                <span>Coverage: {analytics?.subjectBreakdown.cross_platform.attemptedQuestions ?? 0} / 24</span>
                <span className="font-mono text-nexus-text">
                  {analytics?.subjectBreakdown.cross_platform.coveragePct ?? 0}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-nexus-elevated overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${analytics?.subjectBreakdown.cross_platform.coveragePct ?? 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-mono text-nexus-text-muted">
                  Accuracy: {analytics?.subjectBreakdown.cross_platform.accuracyPct ?? 0}%
                </span>
                <span className="inline-flex items-center text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform">
                  Start Practice <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Split Grid: Weak Areas & Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Focus / Weak Areas */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-nexus-text">Targeted Review & Weak Areas</h3>
              <p className="text-xs text-nexus-text-secondary">Prioritized by statistically significant attempt volume</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/review')}>
              Mistakes Hub
            </Button>
          </div>

          {analytics?.weakTopics && analytics.weakTopics.length > 0 ? (
            <div className="space-y-3">
              {analytics.weakTopics.slice(0, 4).map((wt) => (
                <div
                  key={wt.topic}
                  className="flex items-center justify-between p-3 rounded bg-nexus-elevated/50 border border-nexus-border hover:border-nexus-accent/40 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-medium text-nexus-text truncate">{wt.topic}</div>
                    <div className="text-[11px] text-nexus-text-muted mt-0.5">
                      {wt.subject.toUpperCase()} • {wt.attempted} attempts recorded
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-mono font-semibold text-nexus-warning">
                      {wt.accuracyPct}% accuracy
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate('/practice', {
                          state: { subject: wt.subject, topics: [wt.topic] },
                        })
                      }
                    >
                      Practice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border border-dashed border-nexus-border rounded bg-nexus-elevated/20">
              <CheckCircle2 className="w-8 h-8 text-nexus-cyan/60 mx-auto mb-2" />
              <p className="text-xs font-medium text-nexus-text">No Significant Weak Areas Identified</p>
              <p className="text-[11px] text-nexus-text-muted mt-1 max-w-sm mx-auto">
                Complete more practice sessions to allow the analysis engine to detect specific conceptual gaps.
              </p>
            </div>
          )}
        </Card>

        {/* Recent Attempts */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-nexus-text">Recent Attempts</h3>
              <p className="text-xs text-nexus-text-secondary">Your latest mock and practice sessions</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>
              View Analytics
            </Button>
          </div>

          {recentAttempts.length > 0 ? (
            <div className="space-y-3">
              {recentAttempts.map((att) => (
                <div
                  key={att.id}
                  onClick={() =>
                    att.isCompleted
                      ? navigate(`/results/${att.id}`)
                      : navigate(`/quiz/${att.id}`)
                  }
                  className="flex items-center justify-between p-3 rounded bg-nexus-elevated/50 border border-nexus-border hover:border-nexus-accent/40 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-nexus-text truncate">{att.title}</span>
                      {!att.isCompleted && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-nexus-text-muted mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(att.startedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{att.totalQuestions} questions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {att.score ? (
                      <span
                        className={`text-xs font-mono font-bold ${
                          att.score.accuracyPct >= preferences.practicePassingThreshold
                            ? 'text-nexus-success'
                            : 'text-nexus-warning'
                        }`}
                      >
                        {att.score.accuracyPct}%
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-nexus-text-muted">Active</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-nexus-text-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border border-dashed border-nexus-border rounded bg-nexus-elevated/20">
              <FileQuestion className="w-8 h-8 text-nexus-text-secondary/50 mx-auto mb-2" />
              <p className="text-xs font-medium text-nexus-text">No Recorded Sessions Yet</p>
              <p className="text-[11px] text-nexus-text-muted mt-1 max-w-sm mx-auto">
                Start a practice session or mock exam to generate real performance records.
              </p>
              <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/practice')}>
                Start First Session
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* 5. Bookmarked Questions Quick-List */}
      {bookmarkedQuestions.length > 0 && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-nexus-accent" />
              <h3 className="text-sm font-semibold text-nexus-text">Bookmarked for Fast Recall</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/review')}>
              View All ({bookmarks.size})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bookmarkedQuestions.map((q) => (
              <div
                key={q.question_id}
                onClick={() => navigate(`/question-bank?id=${q.question_id}`)}
                className="p-3 rounded bg-nexus-elevated/40 border border-nexus-border hover:border-nexus-accent/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-nexus-text-muted mb-1">
                  <span className="text-nexus-accent font-semibold">{q.question_id}</span>
                  <span>{q.difficulty}</span>
                </div>
                <p className="text-xs text-nexus-text font-medium line-clamp-2">{q.question_text}</p>
                <div className="text-[10px] text-nexus-cyan mt-1 truncate">{q.topic}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
