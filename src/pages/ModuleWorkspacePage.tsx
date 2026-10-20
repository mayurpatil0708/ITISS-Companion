import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, FileText, FolderTree, HelpCircle, GraduationCap,
  RefreshCw, ExternalLink, BarChart3, Terminal, Server, Layers,
  Monitor, Network, Code2, Cloud, ClipboardCheck, ShieldCheck,
  Search, Key, ShieldAlert, Lock, Clock, CheckCircle2, ChevronRight,
  Download, Copy, Check, FileCheck, BookmarkCheck, ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  getModuleBySlug, ModuleDefinition, isModuleAvailable
} from '@/data/module-registry';
import { getModuleContentManifest, ModuleContentManifest } from '@/data/module-content';
import { useExamStage } from '@/context/ExamStageContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { Question, Subject } from '@/types';
import { APP_CONFIG } from '@/config/app.config';

/** Map icon names to Lucide components */
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Monitor,
  Network,
  Code2,
  Cloud,
  ClipboardCheck,
  ShieldCheck,
  Search,
  Key,
  ShieldAlert,
  Terminal,
  Server,
  Layers,
  BookOpen,
  GraduationCap,
  FolderTree,
  BarChart3,
  FileText,
  HelpCircle,
};

const getModuleIcon = (iconName: string): React.FC<{ className?: string }> => {
  return ICON_MAP[iconName] || Monitor;
};

type WorkspaceTab =
  | 'overview'
  | 'practice'
  | 'study_materials'
  | 'practical_guides'
  | 'topics'
  | 'exam'
  | 'revision'
  | 'useful_links'
  | 'analytics';

export const ModuleWorkspacePage: React.FC = () => {
  const { stage, moduleSlug } = useParams<{ stage: string; moduleSlug: string }>();
  const navigate = useNavigate();
  const { currentStage, setStage } = useExamStage();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [attemptStats, setAttemptStats] = useState<{
    attemptedCount: number;
    accuracyPct: number;
    completedSessions: number;
  }>({
    attemptedCount: 0,
    accuracyPct: 0,
    completedSessions: 0,
  });

  const module: ModuleDefinition | undefined = moduleSlug ? getModuleBySlug(moduleSlug) : undefined;
  const targetStage = stage || module?.examStage || currentStage || 'cmce';
  const manifest: ModuleContentManifest = module ? getModuleContentManifest(module.id, module.slug) : getModuleContentManifest('', '');

  // Redirect if module does not exist
  useEffect(() => {
    if (!module) {
      navigate(`/${targetStage}`, { replace: true });
    } else if (stage && (stage === 'cmce' || stage === 'ccee') && currentStage !== stage) {
      setStage(stage);
    }
  }, [module, stage, targetStage, currentStage, setStage, navigate]);

  // Load questions and attempt statistics for this module
  useEffect(() => {
    if (!module) return;

    let isMounted = true;
    async function loadModuleData(mod: ModuleDefinition) {
      try {
        setIsLoading(true);
        const [allQuestions, allAttempts] = await Promise.all([
          questionRepository.getAllQuestions(),
          questionRepository.getAllAttempts(),
        ]);

        if (!isMounted) return;

        // Filter questions where subject is in module.subjectMapping
        const moduleQuestions = allQuestions.filter((q) =>
          mod.subjectMapping.includes(q.subject)
        );
        setQuestions(moduleQuestions);

        // Calculate attempt metrics for this module
        const moduleQuestionIds = new Set(moduleQuestions.map((q) => q.question_id));
        const attemptedQuestionIds = new Set<string>();
        let correctAnswers = 0;
        let totalAnswered = 0;
        let completedSessions = 0;

        for (const att of allAttempts) {
          if (att.isCompleted) completedSessions++;
          for (const item of att.items) {
            if (moduleQuestionIds.has(item.questionId) && item.selectedOptionId) {
              attemptedQuestionIds.add(item.questionId);
              totalAnswered++;
              if (item.selectedOptionId === item.originalQuestion.correct_option_id) {
                correctAnswers++;
              }
            }
          }
        }

        const accuracyPct =
          totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

        setAttemptStats({
          attemptedCount: attemptedQuestionIds.size,
          accuracyPct,
          completedSessions,
        });
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadModuleData(module);
    return () => {
      isMounted = false;
    };
  }, [module]);

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  if (!module) {
    return null;
  }

  // Pure Coming Soon state for modules without content uploaded
  if (module.contentStatus === 'coming_soon' && !isModuleAvailable(module.id)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/${targetStage}`)}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="text-nexus-text-secondary hover:text-nexus-text"
          >
            Back to {targetStage.toUpperCase()} Dashboard
          </Button>
        </div>

        <Card padding="lg" className="text-center py-16 border-dashed border-nexus-border bg-nexus-surface/50">
          <div className="w-20 h-20 rounded-2xl bg-nexus-elevated border border-nexus-border flex items-center justify-center mx-auto mb-6 text-nexus-text-muted shadow-subtle">
            <Lock className="w-10 h-10 text-nexus-text-muted" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge variant="cyan" size="md">
              {module.shortName}
            </Badge>
            <Badge variant="outline" size="md">
              {module.examStage.toUpperCase()} Module {module.order}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight mb-2">
            {module.name}
          </h1>

          <h2 className="text-lg font-semibold text-nexus-accent mb-3">
            Content Coming Soon
          </h2>

          <p className="text-sm text-nexus-text-secondary max-w-lg mx-auto leading-relaxed mb-8">
            Study materials, questions, and practice exams for this module are currently being prepared and will be published incrementally.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8 text-left">
            <div className="p-4 rounded-lg bg-nexus-elevated/70 border border-nexus-border flex items-center gap-3">
              <Clock className="w-5 h-5 text-nexus-accent shrink-0" />
              <div>
                <div className="text-xs text-nexus-text-muted uppercase tracking-wider font-semibold">Duration</div>
                <div className="text-sm font-semibold text-nexus-text">{module.durationHours} Hours</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-nexus-elevated/70 border border-nexus-border flex items-center gap-3">
              <FolderTree className="w-5 h-5 text-nexus-cyan shrink-0" />
              <div>
                <div className="text-xs text-nexus-text-muted uppercase tracking-wider font-semibold">Topics</div>
                <div className="text-sm font-semibold text-nexus-text">{module.topicCount} Topics</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-nexus-elevated/70 border border-nexus-border flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-nexus-warning shrink-0" />
              <div>
                <div className="text-xs text-nexus-text-muted uppercase tracking-wider font-semibold">Exam Stage</div>
                <div className="text-sm font-semibold text-nexus-text">{module.examStage.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={() => navigate(`/${targetStage}`)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to {targetStage.toUpperCase()} Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const ModuleIcon = getModuleIcon(module.icon);

  // Subject breakdown counts
  const linuxCount = questions.filter((q) => q.subject === 'linux').length;
  const windowsCount = questions.filter((q) => q.subject === 'windows').length;
  const crossCount = questions.filter((q) => q.subject === 'cross_platform').length;

  const subjectCards: {
    subject: Subject;
    name: string;
    shortTitle: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    count: number;
    colorClass: string;
    practiceQuery: string;
  }[] = [
    {
      subject: 'linux',
      name: APP_CONFIG.subjects.linux?.name || 'Linux & Operating Systems',
      shortTitle: APP_CONFIG.subjects.linux?.shortTitle || 'Linux & OS',
      description:
        APP_CONFIG.subjects.linux?.description ||
        'Process management, ELF headers, storage, LVM, systemd, bash I/O, networking, and enterprise services.',
      icon: Terminal,
      count: linuxCount,
      colorClass: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
      practiceQuery: 'linux',
    },
    {
      subject: 'windows',
      name: APP_CONFIG.subjects.windows?.name || 'Windows Server Administration',
      shortTitle: APP_CONFIG.subjects.windows?.shortTitle || 'Windows Server',
      description:
        APP_CONFIG.subjects.windows?.description ||
        'Active Directory DS, FSMO roles, Group Policy, PowerShell, Hyper-V, WSUS, DNS, and failover clustering.',
      icon: Server,
      count: windowsCount,
      colorClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      practiceQuery: 'windows',
    },
    {
      subject: 'cross_platform',
      name: APP_CONFIG.subjects.cross_platform?.name || 'Windows & Linux Cross-platform',
      shortTitle: APP_CONFIG.subjects.cross_platform?.shortTitle || 'Cross-platform',
      description:
        APP_CONFIG.subjects.cross_platform?.description ||
        'Active Directory realm joining, SSSD, Kerberos, Samba/NFS interop, Apache/IIS, and hybrid administration.',
      icon: Layers,
      count: crossCount,
      colorClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      practiceQuery: 'cross_platform',
    },
  ];

  const tabs: {
    id: WorkspaceTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badgeCount?: number;
    isComingSoon?: boolean;
  }[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'practice', label: 'MCQ Practice', icon: Terminal, badgeCount: questions.length },
    { id: 'study_materials', label: 'Study Materials', icon: FileText, badgeCount: manifest.studyResources.length, isComingSoon: !manifest.hasStudyResources },
    { id: 'practical_guides', label: 'Practical Guides', icon: Code2, badgeCount: manifest.practicalGuides.length, isComingSoon: !manifest.hasPracticalGuides },
    { id: 'topics', label: 'Topics', icon: FolderTree, badgeCount: module.topicCount },
    { id: 'exam', label: 'Mock Exam', icon: GraduationCap },
    { id: 'revision', label: 'Revision', icon: RefreshCw, isComingSoon: !manifest.hasRevisionResources },
    { id: 'useful_links', label: 'Useful Links', icon: ExternalLink, badgeCount: manifest.usefulLinks.length, isComingSoon: !manifest.hasUsefulLinks },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Stage Switch */}
      <div className="flex items-center justify-between">
        <Link
          to={`/${targetStage}`}
          className="inline-flex items-center gap-1.5 text-xs text-nexus-text-secondary hover:text-nexus-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {targetStage.toUpperCase()} Dashboard</span>
        </Link>
        <Badge variant="cyan" size="sm">
          {module.examStage.toUpperCase()}
        </Badge>
      </div>

      {/* Module Workspace Header Banner */}
      <Card padding="lg" className="bg-nexus-surface border-nexus-border relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-xl bg-nexus-elevated border border-nexus-border text-nexus-accent shrink-0">
              <ModuleIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-2">
                <Badge variant="primary" size="sm">
                  {module.shortName}
                </Badge>
                <Badge variant="success" size="sm">
                  Available
                </Badge>
                <span className="text-xs text-nexus-text-muted">
                  Module {module.order} of {module.examStage.toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-nexus-text tracking-tight">
                {module.name}
              </h1>
              <p className="text-sm text-nexus-text-secondary max-w-2xl leading-relaxed">
                {module.description}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center border-t md:border-t-0 md:border-l border-nexus-border/60 pt-4 md:pt-0 md:pl-6">
            <div className="text-center px-2">
              <div className="text-lg sm:text-xl font-bold font-mono text-nexus-text">
                {isLoading ? '...' : questions.length}
              </div>
              <div className="text-[11px] text-nexus-text-muted">Questions</div>
            </div>
            <div className="w-px h-8 bg-nexus-border/60" />
            <div className="text-center px-2">
              <div className="text-lg sm:text-xl font-bold font-mono text-nexus-accent">
                {module.durationHours}h
              </div>
              <div className="text-[11px] text-nexus-text-muted">Duration</div>
            </div>
            <div className="w-px h-8 bg-nexus-border/60" />
            <div className="text-center px-2">
              <div className="text-lg sm:text-xl font-bold font-mono text-nexus-cyan">
                {module.topicCount}
              </div>
              <div className="text-[11px] text-nexus-text-muted">Topics</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation Bar (Horizontal pills/buttons) */}
      <div className="flex items-center gap-1.5 p-1 bg-nexus-surface border border-nexus-border rounded-lg overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-nexus-accent text-white shadow-subtle'
                  : 'text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-nexus-elevated text-nexus-text-muted'
                  }`}
                >
                  {tab.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              variant="interactive"
              padding="md"
              onClick={() => setActiveTab('practice')}
              className="flex items-center gap-3.5 group"
            >
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-nexus-text flex items-center justify-between">
                  <span>Start Practice</span>
                  <ChevronRight className="w-3.5 h-3.5 text-nexus-text-muted group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-nexus-text-muted truncate">
                  3 targeted subject banks ({questions.length} MCQs)
                </div>
              </div>
            </Card>

            <Card
              variant="interactive"
              padding="md"
              onClick={() => setActiveTab('study_materials')}
              className="flex items-center gap-3.5 group"
            >
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-nexus-text flex items-center justify-between">
                  <span>Study Materials</span>
                  <ChevronRight className="w-3.5 h-3.5 text-nexus-text-muted group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-nexus-text-muted truncate">
                  {manifest.studyResources.length} Reference PDFs & Notes
                </div>
              </div>
            </Card>

            <Card
              variant="interactive"
              padding="md"
              onClick={() => setActiveTab('practical_guides')}
              className="flex items-center gap-3.5 group"
            >
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-nexus-text flex items-center justify-between">
                  <span>Practical Guides</span>
                  <ChevronRight className="w-3.5 h-3.5 text-nexus-text-muted group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-nexus-text-muted truncate">
                  {manifest.practicalGuides.length} Lab Walkthroughs
                </div>
              </div>
            </Card>

            <Card
              variant="interactive"
              padding="md"
              onClick={() => setActiveTab('exam')}
              className="flex items-center gap-3.5 group"
            >
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-nexus-text flex items-center justify-between">
                  <span>Mock Exam</span>
                  <ChevronRight className="w-3.5 h-3.5 text-nexus-text-muted group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-nexus-text-muted truncate">
                  Simulate timed exam conditions
                </div>
              </div>
            </Card>
          </div>

          {/* Module Stats: Question count per subject */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-nexus-text uppercase tracking-wider">
                Question Bank Breakdown by Subject
              </h2>
              <span className="text-xs text-nexus-text-muted font-mono">
                {questions.length} total MCQs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subjectCards.map((sc) => {
                const SubIcon = sc.icon;
                return (
                  <Card key={sc.subject} padding="md" className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded border ${sc.colorClass}`}>
                            <SubIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold text-nexus-text">{sc.shortTitle}</span>
                        </div>
                        <Badge variant="default" size="sm" className="font-mono">
                          {sc.count} MCQs
                        </Badge>
                      </div>
                      <p className="text-xs text-nexus-text-secondary leading-relaxed line-clamp-3">
                        {sc.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-nexus-border/60 flex items-center justify-between">
                      <span className="text-[11px] text-nexus-text-muted font-mono">
                        {Math.round((sc.count / (questions.length || 1)) * 100)}% of module
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          navigate(`/${targetStage}/${module.slug}/practice?subject=${sc.practiceQuery}`)
                        }
                        icon={<ChevronRight className="w-3.5 h-3.5" />}
                        iconPosition="right"
                        className="text-xs"
                      >
                        Practice
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Module Information & Syllabus Scope */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-nexus-accent" />
              <h3 className="text-sm font-semibold text-nexus-text">About This Module</h3>
            </div>
            <p className="text-xs sm:text-sm text-nexus-text-secondary leading-relaxed">
              {module.description} The Concepts of Operating System and Administration (COSA) module is
              a cornerstone of the CDAC PGCP-ITISS curriculum. Candidates are evaluated on both practical
              system administration tasks and deep architectural concepts across Linux distributions and
              Windows Server environments.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded bg-nexus-elevated border border-nexus-border text-xs">
                <div className="font-semibold text-nexus-text mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-nexus-success" />
                  Linux Administration
                </div>
                <div className="text-nexus-text-muted">
                  Process scheduling, signals, storage hierarchies, LVM volumes, systemd service management.
                </div>
              </div>
              <div className="p-3 rounded bg-nexus-elevated border border-nexus-border text-xs">
                <div className="font-semibold text-nexus-text mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-nexus-cyan" />
                  Windows Server
                </div>
                <div className="text-nexus-text-muted">
                  AD DS forest design, FSMO placement, Group Policy processing, PowerShell automation, Hyper-V.
                </div>
              </div>
              <div className="p-3 rounded bg-nexus-elevated border border-nexus-border text-xs">
                <div className="font-semibold text-nexus-text mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-nexus-accent" />
                  Cross-Platform Interop
                </div>
                <div className="text-nexus-text-muted">
                  SSSD identity management, Kerberos domain join, Samba/NFS interoperability, unified auth.
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Practice */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          {/* Header & Full Practice Launch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-nexus-surface border border-nexus-border">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-nexus-text">Practice Question Sets</h2>
              <p className="text-xs text-nexus-text-secondary">
                Select a specific subject bank below or launch a comprehensive session across all subjects.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/${targetStage}/${module.slug}/practice`)}
              icon={<Terminal className="w-4 h-4" />}
            >
              All Subjects Practice ({questions.length} MCQs)
            </Button>
          </div>

          {/* 3 Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {subjectCards.map((sc) => {
              const SubIcon = sc.icon;
              return (
                <Card
                  key={sc.subject}
                  padding="lg"
                  className="space-y-4 flex flex-col justify-between hover:border-nexus-accent/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg border ${sc.colorClass}`}>
                        <SubIcon className="w-5 h-5" />
                      </div>
                      <Badge variant="cyan" size="sm" className="font-mono">
                        {sc.count} Questions
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-nexus-text">{sc.name}</h3>
                      <div className="text-xs text-nexus-accent font-medium mt-0.5">
                        {sc.shortTitle}
                      </div>
                    </div>

                    <p className="text-xs text-nexus-text-secondary leading-relaxed">
                      {sc.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-nexus-border/60">
                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      onClick={() =>
                        navigate(`/${targetStage}/${module.slug}/practice?subject=${sc.practiceQuery}`)
                      }
                      icon={<ChevronRight className="w-4 h-4" />}
                      iconPosition="right"
                    >
                      Practice →
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Study guidance card */}
          <Card padding="md" className="bg-nexus-elevated/40 border-nexus-border flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-nexus-accent shrink-0 mt-0.5" />
            <div className="text-xs text-nexus-text-secondary space-y-1">
              <span className="font-semibold text-nexus-text block">Practice Engine Features:</span>
              <p>
                Each practice session supports instant answer feedback, option-by-option explanations, official
                source citations, and bookmarking. Filter by difficulty, unseen questions, or incorrect answers
                inside the setup page.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Study Materials & PDF Notes */}
      {activeTab === 'study_materials' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-nexus-surface border border-nexus-border">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-nexus-text">Curriculum Study Materials & Notes</h2>
              <p className="text-xs text-nexus-text-secondary">
                Official reference notes and rapid-revision materials uploaded for {module.name}.
              </p>
            </div>
            <Badge variant="cyan" size="sm">
              {manifest.studyResources.length} Documents Available
            </Badge>
          </div>

          {manifest.studyResources.length === 0 ? (
            <Card padding="lg" className="text-center py-12 border-dashed border-nexus-border">
              <FileText className="w-10 h-10 text-nexus-text-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-nexus-text mb-1">Study Materials Coming Soon</h3>
              <p className="text-xs text-nexus-text-secondary max-w-md mx-auto">
                Reference guides and lecture slides for this module are currently being compiled.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {manifest.studyResources.map((res) => (
                <Card
                  key={res.id}
                  padding="lg"
                  className="space-y-4 flex flex-col justify-between hover:border-nexus-accent/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {res.badge && (
                          <Badge variant="primary" size="sm">
                            {res.badge}
                          </Badge>
                        )}
                        <Badge variant="outline" size="sm" className="font-mono uppercase text-[10px]">
                          {res.type}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-nexus-text leading-snug">{res.title}</h3>
                      <div className="text-[11px] font-mono text-nexus-text-muted mt-1 flex items-center gap-2">
                        {res.fileSize && <span>{res.fileSize}</span>}
                        {res.pageCount && <span>• {res.pageCount} pages</span>}
                      </div>
                    </div>

                    <p className="text-xs text-nexus-text-secondary leading-relaxed">
                      {res.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-nexus-border/60 flex items-center gap-2">
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full justify-center text-xs"
                        icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                        iconPosition="right"
                      >
                        Open Document
                      </Button>
                    </a>
                    <a
                      href={res.fileUrl}
                      download
                      className="shrink-0"
                      title="Download PDF"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2.5"
                        icon={<Download className="w-3.5 h-3.5" />}
                      />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Practical Guides */}
      {activeTab === 'practical_guides' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-nexus-surface border border-nexus-border">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-nexus-text">Hands-On Practical Guides & Lab Procedures</h2>
              <p className="text-xs text-nexus-text-secondary">
                Step-by-step technical administration procedures and CLI execution walkthroughs.
              </p>
            </div>
            <Badge variant="cyan" size="sm">
              {manifest.practicalGuides.length} Lab Walkthroughs
            </Badge>
          </div>

          {manifest.practicalGuides.length === 0 ? (
            <Card padding="lg" className="text-center py-12 border-dashed border-nexus-border">
              <Code2 className="w-10 h-10 text-nexus-text-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-nexus-text mb-1">Practical Guides Coming Soon</h3>
              <p className="text-xs text-nexus-text-secondary max-w-md mx-auto">
                Lab exercises and CLI walkthroughs for this module will be added incrementally.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {manifest.practicalGuides.map((guide) => (
                <Card key={guide.id} padding="lg" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-nexus-border/60 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={guide.category === 'linux' ? 'primary' : guide.category === 'windows' ? 'cyan' : 'success'}
                          size="sm"
                          className="uppercase font-mono text-[10px]"
                        >
                          {guide.category.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                          {guide.difficulty}
                        </Badge>
                        <span className="text-xs text-nexus-text-muted flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {guide.estimatedMinutes} mins
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-nexus-text">{guide.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-nexus-text-secondary leading-relaxed">
                    {guide.summary}
                  </p>

                  {/* Key Commands Section */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-nexus-text uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-nexus-accent" />
                      Key Administration Commands
                    </div>
                    <div className="space-y-1.5">
                      {guide.keyCommands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded bg-nexus-elevated border border-nexus-border font-mono text-xs text-nexus-cyan group"
                        >
                          <span className="truncate pr-2">{cmd}</span>
                          <button
                            onClick={() => handleCopyCommand(cmd)}
                            className="p-1 rounded text-nexus-text-muted hover:text-nexus-text hover:bg-nexus-surface transition-colors shrink-0"
                            title="Copy command"
                          >
                            {copiedCommand === cmd ? (
                              <Check className="w-3.5 h-3.5 text-nexus-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Steps Checklist */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-nexus-text uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-nexus-success" />
                      Step-by-Step Procedure
                    </div>
                    <ul className="space-y-1.5 text-xs text-nexus-text-secondary pl-1">
                      {guide.stepsSummary.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-mono text-nexus-accent font-bold shrink-0">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Topics */}
      {activeTab === 'topics' && (
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-nexus-accent" />
                <h2 className="text-lg font-bold text-nexus-text">Curriculum Topic Explorer</h2>
              </div>
              <p className="text-xs sm:text-sm text-nexus-text-secondary">
                Navigate the {module.topicCount} syllabus topics across Linux, Windows Server, and Cross-Platform domains.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/${targetStage}/${module.slug}/topics`)}
              icon={<FolderTree className="w-4 h-4" />}
            >
              Open Topic Explorer →
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-nexus-text">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Linux & OS Topics</span>
              </div>
              <p className="text-xs text-nexus-text-muted leading-relaxed">
                Kernel architecture, runlevels, systemd targets, LVM volume groups, ext4/XFS filesystems, and process priorities.
              </p>
              <div className="text-[11px] font-mono text-indigo-400 pt-1">
                15 Subtopics Mapped
              </div>
            </div>

            <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-nexus-text">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Windows Server Topics</span>
              </div>
              <p className="text-xs text-nexus-text-muted leading-relaxed">
                Active Directory domains, PDC/RID/Infrastructure FSMO roles, GPO processing order, PowerShell DSC, and WSUS.
              </p>
              <div className="text-[11px] font-mono text-cyan-400 pt-1">
                15 Subtopics Mapped
              </div>
            </div>

            <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-nexus-text">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Cross-Platform Topics</span>
              </div>
              <p className="text-xs text-nexus-text-muted leading-relaxed">
                SSSD configuration, Winbind, Kerberos ticketing, CIFS/NFS interoperability, and heterogeneous networking.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 pt-1">
                10 Subtopics Mapped
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/${targetStage}/${module.slug}/topics`)}
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Browse All Topics in Hierarchy
            </Button>
          </div>
        </Card>
      )}

      {/* Tab 6: Mock Exam */}
      {activeTab === 'exam' && (
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-nexus-accent" />
                <h2 className="text-lg font-bold text-nexus-text">Full Module Mock Examination</h2>
              </div>
              <p className="text-xs sm:text-sm text-nexus-text-secondary">
                Simulate real CDAC exam conditions for {module.name}.
              </p>
            </div>
            <Button
              variant="cyan"
              size="md"
              onClick={() => navigate(`/${targetStage}/${module.slug}/exam`)}
              icon={<GraduationCap className="w-4 h-4" />}
            >
              Launch Mock Exam →
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-lg bg-nexus-elevated border border-nexus-border text-center">
              <div className="text-xs text-nexus-text-muted uppercase tracking-wider mb-1">Standard Duration</div>
              <div className="text-xl font-bold font-mono text-nexus-text">60 Mins</div>
            </div>
            <div className="p-3.5 rounded-lg bg-nexus-elevated border border-nexus-border text-center">
              <div className="text-xs text-nexus-text-muted uppercase tracking-wider mb-1">Questions</div>
              <div className="text-xl font-bold font-mono text-nexus-accent">50 MCQs</div>
            </div>
            <div className="p-3.5 rounded-lg bg-nexus-elevated border border-nexus-border text-center">
              <div className="text-xs text-nexus-text-muted uppercase tracking-wider mb-1">Pass Benchmark</div>
              <div className="text-xl font-bold font-mono text-nexus-success">70%</div>
            </div>
            <div className="p-3.5 rounded-lg bg-nexus-elevated border border-nexus-border text-center">
              <div className="text-xs text-nexus-text-muted uppercase tracking-wider mb-1">Negative Marking</div>
              <div className="text-xl font-bold font-mono text-nexus-cyan">None</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-nexus-elevated/40 border border-nexus-border space-y-2 text-xs text-nexus-text-secondary">
            <div className="font-semibold text-nexus-text flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-nexus-success" />
              Examination Rules & Assessment Standards
            </div>
            <ul className="list-disc list-inside space-y-1 text-nexus-text-muted pl-1">
              <li>Timed environment with warning notifications at 10 and 5 minutes remaining.</li>
              <li>Balanced question distribution across Linux, Windows Server, and Cross-Platform topics.</li>
              <li>Flag questions for review to revisit before submitting the attempt.</li>
              <li>Comprehensive diagnostic report generated upon submission.</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Tab 7: Revision Resources */}
      {activeTab === 'revision' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-nexus-surface border border-nexus-border">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-nexus-text">High-Yield Revision & Core Concepts</h2>
              <p className="text-xs text-nexus-text-secondary">
                Distilled key terms, matrices, and rapid review points for {module.name}.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/${targetStage}/${module.slug}/review`)}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Review Incorrect MCQs →
            </Button>
          </div>

          {manifest.revisionResources.length === 0 ? (
            <Card padding="lg" className="text-center py-12 border-dashed border-nexus-border">
              <RefreshCw className="w-10 h-10 text-nexus-text-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-nexus-text mb-1">Revision Material Coming Soon</h3>
              <p className="text-xs text-nexus-text-secondary max-w-md mx-auto">
                Cheat sheets and high-yield summaries for this module are in preparation.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {manifest.revisionResources.map((rev) => (
                <Card key={rev.id} padding="lg" className="space-y-4">
                  <div className="space-y-1 border-b border-nexus-border/60 pb-3">
                    <Badge variant="cyan" size="sm" className="mb-1">
                      {rev.category}
                    </Badge>
                    <h3 className="text-base font-bold text-nexus-text">{rev.title}</h3>
                    <p className="text-xs text-nexus-text-secondary">{rev.summary}</p>
                  </div>

                  {/* High Yield Bullets */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-nexus-text uppercase tracking-wider flex items-center gap-1.5">
                      <BookmarkCheck className="w-3.5 h-3.5 text-nexus-accent" />
                      Essential High-Yield Points
                    </div>
                    <ul className="space-y-1.5 text-xs text-nexus-text-secondary pl-1">
                      {rev.highYieldBullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-nexus-accent shrink-0 mt-1.5" />
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Terms */}
                  {rev.keyTerms && rev.keyTerms.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-nexus-border/60">
                      <div className="text-xs font-semibold text-nexus-text uppercase tracking-wider">
                        Key Definitions
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rev.keyTerms.map((term, idx) => (
                          <div key={idx} className="p-2.5 rounded bg-nexus-elevated border border-nexus-border text-xs">
                            <span className="font-semibold text-nexus-cyan block mb-0.5">{term.term}</span>
                            <span className="text-nexus-text-muted">{term.explanation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Useful Links */}
      {activeTab === 'useful_links' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-nexus-surface border border-nexus-border">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-nexus-text">Authoritative Documentation & External Resources</h2>
              <p className="text-xs text-nexus-text-secondary">
                Curated official technical references, standards, and man pages for {module.name}.
              </p>
            </div>
            <Badge variant="cyan" size="sm">
              {manifest.usefulLinks.length} Verified Links
            </Badge>
          </div>

          {manifest.usefulLinks.length === 0 ? (
            <Card padding="lg" className="text-center py-12 border-dashed border-nexus-border">
              <ExternalLink className="w-10 h-10 text-nexus-text-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-nexus-text mb-1">Useful Links Coming Soon</h3>
              <p className="text-xs text-nexus-text-secondary max-w-md mx-auto">
                External documentation links for this module will be added shortly.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {manifest.usefulLinks.map((link) => (
                <Card
                  key={link.id}
                  padding="md"
                  className="space-y-3 flex flex-col justify-between hover:border-nexus-accent/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" size="sm" className="uppercase font-mono text-[10px]">
                        {link.category.replace('_', ' ')}
                      </Badge>
                      <ArrowUpRight className="w-4 h-4 text-nexus-text-muted" />
                    </div>
                    <h3 className="text-sm font-bold text-nexus-text">{link.title}</h3>
                    <p className="text-xs text-nexus-text-secondary leading-relaxed">
                      {link.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-nexus-border/60">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-nexus-accent hover:text-nexus-accent-hover font-medium transition-colors"
                    >
                      <span>Visit Resource</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 9: Analytics */}
      {activeTab === 'analytics' && (
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-nexus-accent" />
                <h2 className="text-lg font-bold text-nexus-text">Module Performance Analytics</h2>
              </div>
              <p className="text-xs sm:text-sm text-nexus-text-secondary">
                Performance snapshot for {module.name} based on your stored practice sessions.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/${targetStage}/${module.slug}/analytics`)}
              icon={<ExternalLink className="w-4 h-4" />}
            >
              Full Analytics →
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border">
              <div className="text-xs text-nexus-text-muted uppercase tracking-wider mb-1">Total MCQs</div>
              <div className="text-2xl font-bold font-mono text-nexus-text">{questions.length}</div>
            </div>
            <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border">
              <div className="text-xs text-nexus-text-muted uppercase tracking-wider mb-1">Questions Attempted</div>
              <div className="text-2xl font-bold font-mono text-nexus-cyan">
                {attemptStats.attemptedCount}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border">
              <div className="text-xs text-nexus-text-muted uppercase tracking-wider mb-1">Average Accuracy</div>
              <div className="text-2xl font-bold font-mono text-nexus-accent">
                {attemptStats.accuracyPct}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border">
              <div className="text-xs text-nexus-text-muted uppercase tracking-wider mb-1">Completed Sessions</div>
              <div className="text-2xl font-bold font-mono text-nexus-success">
                {attemptStats.completedSessions}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-nexus-elevated/40 border border-nexus-border space-y-3">
            <div className="text-xs font-semibold text-nexus-text">Subject Coverage</div>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-nexus-text-secondary">
                  <span>Linux & OS ({linuxCount} questions)</span>
                  <span className="font-mono text-nexus-text">{Math.round((linuxCount / (questions.length || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-nexus-elevated rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full"
                    style={{ width: `${Math.round((linuxCount / (questions.length || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-nexus-text-secondary">
                  <span>Windows Server ({windowsCount} questions)</span>
                  <span className="font-mono text-nexus-text">{Math.round((windowsCount / (questions.length || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-nexus-elevated rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-1.5 rounded-full"
                    style={{ width: `${Math.round((windowsCount / (questions.length || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-nexus-text-secondary">
                  <span>Cross-platform ({crossCount} questions)</span>
                  <span className="font-mono text-nexus-text">{Math.round((crossCount / (questions.length || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-nexus-elevated rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${Math.round((crossCount / (questions.length || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
