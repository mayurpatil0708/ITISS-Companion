import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  BookOpen,
  Layers,
  GraduationCap,
  Database,
  Compass,
  FileCheck2,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { EXAM_STAGES, getModulesByStage, ExamStage, ModuleDefinition } from '@/data/module-registry';
import { useExamStage } from '@/context/ExamStageContext';
import { useTheme } from '@/context/ThemeContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { AttemptRecord } from '@/types';

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
  // 1. DARK THEME — Netflix × Spotify Inspired Cinematic Experience
  // ─────────────────────────────────────────────────────────────
  if (theme === 'dark') {
    return (
      <div className="w-full max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-14 animate-fadeIn select-none">
        {/* Editorial Brand Hero */}
        <section className="space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-neutral-300 text-xs font-mono tracking-wider uppercase">
            <span>PGCP-ITISS Certification Platform</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              ITISS Companion
            </h1>
            <p className="text-xl sm:text-2xl font-medium text-neutral-200">
              Your PGCP-ITISS journey, organized.
            </p>
          </div>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
            Study smarter for CMCE and CCEE with structured learning resources, practical guides, MCQs, mock examinations, and focused revision.
          </p>
        </section>

        {/* Two Prominent Entry Points (CMCE & CCEE) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
              Examination Stages
            </h2>
            <span className="text-xs text-neutral-500 font-mono hidden sm:inline">Select your current milestone</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* CMCE Preparation Card */}
            <div
              onClick={() => handleSelectStage('cmce')}
              className="group relative rounded-2xl bg-[#161619] border border-white/10 hover:border-white/20 p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:bg-[#1a1a1e]"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-semibold tracking-wide">
                    STAGE 01 • ACTIVE
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    ~3 Months into course
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:text-neutral-100 transition-colors">
                    CMCE Preparation
                  </h3>
                  <p className="text-sm font-medium text-neutral-400 mt-1">
                    Common Module Comprehensive Examination
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  {EXAM_STAGES.cmce.description}
                </p>

                {/* Module List Preview */}
                <div className="pt-2 space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                    Included Modules (4 Ready)
                  </div>
                  <div className="space-y-1.5">
                    {cmceModules.map((mod, idx) => (
                      <div
                        key={mod.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] text-xs text-neutral-300 group-hover:text-white transition-colors"
                      >
                        <span className="font-mono text-neutral-400 text-[11px] mr-2">0{idx + 1}</span>
                        <span className="font-medium truncate flex-1">{mod.name}</span>
                        <span className="font-mono text-[11px] text-neutral-400 shrink-0 ml-3">{mod.durationHours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct CTA */}
              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400">
                  {totalQuestions.toLocaleString()} Practice Questions
                </span>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e50914] hover:bg-[#f40612] text-white text-xs font-bold tracking-wide transition-all shadow-md group-hover:translate-x-0.5">
                  CMCE Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* CCEE Preparation Card */}
            <div
              onClick={() => handleSelectStage('ccee')}
              className="group relative rounded-2xl bg-[#141416]/90 border border-white/5 hover:border-white/15 p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:bg-[#18181c]"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-neutral-300 text-xs font-mono font-semibold tracking-wide">
                    STAGE 02 • SPECIALIZATION
                  </span>
                  <span className="text-xs text-neutral-500 font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3" /> End-Term Examination
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:text-neutral-100 transition-colors">
                    CCEE Preparation
                  </h3>
                  <p className="text-sm font-medium text-neutral-400 mt-1">
                    Course Comprehensive End Examination
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  {EXAM_STAGES.ccee.description}
                </p>

                {/* Module List Preview */}
                <div className="pt-2 space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                    Advanced Specialization Modules (5 Tracks)
                  </div>
                  <div className="space-y-1.5">
                    {cceeModules.map((mod, idx) => (
                      <div
                        key={mod.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors"
                      >
                        <span className="font-mono text-neutral-400 text-[11px] mr-2">0{idx + 1}</span>
                        <span className="font-medium truncate flex-1">{mod.name}</span>
                        <span className="font-mono text-[11px] text-neutral-400 shrink-0 ml-3">{mod.durationHours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct CTA */}
              <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400">
                  {EXAM_STAGES.ccee.timing}
                </span>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold tracking-wide transition-all group-hover:translate-x-0.5">
                  CCEE Overview
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Continue Learning OR Curated Starting Recommendation */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
              {recentAttempt ? 'Continue Learning' : 'Curated Curriculum Starting Point'}
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              {recentAttempt ? 'Active session on this device' : 'Recommended baseline'}
            </span>
          </div>

          {recentAttempt ? (
            <div className="rounded-xl bg-[#18181c] border border-white/10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 uppercase">
                    Session In Progress
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">Mode: {recentAttempt.mode}</span>
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  {recentAttempt.title}
                </h4>
                <p className="text-xs text-neutral-400">
                  {recentAttempt.items.length} questions •{' '}
                  {recentAttempt.items.filter((i) => i.selectedOptionId).length} completed
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() =>
                    navigate(
                      recentAttempt.isCompleted
                        ? `/results/${recentAttempt.id}`
                        : `/quiz/${recentAttempt.id}`
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e50914] hover:bg-[#f40612] text-white text-xs font-bold transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {recentAttempt.isCompleted ? 'Review Results' : 'Resume Session'}
                </button>
                <button
                  onClick={() => handleSelectStage('cmce')}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-medium transition-colors"
                >
                  Switch Module
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#18181c] border border-white/10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/10 text-neutral-300 uppercase">
                    CMCE Module 01 Recommended
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">2,103 Questions</span>
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  Fundamental of Computer Networks (FCN)
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Start with the foundational core: OSI 7-layer architecture, IPv4/IPv6 CIDR subnetting, Ethernet switching, and dynamic routing protocols.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigate('/cmce/fcn/practice')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e50914] hover:bg-[#f40612] text-white text-xs font-bold transition-colors shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start Practice
                </button>
                <button
                  onClick={() => navigate('/cmce/fcn')}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-medium transition-colors"
                >
                  Explore Curriculum
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Section: Your Modules */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
                Your Modules
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Current CMCE active curriculum modules ready for study
              </p>
            </div>
            <button
              onClick={() => handleSelectStage('cmce')}
              className="text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              View all 4 modules →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cmceModules.map((mod, idx) => (
              <div
                key={mod.id}
                onClick={() => navigate(`/cmce/${mod.slug}`)}
                className="group rounded-xl bg-[#161619] border border-white/5 hover:border-white/20 p-5 flex flex-col justify-between cursor-pointer transition-all hover:bg-[#1b1b1f]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-neutral-500 font-bold">
                      0{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Available
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-neutral-100 transition-colors">
                      {mod.name}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-mono text-[11px]">{mod.durationHours}h • {mod.topicCount} topics</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Study Resources */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
              Study Resources
            </h2>
            <span className="text-xs text-neutral-500 font-mono">Curriculum tools & revision</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => navigate('/cmce/practice')}
              className="group rounded-xl bg-[#141416] border border-white/5 hover:border-white/15 p-5 cursor-pointer transition-all hover:bg-[#18181c] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-neutral-400">PRACTICE</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-neutral-100">
                MCQ Practice Engine
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Filter and test across technical subjects with sequential A–D choices and full explanations.
              </p>
            </div>

            <div
              onClick={() => navigate('/cmce/exam')}
              className="group rounded-xl bg-[#141416] border border-white/5 hover:border-white/15 p-5 cursor-pointer transition-all hover:bg-[#18181c] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-neutral-400">EXAMINATION</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-neutral-100">
                Full Mock Exam
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Simulate timed CDAC exam conditions with 50 randomized questions and diagnostic review.
              </p>
            </div>

            <div
              onClick={() => navigate('/cmce/review')}
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
                Focus on previous errors, bookmarks, and questions requiring deeper conceptual study.
              </p>
            </div>

            <div
              onClick={() => navigate('/cmce/topics')}
              className="group rounded-xl bg-[#141416] border border-white/5 hover:border-white/15 p-5 cursor-pointer transition-all hover:bg-[#18181c] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-neutral-400">EXPLORER</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-neutral-100">
                Curriculum Topics
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Browse detailed syllabus breakdown, curriculum objectives, and reference materials.
              </p>
            </div>
          </div>
        </section>

        {/* Minimal Subtle Footer */}
        <footer className="pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-neutral-400 font-mono">
            PGCP-ITISS • Centre for Development of Advanced Computing (C-DAC)
          </p>
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LIGHT THEME — Apple Editorial Minimalist Experience
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto py-10 sm:py-16 px-4 sm:px-6 lg:px-8 space-y-16 animate-fadeIn select-none text-[#1d1d1f]">
      {/* Editorial Hero Section */}
      <section className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2f2f7] text-[#6e6e73] text-xs font-mono uppercase tracking-wider">
          <span>PGCP-ITISS Certification Hub</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1d1d1f] tracking-tight leading-tight">
            ITISS Companion
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-[#6e6e73]">
            Your PGCP-ITISS journey, organized.
          </p>
        </div>

        <p className="text-base text-[#86868b] leading-relaxed">
          Study smarter for CMCE and CCEE with structured learning resources, practical guides, MCQs, mock examinations, and focused revision.
        </p>
      </section>

      {/* Two Prominent Entry Points (CMCE & CCEE) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-[#86868b]">
            Examination Stages
          </h2>
          <span className="text-xs text-[#86868b] font-mono hidden sm:inline">Select your examination target</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CMCE Preparation Card */}
          <div
            onClick={() => handleSelectStage('cmce')}
            className="group relative rounded-3xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#2e5a44]/10 text-[#2e5a44] text-xs font-mono font-semibold tracking-wide">
                  STAGE 1 • MID-TERM
                </span>
                <span className="text-xs text-[#86868b] font-mono">
                  ~3 months into course
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] tracking-tight group-hover:text-[#2e5a44] transition-colors">
                  CMCE Preparation
                </h3>
                <p className="text-sm font-medium text-[#6e6e73] mt-1">
                  Common Module Comprehensive Examination
                </p>
              </div>

              <p className="text-sm text-[#86868b] leading-relaxed">
                {EXAM_STAGES.cmce.description}
              </p>

              {/* Module List Preview */}
              <div className="pt-2 space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#86868b]">
                  Curriculum Modules (4 Ready)
                </div>
                <div className="space-y-1.5">
                  {cmceModules.map((mod, idx) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#fbfbfd] border border-[#f0f0f3] text-xs text-[#1d1d1f] group-hover:border-[#e5e5ea] transition-colors"
                    >
                      <span className="font-mono text-[#86868b] text-[11px] mr-2.5">0{idx + 1}</span>
                      <span className="font-medium truncate flex-1">{mod.name}</span>
                      <span className="font-mono text-[11px] text-[#86868b] shrink-0 ml-3">{mod.durationHours} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct CTA */}
            <div className="pt-8 mt-8 border-t border-[#f2f2f7] flex items-center justify-between">
              <span className="text-xs font-mono text-[#86868b]">
                {totalQuestions.toLocaleString()} Verified MCQs
              </span>
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold tracking-wide transition-all group-hover:translate-x-0.5">
                CMCE Preparation
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* CCEE Preparation Card */}
          <div
            onClick={() => handleSelectStage('ccee')}
            className="group relative rounded-3xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f2f2f7] text-[#6e6e73] text-xs font-mono font-semibold tracking-wide">
                  STAGE 2 • END-TERM
                </span>
                <span className="text-xs text-[#86868b] font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Specialization Phase
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] tracking-tight group-hover:text-[#2e5a44] transition-colors">
                  CCEE Preparation
                </h3>
                <p className="text-sm font-medium text-[#6e6e73] mt-1">
                  Course Comprehensive End Examination
                </p>
              </div>

              <p className="text-sm text-[#86868b] leading-relaxed">
                {EXAM_STAGES.ccee.description}
              </p>

              {/* Module List Preview */}
              <div className="pt-2 space-y-2.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#86868b]">
                  Advanced Tracks (5 Modules)
                </div>
                <div className="space-y-1.5">
                  {cceeModules.map((mod, idx) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#fbfbfd] border border-[#f0f0f3] text-xs text-[#6e6e73] group-hover:text-[#1d1d1f] transition-colors"
                    >
                      <span className="font-mono text-[#86868b] text-[11px] mr-2.5">0{idx + 1}</span>
                      <span className="font-medium truncate flex-1">{mod.name}</span>
                      <span className="font-mono text-[11px] text-[#86868b] shrink-0 ml-3">{mod.durationHours} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct CTA */}
            <div className="pt-8 mt-8 border-t border-[#f2f2f7] flex items-center justify-between">
              <span className="text-xs font-mono text-[#86868b]">
                {EXAM_STAGES.ccee.timing}
              </span>
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#f2f2f7] hover:bg-[#e5e5ea] text-[#1d1d1f] text-xs font-semibold tracking-wide transition-all group-hover:translate-x-0.5">
                CCEE Overview
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Learning OR Curated Starting Point */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-[#86868b]">
            {recentAttempt ? 'Continue Learning' : 'Curated Curriculum Starting Point'}
          </h2>
          <span className="text-xs text-[#86868b] font-mono">
            {recentAttempt ? 'Saved session on this device' : 'Recommended starting place'}
          </span>
        </div>

        {recentAttempt ? (
          <div className="rounded-2xl bg-white border border-[#e5e5ea] p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_1px_6px_rgba(0,0,0,0.02)]">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#2e5a44]/10 text-[#2e5a44] uppercase">
                  Session In Progress
                </span>
                <span className="text-xs text-[#86868b] font-mono">Mode: {recentAttempt.mode}</span>
              </div>
              <h4 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                {recentAttempt.title}
              </h4>
              <p className="text-xs text-[#86868b]">
                {recentAttempt.items.length} questions •{' '}
                {recentAttempt.items.filter((i) => i.selectedOptionId).length} completed
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() =>
                  navigate(
                    recentAttempt.isCompleted
                      ? `/results/${recentAttempt.id}`
                      : `/quiz/${recentAttempt.id}`
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {recentAttempt.isCompleted ? 'Review Results' : 'Resume Session'}
              </button>
              <button
                onClick={() => handleSelectStage('cmce')}
                className="px-4 py-2.5 rounded-full bg-[#f2f2f7] hover:bg-[#e5e5ea] text-[#1d1d1f] text-xs font-medium transition-colors"
              >
                Switch Module
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-[#e5e5ea] p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_1px_6px_rgba(0,0,0,0.02)]">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#f2f2f7] text-[#6e6e73] uppercase">
                  CMCE Module 01 Foundation
                </span>
                <span className="text-xs text-[#86868b] font-mono">2,103 Questions</span>
              </div>
              <h4 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                Fundamental of Computer Networks (FCN)
              </h4>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Begin your preparation with networking fundamentals: OSI architecture, subnetting algorithms, Ethernet switching, and routing protocols.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/cmce/fcn/practice')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Practice
              </button>
              <button
                onClick={() => navigate('/cmce/fcn')}
                className="px-4 py-2.5 rounded-full bg-[#f2f2f7] hover:bg-[#e5e5ea] text-[#1d1d1f] text-xs font-medium transition-colors"
              >
                Explore Curriculum
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Section: Your Modules */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-[#86868b]">
              Your Modules
            </h2>
            <p className="text-xs text-[#86868b] mt-0.5">
              Foundational CMCE examination subjects
            </p>
          </div>
          <button
            onClick={() => handleSelectStage('cmce')}
            className="text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
          >
            View all 4 modules →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cmceModules.map((mod, idx) => (
            <div
              key={mod.id}
              onClick={() => navigate(`/cmce/${mod.slug}`)}
              className="group rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#86868b] font-semibold">
                    0{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono text-[#2e5a44] bg-[#2e5a44]/10 px-2 py-0.5 rounded-full">
                    Ready
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#2e5a44] transition-colors">
                    {mod.name}
                  </h4>
                  <p className="text-xs text-[#86868b] mt-1 line-clamp-2 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#f2f2f7] flex items-center justify-between text-xs text-[#86868b]">
                <span className="font-mono text-[11px]">{mod.durationHours} hrs • {mod.topicCount} topics</span>
                <ChevronRight className="w-4 h-4 text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Study Resources */}
      <section className="space-y-5 pt-4 border-t border-[#f2f2f7]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-[#86868b]">
            Study Resources
          </h2>
          <span className="text-xs text-[#86868b] font-mono">Curriculum tools & revision</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/cmce/practice')}
            className="group rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#86868b]">PRACTICE</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#2e5a44] transition-colors">
              MCQ Practice Engine
            </h4>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Drill topic-by-topic with canonical A–D options and official curriculum rationales.
            </p>
          </div>

          <div
            onClick={() => navigate('/cmce/exam')}
            className="group rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#86868b]">EXAMINATION</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#2e5a44] transition-colors">
              Full Mock Exam
            </h4>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Simulate realistic exam conditions with 50 randomized questions and diagnostic feedback.
            </p>
          </div>

          <div
            onClick={() => navigate('/cmce/review')}
            className="group rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#86868b]">REVISION</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#2e5a44] transition-colors">
              Review Mistakes
            </h4>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Focus on incorrect attempts, bookmarked questions, and high-difficulty areas.
            </p>
          </div>

          <div
            onClick={() => navigate('/cmce/topics')}
            className="group rounded-2xl bg-white border border-[#e5e5ea] hover:border-[#d1d1d6] p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#86868b]">EXPLORER</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#86868b] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#2e5a44] transition-colors">
              Curriculum Topics
            </h4>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Review comprehensive syllabus outlines, subject topics, and learning objectives.
            </p>
          </div>
        </div>
      </section>

      {/* Minimal Editorial Footer */}
      <footer className="pt-8 border-t border-[#f2f2f7] text-center">
        <p className="text-xs text-[#86868b] font-mono">
          PGCP-ITISS • Centre for Development of Advanced Computing (C-DAC)
        </p>
      </footer>
    </div>
  );
};
