import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  BarChart3,
  GraduationCap,
  RotateCcw,
  Play,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';
import {
  ExamStage,
  EXAM_STAGES,
  getModulesByStage,
  ModuleDefinition,
  isModuleAvailable,
} from '@/data/module-registry';
import { useExamStage } from '@/context/ExamStageContext';
import { useTheme } from '@/context/ThemeContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { Question } from '@/types';

export const ExamDashboardPage: React.FC = () => {
  const { stage } = useParams<{ stage: string }>();
  const navigate = useNavigate();
  const { setStage } = useExamStage();
  const { theme } = useTheme();

  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [totalStageQuestions, setTotalStageQuestions] = useState<number>(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(true);

  const isValidStage = stage === 'cmce' || stage === 'ccee';
  const currentStage = isValidStage ? (stage as ExamStage) : null;

  useEffect(() => {
    if (!stage || (stage !== 'cmce' && stage !== 'ccee')) {
      navigate('/', { replace: true });
      return;
    }
    setStage(stage as ExamStage);
  }, [stage, navigate, setStage]);

  useEffect(() => {
    if (!isValidStage || !currentStage) return;

    let isMounted = true;

    const loadQuestionCounts = async () => {
      try {
        setIsLoadingCounts(true);
        const stageModules = getModulesByStage(currentStage);
        const availableModules = stageModules.filter(
          (m) => m.contentStatus === 'available' || isModuleAvailable(m.id)
        );

        if (availableModules.length === 0) {
          if (isMounted) setIsLoadingCounts(false);
          return;
        }

        const allQuestions: Question[] = await questionRepository.getAllQuestions();
        if (!isMounted) return;

        const counts: Record<string, number> = {};
        let total = 0;
        for (const mod of availableModules) {
          if (mod.subjectMapping && mod.subjectMapping.length > 0) {
            const count = allQuestions.filter((q) =>
              mod.subjectMapping.includes(q.subject)
            ).length;
            counts[mod.id] = count;
            total += count;
          } else {
            counts[mod.id] = 0;
          }
        }

        setQuestionCounts(counts);
        setTotalStageQuestions(total || (currentStage === 'cmce' ? 7783 : 0));
      } catch (err) {
        console.error('Failed to load question counts:', err);
      } finally {
        if (isMounted) {
          setIsLoadingCounts(false);
        }
      }
    };

    loadQuestionCounts();

    return () => {
      isMounted = false;
    };
  }, [isValidStage, currentStage]);

  if (!isValidStage || !currentStage) {
    return null;
  }

  const stageDef = EXAM_STAGES[currentStage];
  const modules: ModuleDefinition[] = getModulesByStage(currentStage);
  const availableModules = modules.filter(
    (m) => m.contentStatus === 'available' || isModuleAvailable(m.id)
  );
  const hasAvailableModules = availableModules.length > 0;

  // ─────────────────────────────────────────────────────────────
  // 1. DARK THEME — Netflix × Spotify Inspired Stage Dashboard
  // ─────────────────────────────────────────────────────────────
  if (theme === 'dark') {
    return (
      <div className="w-full max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-12 animate-fadeIn select-none">
        {/* Navigation & Header */}
        <section className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Platform Overview</span>
          </Link>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-neutral-300 text-xs font-mono tracking-wider uppercase">
              <span>{currentStage.toUpperCase()} Track • CDAC PGCP-ITISS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              {stageDef.name} Preparation
            </h1>
            <p className="text-lg sm:text-xl font-medium text-neutral-300">
              {stageDef.fullName}
            </p>
          </div>

          <p className="text-sm sm:text-base text-neutral-400 max-w-3xl leading-relaxed">
            {stageDef.description}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-white/10 text-neutral-200">
              {stageDef.moduleCount} Modules
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-neutral-200">
              {stageDef.timing}
            </span>
            {hasAvailableModules && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                {availableModules.length} Modules Available
              </span>
            )}
            {totalStageQuestions > 0 && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-neutral-300">
                {totalStageQuestions.toLocaleString()} Total Questions
              </span>
            )}
          </div>
        </section>

        {/* Modules Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
              Curriculum Modules
            </h2>
            <span className="text-xs text-neutral-500 font-mono">Select a module workspace</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modules.map((mod, idx) => {
              const isAvailable = mod.contentStatus === 'available';
              const count = questionCounts[mod.id] ?? 0;

              return (
                <div
                  key={mod.id}
                  onClick={() => {
                    if (isAvailable) {
                      navigate(`/${stage}/${mod.slug}`);
                    }
                  }}
                  className={`group rounded-2xl bg-[#161619] border p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                    isAvailable
                      ? 'border-white/10 hover:border-white/20 hover:bg-[#1a1a1e] cursor-pointer shadow-lg hover:shadow-2xl'
                      : 'border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-neutral-400 font-bold">
                        MODULE 0{idx + 1}
                      </span>
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-neutral-400 text-xs font-mono">
                          <Lock className="w-3.5 h-3.5" /> Coming Soon
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight group-hover:text-neutral-100 transition-colors">
                        {mod.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono text-neutral-400">
                      <span className="px-2.5 py-1 rounded bg-white/[0.03]">
                        {mod.durationHours} Hours
                      </span>
                      <span className="px-2.5 py-1 rounded bg-white/[0.03]">
                        {mod.topicCount} Topics
                      </span>
                      {isAvailable && (
                        <span className="px-2.5 py-1 rounded bg-white/[0.03] text-neutral-300">
                          {isLoadingCounts ? '...' : `${count.toLocaleString()} Questions`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-400">
                      {isAvailable ? 'Comprehensive materials included' : 'Scheduled for later phase'}
                    </span>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-nexus-accent hover:bg-nexus-accent-hover text-white dark:text-[#101316] text-xs font-bold tracking-wide transition-all shadow-md group-hover:translate-x-0.5 active:scale-[0.98]">
                        Open Workspace
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-neutral-400 italic flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stage-Level Rapid Tools */}
        {hasAvailableModules && (
          <section className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
                Stage Practice Tools
              </h2>
              <span className="text-xs text-neutral-500 font-mono">Comprehensive stage prep</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => navigate(`/${stage}/practice`)}
                className="group rounded-xl bg-[#141416] border border-white/5 hover:border-white/15 p-5 cursor-pointer transition-all hover:bg-[#18181c] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-neutral-400">CROSS-MODULE</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-neutral-100">
                  Practice All {currentStage.toUpperCase()} Questions
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Generate customized practice sets across all 4 foundational modules.
                </p>
              </div>

              <div
                onClick={() => navigate(`/${stage}/exam`)}
                className="group rounded-xl bg-[#141416] border border-white/5 hover:border-white/15 p-5 cursor-pointer transition-all hover:bg-[#18181c] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-neutral-400">EXAM SIMULATION</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-neutral-100">
                  Full Stage Mock Exam
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Timed CDAC assessment covering all subjects with comprehensive scoring.
                </p>
              </div>

              <div
                onClick={() => navigate(`/${stage}/review`)}
                className="group rounded-xl bg-[#141416] border border-white/5 hover:border-white/15 p-5 cursor-pointer transition-all hover:bg-[#18181c] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-neutral-400">REVISION</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-neutral-100">
                  Review Mistakes
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Target questions answered incorrectly in previous practice attempts.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LIGHT THEME — Apple Editorial Minimalist Stage Dashboard
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto py-10 sm:py-16 px-4 sm:px-6 lg:px-8 space-y-16 animate-fadeIn select-none text-[#1d1d1f]">
      {/* Navigation & Editorial Header */}
      <section className="space-y-4 max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Platform Overview</span>
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2f2f7] text-[#6e6e73] text-xs font-mono uppercase tracking-wider">
            <span>{currentStage.toUpperCase()} Track • CDAC PGCP-ITISS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
            {stageDef.name} Preparation
          </h1>
          <p className="text-lg sm:text-xl font-medium text-[#6e6e73]">
            {stageDef.fullName}
          </p>
        </div>

        <p className="text-base text-[#86868b] leading-relaxed">
          {stageDef.description}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-white border border-[#e5e5ea] text-[#6e6e73]">
            {stageDef.moduleCount} Modules
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-[#e5e5ea] text-[#6e6e73]">
            {stageDef.timing}
          </span>
          {hasAvailableModules && (
            <span className="px-3 py-1 rounded-full bg-[#2e5a44]/10 text-[#2e5a44] font-semibold">
              {availableModules.length} Modules Available
            </span>
          )}
          {totalStageQuestions > 0 && (
            <span className="px-3 py-1 rounded-full bg-white border border-[#e5e5ea] text-[#6e6e73]">
              {totalStageQuestions.toLocaleString()} Questions
            </span>
          )}
        </div>
      </section>

      {/* Modules Grid */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-[#86868b]">
            Curriculum Modules
          </h2>
          <span className="text-xs text-[#86868b] font-mono">Select a module workspace</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {modules.map((mod, idx) => {
            const isAvailable = mod.contentStatus === 'available';
            const count = questionCounts[mod.id] ?? 0;

            return (
              <div
                key={mod.id}
                onClick={() => {
                  if (isAvailable) {
                    navigate(`/${stage}/${mod.slug}`);
                  }
                }}
                className={`group rounded-3xl bg-white border p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 ${
                  isAvailable
                    ? 'border-[#e5e5ea] hover:border-[#d1d1d6] cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
                    : 'border-[#f0f0f3] opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#86868b] font-semibold">
                      MODULE 0{idx + 1}
                    </span>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nexus-accent/10 text-nexus-accent text-xs font-mono font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f2f7] text-[#86868b] text-xs font-mono">
                        <Lock className="w-3.5 h-3.5" /> Coming Soon
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight group-hover:text-nexus-accent transition-colors">
                      {mod.name}
                    </h3>
                    <p className="text-sm text-[#86868b] mt-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono text-[#86868b]">
                    <span className="px-3 py-1 rounded-lg bg-[#fbfbfd] border border-[#f0f0f3]">
                      {mod.durationHours} Hours
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#fbfbfd] border border-[#f0f0f3]">
                      {mod.topicCount} Topics
                    </span>
                    {isAvailable && (
                      <span className="px-3 py-1 rounded-lg bg-[#fbfbfd] border border-[#f0f0f3] text-[#1d1d1f]">
                        {isLoadingCounts ? '...' : `${count.toLocaleString()} Questions`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-[#f2f2f7] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#86868b]">
                    {isAvailable ? 'Materials ready' : 'Future phase'}
                  </span>
                  {isAvailable ? (
                    <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-nexus-accent hover:bg-nexus-accent-hover text-white text-xs font-semibold tracking-wide transition-all shadow-sm group-hover:translate-x-0.5 active:scale-[0.98]">
                      Open Workspace
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-[#86868b] italic flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stage-Level Rapid Tools */}
      {hasAvailableModules && (
        <section className="space-y-5 pt-4 border-t border-[#f2f2f7]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-[#86868b]">
              Stage Practice Tools
            </h2>
            <span className="text-xs text-[#86868b] font-mono">Comprehensive stage prep</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div
              onClick={() => navigate(`/${stage}/practice`)}
              className="group rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-2 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#86868b]">CROSS-MODULE</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-[#1d1d1f] group-hover:text-nexus-accent transition-colors">
                Practice All {currentStage.toUpperCase()} Questions
              </h4>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Generate customized practice sets across all 4 foundational modules.
              </p>
            </div>

            <div
              onClick={() => navigate(`/${stage}/exam`)}
              className="group rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-2 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#86868b]">EXAM SIMULATION</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-[#1d1d1f] group-hover:text-nexus-accent transition-colors">
                Full Stage Mock Exam
              </h4>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Timed CDAC assessment covering all subjects with comprehensive scoring.
              </p>
            </div>

            <div
              onClick={() => navigate(`/${stage}/review`)}
              className="group rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-2 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#86868b]">REVISION</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-[#1d1d1f] group-hover:text-nexus-accent transition-colors">
                Review Mistakes
              </h4>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Target questions answered incorrectly in previous practice attempts.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
