import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BookOpenCheck, Shield, ArrowRight, Clock, Layers, ChevronRight } from 'lucide-react';
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
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* 1. Clear, Welcoming Hero Section without excessive glow */}
      <div className="rounded-2xl bg-nexus-surface border border-nexus-border/80 p-8 sm:p-12 text-center shadow-subtle">
        <div className="flex flex-col items-center max-w-3xl mx-auto space-y-4">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center p-3.5 rounded-xl bg-nexus-accent/10 border border-nexus-accent/20 text-nexus-accent">
            <BookOpenCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-nexus-text tracking-tight">
            Your PGCP-ITISS Journey, Organized.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-nexus-text-secondary max-w-2xl leading-relaxed">
            Prepare for CMCE and CCEE with structured study resources, technical notes, practical guides, MCQs, mock tests, and focused revision—all in one place.
          </p>
        </div>
      </div>

      {/* 2. Two Distinctive, Balanced Exam Stage Entry Points */}
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
                    <span>4 Modules Ready</span>
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

            {/* Action Button */}
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
          className="group flex flex-col justify-between overflow-hidden cursor-pointer rounded-2xl border border-nexus-border/80 bg-nexus-surface hover:border-nexus-cyan/50 hover:shadow-card transition-all duration-200"
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
                      className="flex items-center gap-2.5 text-xs sm:text-sm text-nexus-text-secondary group-hover:text-nexus-text transition-colors p-2.5 rounded-lg bg-nexus-elevated/40 border border-nexus-border/40"
                    >
                      <span className="shrink-0 w-5 h-5 rounded-md bg-nexus-surface border border-nexus-border flex items-center justify-center font-mono text-[10px] text-nexus-text-muted">
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
                className="w-full justify-center font-semibold"
                icon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                iconPosition="right"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectStage('ccee');
                }}
              >
                CCEE Preparation →
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
