import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  BookOpenCheck,
  Shield,
  ArrowRight,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  Play,
  Terminal,
  Server,
  Code2,
  Cloud,
  Sparkles,
  FileText,
  CheckCircle2,
  RotateCcw,
  GraduationCap,
  Database,
  BarChart3,
  Bookmark,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { EXAM_STAGES, getModulesByStage, ExamStage, ModuleDefinition } from '@/data/module-registry';
import { useExamStage } from '@/context/ExamStageContext';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { AttemptRecord } from '@/types';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Network: Layers,
  Code2,
  Monitor: Terminal,
  Cloud,
  ClipboardCheck: CheckCircle2,
  ShieldCheck,
  Search: FileText,
  Key: Shield,
  ShieldAlert: Shield,
  BookOpen,
};

export const ExamSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { setStage } = useExamStage();
  const { theme } = useTheme();

  const cmceModules = getModulesByStage('cmce');
  const cceeModules = getModulesByStage('ccee');

  const [recentAttempt, setRecentAttempt] = useState<AttemptRecord | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(7783);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [attempts, questions] = await Promise.all([
          questionRepository.getAllAttempts(),
          questionRepository.getAllQuestions(),
        ]);
        if (isMounted) {
          if (attempts && attempts.length > 0) {
            setRecentAttempt(attempts[0]);
          }
          if (questions && questions.length > 0) {
            setTotalQuestions(questions.length);
          }
        }
      } catch (err) {
        console.warn('Could not load user activity data', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectStage = (stage: ExamStage) => {
    setStage(stage);
    navigate(`/${stage}`);
  };

  // ─────────────────────────────────────────────────────────────
  // Netflix-style Horizontal Scroll Helper
  // ─────────────────────────────────────────────────────────────
  const HorizontalScrollContainer: React.FC<{
    title: string;
    subtitle?: string;
    badge?: string;
    children: React.ReactNode;
  }> = ({ title, subtitle, badge, children }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const amount = direction === 'left' ? -380 : 380;
        scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      }
    };

    return (
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-nexus-text tracking-tight">
                {title}
              </h2>
              {badge && (
                <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-nexus-text-secondary">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-nexus-elevated border border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-nexus-elevated border border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-surface transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {children}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // DARK THEME (Netflix × Spotify Inspired Experience)
  // ─────────────────────────────────────────────────────────────
  if (theme === 'dark') {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-10 animate-fadeIn select-none">
        {/* Welcome Section */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-nexus-accent/15 border border-nexus-accent/30 text-nexus-accent text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-nexus-accent animate-pulse" />
            CDAC PGCP-ITISS Certification Suite
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-nexus-text tracking-tight">
            Your next milestone starts here.
          </h1>
          <p className="text-sm sm:text-base text-nexus-text-secondary max-w-3xl leading-relaxed">
            Prepare for CMCE and CCEE with focused study sessions, technical resources, practice questions, and revision tools.
          </p>
        </div>

        {/* Featured Learning Section (Adapts to real user activity) */}
        {recentAttempt ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-nexus-surface via-nexus-elevated to-nexus-surface border border-nexus-border p-6 sm:p-8 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="cyan" size="sm">
                    Continue Learning
                  </Badge>
                  <span className="text-xs text-nexus-text-muted font-mono">
                    Last active session
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-nexus-text tracking-tight">
                  {recentAttempt.title}
                </h3>
                <p className="text-xs sm:text-sm text-nexus-text-secondary leading-relaxed">
                  {recentAttempt.items.length} questions •{' '}
                  {recentAttempt.items.filter((i) => i.selectedOptionId).length} answered • Mode:{' '}
                  <span className="capitalize">{recentAttempt.mode}</span>
                </p>
                <div className="w-full max-w-md bg-nexus-border/60 rounded-full h-1.5 overflow-hidden mt-3">
                  <div
                    className="bg-nexus-cyan h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (recentAttempt.items.filter((i) => i.selectedOptionId).length /
                          (recentAttempt.items.length || 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() =>
                    navigate(
                      recentAttempt.isCompleted
                        ? `/results/${recentAttempt.id}`
                        : `/quiz/${recentAttempt.id}`
                    )
                  }
                  icon={<Play className="w-4 h-4 fill-current" />}
                  className="font-semibold shadow-subtle"
                >
                  {recentAttempt.isCompleted ? 'Review Results' : 'Resume Session'}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleSelectStage('cmce')}
                >
                  Browse CMCE
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* New User Curated Starting Point */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-nexus-surface via-nexus-elevated to-nexus-surface border border-nexus-border p-6 sm:p-8 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">
                    Featured Curriculum
                  </Badge>
                  <span className="text-xs text-nexus-text-muted font-mono">
                    CMCE Module 1
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-nexus-text tracking-tight">
                  Fundamental of Computer Networks
                </h3>
                <p className="text-xs sm:text-sm text-nexus-text-secondary leading-relaxed">
                  2,103 Questions • 120 Hours • 8 Topics • Master OSI 7-layer architecture, IPv4/IPv6 CIDR subnetting, Ethernet switching, and routing protocols (OSPF, RIP, BGP).
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/cmce/fcn/practice')}
                  icon={<Play className="w-4 h-4 fill-current" />}
                  className="font-semibold"
                >
                  Start Practice
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/cmce/fcn')}
                >
                  Explore Module
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Collection 1: CMCE Examination Track (Netflix Row Pattern) */}
        <HorizontalScrollContainer
          title="CMCE Examination Modules"
          subtitle="Foundational stage covering core network, programming, operating system, and DevOps administration"
          badge="4 Modules Ready"
        >
          {cmceModules.map((mod) => {
            const ModIcon = ICON_MAP[mod.icon] || BookOpen;
            return (
              <div
                key={mod.id}
                onClick={() => navigate(`/cmce/${mod.slug}`)}
                className="w-72 sm:w-80 shrink-0 p-5 rounded-xl bg-nexus-surface border border-nexus-border hover:border-nexus-accent/60 hover:bg-nexus-elevated transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-nexus-elevated border border-nexus-border text-nexus-text group-hover:text-nexus-accent transition-colors">
                      <ModIcon className="w-5 h-5" />
                    </div>
                    <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
                      Module {mod.order}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-nexus-text group-hover:text-nexus-accent transition-colors">
                      {mod.name}
                    </h3>
                    <p className="text-xs text-nexus-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-nexus-border/60 flex items-center justify-between text-xs text-nexus-text-muted">
                  <span className="font-mono">{mod.durationHours} hrs • {mod.topicCount} topics</span>
                  <ChevronRight className="w-4 h-4 text-nexus-text-muted group-hover:text-nexus-accent group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </HorizontalScrollContainer>

        {/* Collection 2: Fast-Track Practice Domains (Spotify / Netflix Discovery) */}
        <HorizontalScrollContainer
          title="Fast-Track Practice Domains"
          subtitle="Directly jump into focused MCQ banks by specialized technical domain"
        >
          {[
            {
              title: 'Ethernet Switching & Subnetting',
              module: 'Networks',
              slug: 'fcn',
              count: 895,
              icon: Layers,
              topics: ['Data Link Layer & Switching', 'IP Addressing & Subnetting', 'Network Layer & Routing'],
            },
            {
              title: 'C Programming & Memory Allocation',
              module: 'Programming',
              slug: 'pc',
              count: 452,
              icon: Code2,
              topics: ['C Language Fundamentals', 'C Arrays, Pointers & Memory', 'C Structures & File Systems'],
            },
            {
              title: 'Linux System Administration & OS',
              module: 'COSA',
              slug: 'cosa',
              count: 1232,
              icon: Terminal,
              subjectQuery: 'linux',
            },
            {
              title: 'Windows Server 2022 & Active Directory',
              module: 'COSA',
              slug: 'cosa',
              count: 1108,
              icon: Server,
              subjectQuery: 'windows',
            },
            {
              title: 'Relational Database Design & SQL',
              module: 'Programming',
              slug: 'pc',
              count: 669,
              icon: Database,
              topics: ['Database Management Systems & Relational Model', 'Database Design, Normalization & Transactions', 'SQL Queries & DDL/DML'],
            },
            {
              title: 'Data Center & Cloud Infrastructure',
              module: 'DevOps',
              slug: 'itid',
              count: 588,
              icon: Cloud,
              topics: ['Data Center Infrastructure & Storage', 'Cloud Computing Architecture & AWS'],
            },
          ].map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (item.subjectQuery) {
                    navigate(`/cmce/${item.slug}/practice?subject=${item.subjectQuery}`);
                  } else {
                    navigate(`/cmce/${item.slug}/practice`, {
                      state: { topics: item.topics },
                    });
                  }
                }}
                className="w-64 sm:w-72 shrink-0 p-4 rounded-xl bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/60 hover:bg-nexus-elevated transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-nexus-elevated border border-nexus-border text-nexus-cyan">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-nexus-text-muted px-2 py-0.5 rounded bg-nexus-elevated border border-nexus-border">
                      {item.module}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-nexus-text group-hover:text-nexus-cyan transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-nexus-text-secondary mt-0.5">
                      Curriculum targeted question set
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-nexus-border/60 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-nexus-cyan">
                    {item.count} MCQs
                  </span>
                  <span className="text-xs font-medium text-nexus-text-secondary group-hover:text-nexus-text flex items-center gap-1">
                    Practice <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </HorizontalScrollContainer>

        {/* Collection 3: CCEE Specialization Track (Upcoming End-Term Modules) */}
        <HorizontalScrollContainer
          title="CCEE Specialization Track"
          subtitle="Advanced cybersecurity and defense modules conducted at course completion"
          badge="5 Specializations"
        >
          {cceeModules.map((mod) => (
            <div
              key={mod.id}
              className="w-64 sm:w-72 shrink-0 p-4 rounded-xl bg-nexus-surface/60 border border-nexus-border/60 opacity-70 hover:opacity-100 transition-opacity flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                    CCEE Mod {mod.order}
                  </Badge>
                  <span className="text-[10px] text-nexus-text-muted flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Coming Soon
                  </span>
                </div>
                <h4 className="text-sm font-bold text-nexus-text">{mod.name}</h4>
                <p className="text-xs text-nexus-text-secondary line-clamp-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-nexus-border/40 text-[11px] font-mono text-nexus-text-muted">
                {mod.durationHours}h • {mod.topicCount} curriculum topics
              </div>
            </div>
          ))}
        </HorizontalScrollContainer>

        {/* Collection 4: Curriculum Reference Library & Rapid Tools */}
        <div className="pt-4 border-t border-nexus-border/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              variant="interactive"
              padding="md"
              onClick={() => navigate('/cmce/exam')}
              className="space-y-2 group"
            >
              <div className="p-2.5 rounded-lg bg-nexus-elevated border border-nexus-border text-nexus-accent w-fit">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-nexus-text group-hover:text-nexus-accent transition-colors">
                Full Mock Exam
              </h4>
              <p className="text-xs text-nexus-text-secondary">
                Simulate timed exam conditions with a 50-question comprehensive assessment.
              </p>
            </Card>

            <Card
              variant="interactive"
              padding="md"
              onClick={() => navigate('/cmce/question-bank')}
              className="space-y-2 group"
            >
              <div className="p-2.5 rounded-lg bg-nexus-elevated border border-nexus-border text-nexus-cyan w-fit">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-nexus-text group-hover:text-nexus-cyan transition-colors">
                Question Bank
              </h4>
              <p className="text-xs text-nexus-text-secondary">
                Explore and filter all {totalQuestions} verified CDAC curriculum questions.
              </p>
            </Card>

            <Card
              variant="interactive"
              padding="md"
              onClick={() => navigate('/cmce/review')}
              className="space-y-2 group"
            >
              <div className="p-2.5 rounded-lg bg-nexus-elevated border border-nexus-border text-nexus-text w-fit">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-nexus-text group-hover:text-nexus-accent transition-colors">
                Review Mistakes
              </h4>
              <p className="text-xs text-nexus-text-secondary">
                Target questions answered incorrectly in previous practice attempts.
              </p>
            </Card>

            <Card
              variant="interactive"
              padding="md"
              onClick={() => navigate('/cmce/analytics')}
              className="space-y-2 group"
            >
              <div className="p-2.5 rounded-lg bg-nexus-elevated border border-nexus-border text-nexus-cyan w-fit">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-nexus-text group-hover:text-nexus-cyan transition-colors">
                Analytics & Insights
              </h4>
              <p className="text-xs text-nexus-text-secondary">
                Monitor accuracy metrics, subject coverage, and historical speed data.
              </p>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-nexus-border/40 text-center">
          <p className="text-xs text-nexus-text-muted">
            PGCP-ITISS at CDAC • The Complete Preparation Hub
          </p>
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LIGHT THEME (Apple Inspired Experience)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-12 animate-fadeIn select-none">
      {/* Editorial Hero Section */}
      <div className="rounded-3xl bg-nexus-surface border border-nexus-border/80 p-8 sm:p-14 text-center shadow-subtle">
        <div className="flex flex-col items-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-nexus-accent/10 border border-nexus-accent/20 text-nexus-accent">
            <BookOpenCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-nexus-text tracking-tight">
            Your PGCP-ITISS Journey, Organized.
          </h1>

          <p className="text-base sm:text-lg text-nexus-text-secondary max-w-2xl leading-relaxed">
            Everything you need for CMCE and CCEE preparation—study resources, practical guides, MCQs, mock tests, and focused revision in one place.
          </p>
        </div>
      </div>

      {/* Two Prominent Editorial Exam Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* CMCE Card */}
        <Card
          variant="default"
          padding="none"
          role="button"
          tabIndex={0}
          aria-label="Select Common Module Comprehensive Examination (CMCE)"
          onClick={() => handleSelectStage('cmce')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectStage('cmce');
            }
          }}
          className="group flex flex-col justify-between overflow-hidden cursor-pointer rounded-2xl border border-nexus-border/80 bg-nexus-surface hover:border-nexus-accent/50 hover:shadow-card transition-all duration-200"
        >
          <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-xl bg-nexus-accent/10 border border-nexus-accent/20 text-nexus-accent">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge variant="default" size="sm" className="gap-1.5 px-2.5 py-0.5">
                    <Clock className="w-3.5 h-3.5 text-nexus-text-muted" />
                    <span>~3 months into course</span>
                  </Badge>
                  <Badge variant="primary" size="sm" className="gap-1.5 px-2.5 py-0.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>4 Modules Ready</span>
                  </Badge>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-nexus-text tracking-tight group-hover:text-nexus-accent transition-colors">
                  CMCE
                </h2>
                <p className="text-sm font-semibold text-nexus-text-secondary mt-0.5">
                  Common Module Comprehensive Examination
                </p>
              </div>

              <p className="text-xs sm:text-sm text-nexus-text-muted leading-relaxed">
                {EXAM_STAGES.cmce.description}
              </p>

              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-nexus-text-muted flex items-center justify-between">
                  <span>Curriculum Modules</span>
                  <span className="font-mono text-[10px] text-nexus-text-muted">{cmceModules.length} Modules</span>
                </div>
                <ul className="space-y-1.5">
                  {cmceModules.map((module, idx) => (
                    <li
                      key={module.id}
                      className="flex items-center gap-2.5 text-xs sm:text-sm text-nexus-text-secondary group-hover:text-nexus-text transition-colors p-2.5 rounded-lg bg-nexus-elevated/40 border border-nexus-border/40"
                    >
                      <span className="shrink-0 w-5 h-5 rounded-md bg-nexus-surface border border-nexus-border flex items-center justify-center font-mono text-[10px] text-nexus-text-muted">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{module.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-nexus-text-muted/50 group-hover:text-nexus-accent transition-colors shrink-0" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center font-semibold"
                icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectStage('cmce');
                }}
              >
                CMCE Preparation →
              </Button>
            </div>
          </div>
        </Card>

        {/* CCEE Card */}
        <Card
          variant="default"
          padding="none"
          role="button"
          tabIndex={0}
          aria-label="Select Course Comprehensive End Examination (CCEE)"
          onClick={() => handleSelectStage('ccee')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectStage('ccee');
            }
          }}
          className="group flex flex-col justify-between overflow-hidden cursor-pointer rounded-2xl border border-nexus-border/80 bg-nexus-surface hover:border-nexus-accent/50 hover:shadow-card transition-all duration-200"
        >
          <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-xl bg-nexus-elevated border border-nexus-border text-nexus-text-secondary">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge variant="default" size="sm" className="gap-1.5 px-2.5 py-0.5">
                    <Clock className="w-3.5 h-3.5 text-nexus-text-muted" />
                    <span>{EXAM_STAGES.ccee.timing}</span>
                  </Badge>
                  <Badge variant="outline" size="sm" className="gap-1.5 px-2.5 py-0.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>5 Modules</span>
                  </Badge>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-nexus-text tracking-tight group-hover:text-nexus-accent transition-colors">
                  CCEE
                </h2>
                <p className="text-sm font-semibold text-nexus-text-secondary mt-0.5">
                  Course Comprehensive End Examination
                </p>
              </div>

              <p className="text-xs sm:text-sm text-nexus-text-muted leading-relaxed">
                {EXAM_STAGES.ccee.description}
              </p>

              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-nexus-text-muted flex items-center justify-between">
                  <span>Curriculum Modules</span>
                  <span className="font-mono text-[10px] text-nexus-text-muted">{cceeModules.length} Modules</span>
                </div>
                <ul className="space-y-1.5">
                  {cceeModules.map((module, idx) => (
                    <li
                      key={module.id}
                      className="flex items-center gap-2.5 text-xs sm:text-sm text-nexus-text-secondary group-hover:text-nexus-text transition-colors p-2.5 rounded-lg bg-nexus-elevated/40 border border-nexus-border/40"
                    >
                      <span className="shrink-0 w-5 h-5 rounded-md bg-nexus-surface border border-nexus-border flex items-center justify-center font-mono text-[10px] text-nexus-text-muted">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{module.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-nexus-text-muted/50 group-hover:text-nexus-accent transition-colors shrink-0" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-center font-semibold"
                icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectStage('ccee');
                }}
              >
                CCEE Overview →
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Editorial Highlights Section */}
      <div className="rounded-2xl bg-nexus-elevated/50 border border-nexus-border/60 p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-semibold text-nexus-text">Curriculum Study Highlights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-nexus-text block">7,783 Verified Questions</span>
            <p className="text-nexus-text-secondary leading-relaxed">
              Complete question banks across Computer Networks, C & Python, COSA Linux/Windows, and DevOps.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-nexus-text block">Official Explanations</span>
            <p className="text-nexus-text-secondary leading-relaxed">
              Option-by-option rationale, distractor breakdown, and CDAC curriculum references.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-nexus-text block">Exam Environment Simulation</span>
            <p className="text-nexus-text-secondary leading-relaxed">
              Realistic countdown timer, question navigator, mark for review, and diagnostic scoring reports.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-nexus-border/40 text-center">
        <p className="text-xs text-nexus-text-muted">
          PGCP-ITISS at CDAC • Built for exam success
        </p>
      </footer>
    </div>
  );
};
