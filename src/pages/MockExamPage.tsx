import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Clock,
  Award,
  AlertTriangle,
  Play,
  Terminal,
  Server,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { QuizService } from '@/services/quiz/quiz.service';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { APP_CONFIG } from '@/config/app.config';

export const MockExamPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);
  const [examType, setExamType] = useState<'standard' | 'focused_linux' | 'focused_windows'>('standard');

  const startMockExam = async () => {
    setIsLaunching(true);
    try {
      let subject: 'all' | 'linux' | 'windows' = 'all';
      let count = 50;
      let timerMinutes = 60;

      if (examType === 'focused_linux') {
        subject = 'linux';
        count = 40;
        timerMinutes = 45;
      } else if (examType === 'focused_windows') {
        subject = 'windows';
        count = 40;
        timerMinutes = 45;
      }

      const attempt = await QuizService.createAttempt({
        subject,
        topics: [],
        difficulty: 'mixed',
        questionCount: count,
        selection: 'randomized',
        mode: 'exam',
        randomizeQuestions: true,
        randomizeOptions: true,
        timeLimitMinutes: timerMinutes,
      });

      navigate(`/quiz/${attempt.id}`);
    } catch (e: unknown) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to initialize mock exam');
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">Certification Simulation</Badge>
          <span className="text-xs font-mono text-nexus-text-muted">CDAC CCEE Exam Environment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight mt-1">
          Full Mock Examination
        </h1>
        <p className="text-xs sm:text-sm text-nexus-text-secondary mt-1">
          Simulate official CDAC CMCE / CCEE testing conditions with a timed, comprehensive assessment across all curriculum domains.
        </p>
      </div>

      {/* Exam Standards Card */}
      <Card variant="elevated" padding="lg" className="border-t-2 border-t-amber-400">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-nexus-text">Official Examination Format</h2>
            <p className="text-xs text-nexus-text-secondary mt-1 leading-relaxed">
              Standard CDAC testing protocol involves multiple-choice single-correct questions testing practical system administration, command syntax, process control, Active Directory structures, and cross-platform authentication.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
              <div className="p-2.5 rounded bg-nexus-surface border border-nexus-border">
                <span className="text-nexus-text-muted block text-[10px]">TIME ALLOTTED</span>
                <span className="text-nexus-text font-bold">60 Minutes</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-surface border border-nexus-border">
                <span className="text-nexus-text-muted block text-[10px]">TOTAL QUESTIONS</span>
                <span className="text-nexus-text font-bold">50 Questions</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-surface border border-nexus-border">
                <span className="text-nexus-text-muted block text-[10px]">PASS BENCHMARK</span>
                <span className="text-nexus-cyan font-bold">70% Target</span>
              </div>
              <div className="p-2.5 rounded bg-nexus-surface border border-nexus-border">
                <span className="text-nexus-text-muted block text-[10px]">NEGATIVE MARKING</span>
                <span className="text-nexus-text font-bold">None</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Preset Selection */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-nexus-text uppercase tracking-wider block">
          Choose Examination Preset
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Preset 1: Standard Comprehensive */}
          <div
            onClick={() => setExamType('standard')}
            className={`p-4 rounded border cursor-pointer transition-all flex flex-col justify-between ${
              examType === 'standard'
                ? 'bg-nexus-accent/10 border-nexus-accent shadow-xs'
                : 'bg-nexus-surface border-nexus-border hover:bg-nexus-elevated'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="primary">Full Suite</Badge>
                <Clock className="w-4 h-4 text-nexus-text-muted" />
              </div>
              <h3 className="text-sm font-bold text-nexus-text">CDAC CMCE Comprehensive</h3>
              <p className="text-[11px] text-nexus-text-secondary mt-1">
                Balanced distribution: 22 Linux & OS, 24 Windows Server, 4 Cross-platform questions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-nexus-border/60 text-[11px] font-mono text-nexus-text-muted">
              50 Questions • 60 Mins
            </div>
          </div>

          {/* Preset 2: Focused Linux & OS */}
          <div
            onClick={() => setExamType('focused_linux')}
            className={`p-4 rounded border cursor-pointer transition-all flex flex-col justify-between ${
              examType === 'focused_linux'
                ? 'bg-indigo-500/10 border-indigo-500 shadow-xs'
                : 'bg-nexus-surface border-nexus-border hover:bg-nexus-elevated'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="default">Linux Specialization</Badge>
                <Terminal className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-nexus-text">Linux & OS Specialist Exam</h3>
              <p className="text-[11px] text-nexus-text-secondary mt-1">
                Deep dive into processes, ELF layout, systemd, LVM, permissions, and network services.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-nexus-border/60 text-[11px] font-mono text-nexus-text-muted">
              40 Questions • 45 Mins
            </div>
          </div>

          {/* Preset 3: Focused Windows Server */}
          <div
            onClick={() => setExamType('focused_windows')}
            className={`p-4 rounded border cursor-pointer transition-all flex flex-col justify-between ${
              examType === 'focused_windows'
                ? 'bg-cyan-500/10 border-cyan-500 shadow-xs'
                : 'bg-nexus-surface border-nexus-border hover:bg-nexus-elevated'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="cyan">Windows Specialization</Badge>
                <Server className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-nexus-text">Windows Server Specialist</h3>
              <p className="text-[11px] text-nexus-text-secondary mt-1">
                Full Active Directory, Group Policy, FSMO, Hyper-V, and PowerShell cmdlet mastery.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-nexus-border/60 text-[11px] font-mono text-nexus-text-muted">
              40 Questions • 45 Mins
            </div>
          </div>
        </div>
      </div>

      {/* Instructions & Guidelines */}
      <Card padding="md" className="bg-nexus-elevated/40">
        <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-nexus-cyan" />
          Candidate Guidelines
        </h3>
        <ul className="space-y-1.5 text-xs text-nexus-text-secondary list-disc pl-4">
          <li>Answers will remain hidden until you explicitly submit your examination attempt.</li>
          <li>You can navigate back and forth freely between questions using the Question Navigator grid.</li>
          <li>Mark questions for review if you need to double-check your answers before final submission.</li>
          <li>The countdown timer automatically tracks your elapsed time; your progress is saved automatically across refreshes.</li>
        </ul>
      </Card>

      {/* Action CTA */}
      <div className="flex justify-end pt-4">
        <Button
          variant="primary"
          size="lg"
          isLoading={isLaunching}
          icon={<Play className="w-4 h-4 fill-current" />}
          onClick={startMockExam}
        >
          Begin Mock Examination Now
        </Button>
      </div>
    </div>
  );
};
