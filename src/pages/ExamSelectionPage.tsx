import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BookOpenCheck, Shield, ArrowRight, Clock, Layers, ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';
import { EXAM_STAGES, getModulesByStage, ExamStage } from '@/data/module-registry';
import { useExamStage } from '@/context/ExamStageContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

export const ExamSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { setStage } = useExamStage();

  const cmceModules = getModulesByStage('cmce');
  const cceeModules = getModulesByStage('ccee');

  const handleSelectStage = (stage: ExamStage) => {
    setStage(stage);
    navigate(`/${stage}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-10 animate-fadeIn">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-nexus-surface/90 via-nexus-surface/60 to-nexus-surface/30 border border-nexus-border p-8 sm:p-12 text-center shadow-subtle">
        {/* Subtle decorative radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-nexus-accent/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto space-y-4">
          {/* Logo Area */}
          <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-nexus-accent/10 border border-nexus-accent/25 text-nexus-accent shadow-subtle">
            <BookOpenCheck className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-nexus-text tracking-tight">
            ITISS Companion
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl font-medium text-nexus-text-secondary leading-snug">
            {APP_CONFIG.tagline}
          </p>

          {/* Small line */}
          <p className="text-xs sm:text-sm text-nexus-text-muted max-w-2xl leading-relaxed pt-1">
            {APP_CONFIG.description}
          </p>
        </div>
      </div>

      {/* Exam Stage Selection Cards */}
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
          className="group relative flex flex-col justify-between overflow-hidden cursor-pointer rounded-xl border border-nexus-border bg-nexus-surface hover:border-nexus-accent/60 hover:shadow-card hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300"
        >
          <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between gap-6">
            <div className="space-y-4">
              {/* Header: Icon & Badges */}
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
                    <span>4 Modules</span>
                  </Badge>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="text-2xl font-bold text-nexus-text tracking-tight group-hover:text-nexus-accent transition-colors">
                  CMCE
                </h2>
                <p className="text-sm font-semibold text-nexus-text-secondary mt-0.5">
                  Common Module Comprehensive Examination
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-nexus-text-muted leading-relaxed">
                {EXAM_STAGES.cmce.description}
              </p>

              {/* Module List */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-nexus-text-muted flex items-center justify-between">
                  <span>Curriculum Modules</span>
                  <span className="font-mono text-[10px] text-nexus-text-muted">{cmceModules.length} Modules</span>
                </div>
                <ul className="space-y-1.5">
                  {cmceModules.map((module, idx) => (
                    <li
                      key={module.id}
                      className="flex items-center gap-2.5 text-xs sm:text-sm text-nexus-text-secondary group-hover:text-nexus-text transition-colors p-2 rounded bg-nexus-elevated/40 border border-nexus-border/40"
                    >
                      <span className="shrink-0 w-5 h-5 rounded bg-nexus-surface border border-nexus-border flex items-center justify-center font-mono text-[10px] text-nexus-text-muted">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{module.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-nexus-text-muted/50 group-hover:text-nexus-accent transition-colors shrink-0" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center group-hover:bg-nexus-accent-hover font-semibold shadow-subtle"
                icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectStage('cmce');
                }}
              >
                Start Preparing
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
          className="group relative flex flex-col justify-between overflow-hidden cursor-pointer rounded-xl border border-nexus-border bg-nexus-surface hover:border-nexus-cyan/60 hover:shadow-card hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300"
        >
          <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between gap-6">
            <div className="space-y-4">
              {/* Header: Icon & Badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-xl bg-nexus-cyan/10 border border-nexus-cyan/20 text-nexus-cyan">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge variant="default" size="sm" className="gap-1.5 px-2.5 py-0.5">
                    <Clock className="w-3.5 h-3.5 text-nexus-text-muted" />
                    <span>{EXAM_STAGES.ccee.timing}</span>
                  </Badge>
                  <Badge variant="cyan" size="sm" className="gap-1.5 px-2.5 py-0.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>5 Modules</span>
                  </Badge>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="text-2xl font-bold text-nexus-text tracking-tight group-hover:text-nexus-cyan transition-colors">
                  CCEE
                </h2>
                <p className="text-sm font-semibold text-nexus-text-secondary mt-0.5">
                  Course Comprehensive End Examination
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-nexus-text-muted leading-relaxed">
                {EXAM_STAGES.ccee.description}
              </p>

              {/* Module List */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-nexus-text-muted flex items-center justify-between">
                  <span>Curriculum Modules</span>
                  <span className="font-mono text-[10px] text-nexus-text-muted">{cceeModules.length} Modules</span>
                </div>
                <ul className="space-y-1.5">
                  {cceeModules.map((module, idx) => (
                    <li
                      key={module.id}
                      className="flex items-center gap-2.5 text-xs sm:text-sm text-nexus-text-secondary group-hover:text-nexus-text transition-colors p-2 rounded bg-nexus-elevated/40 border border-nexus-border/40"
                    >
                      <span className="shrink-0 w-5 h-5 rounded bg-nexus-surface border border-nexus-border flex items-center justify-center font-mono text-[10px] text-nexus-text-muted">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{module.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-nexus-text-muted/50 group-hover:text-nexus-cyan transition-colors shrink-0" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Button
                variant="cyan"
                size="md"
                className="w-full justify-center group-hover:bg-nexus-cyan-hover font-semibold shadow-subtle"
                icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectStage('ccee');
                }}
              >
                Start Preparing
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Area */}
      <footer className="pt-6 border-t border-nexus-border/40 text-center">
        <p className="text-xs text-nexus-text-muted">
          PGCP-ITISS at CDAC • Built for exam success
        </p>
      </footer>
    </div>
  );
};
