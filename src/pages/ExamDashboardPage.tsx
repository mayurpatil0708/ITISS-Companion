import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Shield,
  Clock,
  CheckCircle2,
  Lock,
  Monitor,
  Network,
  Code2,
  Cloud,
  ClipboardCheck,
  ShieldCheck,
  Search,
  Key,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { APP_CONFIG } from '@/config/app.config';
import {
  ExamStage,
  EXAM_STAGES,
  getModulesByStage,
  ModuleDefinition,
  isModuleAvailable,
} from '@/data/module-registry';
import { useExamStage } from '@/context/ExamStageContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { Question } from '@/types';

const ICON_MAP: Record<string, React.FC<any>> = {
  Network,
  Code2,
  Monitor,
  Cloud,
  ClipboardCheck,
  ShieldCheck,
  Search,
  Key,
  ShieldAlert,
  BookOpen,
  Shield,
};

export const ExamDashboardPage: React.FC = () => {
  const { stage } = useParams<{ stage: string }>();
  const navigate = useNavigate();
  const { setStage } = useExamStage();

  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
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
        for (const mod of availableModules) {
          if (mod.subjectMapping && mod.subjectMapping.length > 0) {
            counts[mod.id] = allQuestions.filter((q) =>
              mod.subjectMapping.includes(q.subject)
            ).length;
          } else {
            counts[mod.id] = 0;
          }
        }

        setQuestionCounts(counts);
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

  const getModuleIcon = (iconName: string): React.FC<any> => {
    return ICON_MAP[iconName] || BookOpen;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Area */}
      <div className="space-y-4">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-nexus-text-secondary hover:text-nexus-text transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>← Back to Exam Selection</span>
          </Link>
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-nexus-accent/10 border border-nexus-accent/20 text-nexus-accent text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-nexus-accent" />
            {APP_CONFIG.courseName}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight">
            {stageDef.name} Preparation
          </h1>
          <p className="text-base text-nexus-text font-medium">
            {stageDef.fullName}
          </p>
          <p className="text-sm text-nexus-text-secondary max-w-3xl leading-relaxed">
            {stageDef.description}
          </p>
        </div>

        {/* Status Pills / Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="cyan" size="md">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            {stageDef.moduleCount} Modules
          </Badge>
          <Badge variant="default" size="md">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {stageDef.timing}
          </Badge>
          {hasAvailableModules && (
            <Badge variant="success" size="md">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              {availableModules.length} Available Now
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Module Cards Grid (2 cols desktop, 1 col mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modules.map((module) => {
          const IconComponent = getModuleIcon(module.icon);
          const isAvailable = module.contentStatus === 'available';

          return (
            <Card
              key={module.id}
              variant={isAvailable ? 'interactive' : 'default'}
              padding="lg"
              className={`relative flex flex-col justify-between ${
                !isAvailable
                  ? 'opacity-60 cursor-not-allowed select-none'
                  : 'group hover:border-nexus-accent/40 transition-all'
              }`}
              onClick={() => {
                if (isAvailable) {
                  navigate(`/${stage}/${module.slug}`);
                }
              }}
            >
              <div>
                {/* Header row: Icon & Status */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div
                    className={`p-3 rounded-lg border ${
                      module.accentColor ||
                      'border-nexus-border bg-nexus-elevated text-nexus-text'
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                        <span className="text-xs font-medium text-nexus-success">Available</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-nexus-text-muted" />
                        <Badge variant="outline" size="sm">
                          Coming Soon
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Module full name */}
                <h3 className="text-lg font-bold text-nexus-text tracking-tight group-hover:text-nexus-accent transition-colors">
                  {module.name}
                </h3>

                {/* Module short description */}
                <p className="text-sm text-nexus-text-secondary mt-2 line-clamp-3 leading-relaxed">
                  {module.description}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Badge variant="outline" size="sm">
                    <Clock className="w-3 h-3 mr-1" />
                    {module.durationHours} hrs
                  </Badge>
                  <Badge variant="outline" size="sm">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {module.topicCount} topics
                  </Badge>
                  {isAvailable && (
                    <Badge variant="cyan" size="sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {isLoadingCounts
                        ? 'Loading...'
                        : `${questionCounts[module.id] ?? 0} questions`}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Footer / Action */}
              <div className="pt-6 mt-6 border-t border-nexus-border flex items-center justify-between">
                {isAvailable ? (
                  <>
                    <span className="text-xs text-nexus-text-muted">
                      Curriculum module {module.order} of {modules.length}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ArrowRight className="w-4 h-4" />}
                      iconPosition="right"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${stage}/${module.slug}`);
                      }}
                    >
                      Start Practice
                    </Button>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between text-xs text-nexus-text-muted">
                    <span>Curriculum module {module.order} of {modules.length}</span>
                    <span className="italic flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Coming Soon
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. Quick Actions Section (only if available modules exist) */}
      {hasAvailableModules && (
        <Card variant="elevated" padding="lg" className="border-nexus-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-nexus-text tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-nexus-accent" />
                <span>Quick Actions</span>
              </h2>
              <p className="text-sm text-nexus-text-secondary leading-relaxed">
                Launch customized practice sessions, full timed mock exams, or review your historical performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => navigate('/practice')}
              >
                Practice All Questions
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<Shield className="w-4 h-4" />}
                onClick={() => navigate('/exam')}
              >
                Mock Exam
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={<BarChart3 className="w-4 h-4" />}
                onClick={() => navigate('/analytics')}
              >
                View Analytics
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
