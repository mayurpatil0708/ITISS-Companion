import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  Target,
  Flame,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AnalyticsService, OverallAnalytics } from '@/services/analytics/analytics.service';
import { useApp } from '@/context/AppContext';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useApp();
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stats = await AnalyticsService.getAnalytics();
        if (isMounted) {
          setAnalytics(stats);
        }
      } catch (err) {
        console.error('Failed to calculate analytics', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="py-20 text-center animate-pulse">
        <div className="w-10 h-10 border-2 border-nexus-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono text-nexus-text-secondary">Computing statistical performance models...</p>
      </div>
    );
  }

  // Subject chart data
  // Subject labels dictionary
  const SUBJECT_DISPLAY_NAMES: Record<string, string> = {
    'cosa': 'COSA (OS & Admin)',
    'fundamental-computer-networks': 'Networks (FCN)',
    'fcn': 'Networks (FCN)',
    'programming-concepts': 'Programming (PC)',
    'pc': 'Programming (PC)',
    'it-infrastructure-devops': 'DevOps & Infra (IIMD)',
    'iimd': 'DevOps & Infra (IIMD)',
    'itid': 'DevOps & Infra (IIMD)',
    'linux': 'Linux & OS',
    'windows': 'Windows Server',
    'cross_platform': 'Cross-platform',
  };

  // Dynamic Subject chart data
  const subjectChartData = Object.values(analytics.subjectBreakdown)
    .filter((s) => s.totalQuestions > 0)
    .map((s) => ({
      name: SUBJECT_DISPLAY_NAMES[s.subject] || s.subject.toUpperCase(),
      accuracy: s.accuracyPct,
      attempted: s.attemptedQuestions,
      total: s.totalQuestions,
    }));

  // Difficulty chart data
  const difficultyChartData = [
    {
      difficulty: 'Foundational',
      accuracy: analytics.difficultyBreakdown.foundational.accuracyPct,
      attempted: analytics.difficultyBreakdown.foundational.attempted,
      total: analytics.difficultyBreakdown.foundational.total,
    },
    {
      difficulty: 'Intermediate',
      accuracy: analytics.difficultyBreakdown.intermediate.accuracyPct,
      attempted: analytics.difficultyBreakdown.intermediate.attempted,
      total: analytics.difficultyBreakdown.intermediate.total,
    },
    {
      difficulty: 'Advanced',
      accuracy: analytics.difficultyBreakdown.advanced.accuracyPct,
      attempted: analytics.difficultyBreakdown.advanced.attempted,
      total: analytics.difficultyBreakdown.advanced.total,
    },
  ];

  // Pie chart data: Accuracy distribution
  const totalCorrect = Object.values(analytics.subjectBreakdown).reduce(
    (sum, s) => sum + s.correctAnswers,
    0
  );
  const totalAttemptedQuestions = analytics.distinctAttemptedQuestions;

  const donutData = [
    { name: 'Correct', value: totalCorrect, color: '#10B981' },
    { name: 'Incorrect / To Review', value: Math.max(0, totalAttemptedQuestions - totalCorrect), color: '#EF4444' },
    { name: 'Unattempted', value: Math.max(0, analytics.totalQuestions - totalAttemptedQuestions), color: '#334155' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Performance Analytics</Badge>
          <span className="text-xs font-mono text-nexus-text-muted">CDAC CMCE Candidate Diagnostic</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight mt-1">
          Candidate Competency Analytics
        </h1>
        <p className="text-xs sm:text-sm text-nexus-text-secondary mt-1">
          Data-driven evaluation of candidate proficiency, curriculum domain readiness, pacing, and targeted weak-area remediation.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="md">
          <span className="text-xs font-medium text-nexus-text-secondary block">Overall Accuracy</span>
          <div className="text-2xl font-bold font-mono text-nexus-cyan mt-1">
            {analytics.overallAccuracyPct}%
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1">
            Target benchmark: {preferences.practicePassingThreshold}%
          </div>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-nexus-text-secondary block">Questions Explored</span>
          <div className="text-2xl font-bold font-mono text-nexus-text mt-1">
            {analytics.distinctAttemptedQuestions} / {analytics.totalQuestions}
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1">
            {Math.round((analytics.distinctAttemptedQuestions / (analytics.totalQuestions || 1)) * 100)}% bank coverage
          </div>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-nexus-text-secondary block">Study Streak</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 flex items-center gap-1.5">
            <Flame className="w-5 h-5" />
            <span>{analytics.studyStreakDays} Days</span>
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1">
            Continuous daily practice
          </div>
        </Card>

        <Card padding="md">
          <span className="text-xs font-medium text-nexus-text-secondary block">Total Exam Attempts</span>
          <div className="text-2xl font-bold font-mono text-nexus-text mt-1">
            {analytics.totalAttempts}
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1">
            {analytics.completedAttempts} completed
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Subject Accuracy Bar Chart */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider">
                Accuracy by Subject (%)
              </h3>
              <p className="text-[11px] text-nexus-text-muted">Domain proficiency benchmarked at 70%</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222A38" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151A24',
                    borderColor: '#232B3C',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#F3F5FA',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Accuracy']}
                />
                <Bar dataKey="accuracy" fill="#7777FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Difficulty Level Breakdown */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider">
                Difficulty Level Performance (%)
              </h3>
              <p className="text-[11px] text-nexus-text-muted">Foundational, Intermediate, and Advanced tiers</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222A38" vertical={false} />
                <XAxis dataKey="difficulty" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151A24',
                    borderColor: '#232B3C',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#F3F5FA',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Accuracy']}
                />
                <Bar dataKey="accuracy" fill="#42D9E8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 3: Performance Over Time / Score Timeline */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider">
                Score Timeline Over Recent Sessions
              </h3>
              <p className="text-[11px] text-nexus-text-muted">Chronological accuracy trend</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics.timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222A38" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151A24',
                      borderColor: '#232B3C',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#F3F5FA',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Average Score']}
                  />
                  <Line type="monotone" dataKey="scoreAvg" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-nexus-text-muted">
                Complete at least one practice attempt to see your timeline.
              </div>
            )}
          </div>
        </Card>

        {/* Chart 4: Bank Coverage Donut */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider">
                Question Bank Coverage Ratio
              </h3>
              <p className="text-[11px] text-nexus-text-muted">Overall bank state</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151A24',
                    borderColor: '#232B3C',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#F3F5FA',
                  }}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-nexus-text-secondary">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Weak Topics Ranking Section */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider">
              High-Priority Review Topics (Weak Areas)
            </h3>
            <p className="text-xs text-nexus-text-secondary">
              Ranked strictly by attempt volume (minimum 3 attempts) and low accuracy rates to prevent misleading false positives.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/practice')}>
            Start Practice
          </Button>
        </div>

        {analytics.weakTopics.length > 0 ? (
          <div className="space-y-2.5">
            {analytics.weakTopics.map((wt) => (
              <div
                key={wt.topic}
                className="p-3 rounded bg-nexus-elevated/40 border border-nexus-border flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-nexus-text truncate">{wt.topic}</span>
                    <Badge variant="warning">{wt.subject.toUpperCase()}</Badge>
                  </div>
                  <div className="text-[11px] text-nexus-text-muted mt-0.5">
                    {wt.attempted} attempts recorded • {wt.correct} correct answers
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-nexus-warning block">
                      {wt.accuracyPct}% accuracy
                    </span>
                    <span className="text-[10px] text-nexus-text-muted">Needs Drill</span>
                  </div>

                  <Button
                    variant="cyan"
                    size="sm"
                    onClick={() =>
                      navigate('/practice', {
                        state: { subject: wt.subject, topics: [wt.topic] },
                      })
                    }
                  >
                    Drill Topic
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-nexus-text-muted bg-nexus-elevated/20 rounded border border-dashed border-nexus-border">
            No statistically significant weak areas identified yet. As you complete more questions across different modules, topics needing attention will appear here.
          </div>
        )}
      </Card>
    </div>
  );
};
