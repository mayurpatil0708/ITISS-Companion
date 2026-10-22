import React, { useState } from 'react';
import {
  Settings,
  User,
  Sliders,
  Moon,
  Sun,
  Shield,
  Trash2,
  HardDrive,
  RefreshCw,
  Check,
  Volume2,
  Keyboard,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { APP_CONFIG } from '@/config/app.config';

export const SettingsPage: React.FC = () => {
  const { preferences, updatePreferences, addNotification, totalQuestionsCount } = useApp();
  const { theme, setTheme } = useTheme();

  const [userName, setUserName] = useState(preferences.userName);
  const [passingThreshold, setPassingThreshold] = useState(preferences.practicePassingThreshold);
  const [defaultTimer, setDefaultTimer] = useState(preferences.defaultTimerMinutes);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(preferences.keyboardShortcutsEnabled);
  const [soundEnabled, setSoundEnabled] = useState(preferences.soundEnabled);

  const [isClearAttemptsModalOpen, setIsClearAttemptsModalOpen] = useState(false);
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      userName,
      practicePassingThreshold: passingThreshold,
      defaultTimerMinutes: defaultTimer,
      keyboardShortcutsEnabled: keyboardShortcuts,
      soundEnabled,
    });

    addNotification({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Your candidate settings have been successfully saved.',
    });
  };

  const handleClearAttempts = async () => {
    try {
      await questionRepository.clearAttempts();
      setIsClearAttemptsModalOpen(false);
      addNotification({
        type: 'info',
        title: 'Attempts Cleared',
        message: 'All examination and practice session records have been wiped.',
      });
    } catch (e) {
      console.error(e);
      alert('Failed to clear attempts');
    }
  };

  const handleResetAllData = async () => {
    try {
      await questionRepository.resetAllData();
      setIsResetAllModalOpen(false);
      addNotification({
        type: 'success',
        title: 'System Factory Reset',
        message: 'IndexedDB re-initialized with all 7,783 verified CDAC questions across all 4 CMCE modules.',
      });
    } catch (e) {
      console.error(e);
      alert('Failed to reset system data');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Configuration Engine</Badge>
          <span className="text-xs font-mono text-nexus-text-muted">v{APP_CONFIG.version}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-nexus-text tracking-tight mt-1">
          Preferences & Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-nexus-text-secondary mt-1">
          Customize candidate profiling, examination benchmark targets, accessibility keys, and local database storage.
        </p>
      </div>

      <form onSubmit={handleSaveGeneral} className="space-y-6">
        {/* Candidate Profile */}
        <Card padding="md">
          <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-nexus-accent" />
            Candidate Identity
          </h3>

          <div className="space-y-3 max-w-md">
            <div>
              <label className="text-xs font-medium text-nexus-text block mb-1">
                Candidate Name / Handle
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-nexus-elevated border border-nexus-border rounded px-3 py-2 text-xs text-nexus-text focus:outline-none focus:border-nexus-accent"
                placeholder="e.g. Mayur Patil"
              />
              <span className="text-[11px] text-nexus-text-muted mt-1 block">
                Displayed across scorecards, diagnostic reports, and assessment dashboards.
              </span>
            </div>
          </div>
        </Card>

        {/* Assessment Benchmark Settings */}
        <Card padding="md">
          <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-nexus-cyan" />
            Practice Benchmark Settings
          </h3>

          <div className="space-y-4 max-w-md">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-nexus-text">
                  Practice Passing Threshold Target:
                </label>
                <span className="font-mono font-bold text-nexus-cyan text-sm">
                  {passingThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={passingThreshold}
                onChange={(e) => setPassingThreshold(Number(e.target.value))}
                className="w-full accent-nexus-cyan"
              />
              <span className="text-[11px] text-nexus-text-muted mt-1 block">
                Practice benchmark setting used for diagnostic scorecard evaluation.
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-nexus-text block mb-1">
                Default Exam Timer (Minutes)
              </label>
              <input
                type="number"
                min="10"
                max="180"
                step="5"
                value={defaultTimer}
                onChange={(e) => setDefaultTimer(Number(e.target.value))}
                className="w-32 bg-nexus-elevated border border-nexus-border rounded px-3 py-1.5 text-xs text-nexus-text focus:outline-none focus:border-nexus-accent"
              />
            </div>
          </div>
        </Card>

        {/* Theme & Display Options */}
        <Card padding="md">
          <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-4 flex items-center gap-2">
            <Moon className="w-4 h-4 text-nexus-accent" />
            Theme & Design System
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  theme === 'dark'
                    ? 'bg-nexus-elevated border-nexus-accent text-nexus-text ring-1 ring-nexus-accent shadow-xs'
                    : 'bg-nexus-elevated/40 border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated'
                }`}
              >
                <Moon className="w-5 h-5 text-nexus-accent shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-nexus-text">Dark (Netflix × Spotify)</span>
                    {theme === 'dark' && <Badge variant="primary" size="sm">Active</Badge>}
                  </div>
                  <p className="text-[11px] text-nexus-text-muted leading-relaxed">
                    Cinematic browsing, dark charcoal surfaces, Netflix warm red CTAs, and Spotify green progress cues.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  theme === 'light'
                    ? 'bg-nexus-surface border-nexus-accent text-nexus-text ring-1 ring-nexus-accent shadow-xs'
                    : 'bg-nexus-elevated/40 border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-nexus-text">Light (Apple Inspired)</span>
                    {theme === 'light' && <Badge variant="primary" size="sm">Active</Badge>}
                  </div>
                  <p className="text-[11px] text-nexus-text-muted leading-relaxed">
                    Refined editorial layouts, warm ivory canvas, deep charcoal typography, and calm sage accents.
                  </p>
                </div>
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-nexus-border">
              <label className="flex items-center gap-2 text-xs text-nexus-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={keyboardShortcuts}
                  onChange={(e) => setKeyboardShortcuts(e.target.checked)}
                  className="rounded text-nexus-accent focus:ring-nexus-accent"
                />
                <span className="text-nexus-text">Enable Hotkeys (Ctrl+K, 1-4, Arrow Keys)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-nexus-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded text-nexus-accent focus:ring-nexus-accent"
                />
                <span className="text-nexus-text">Sound feedback cues on answer submission</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Save CTA */}
        <div className="flex justify-end">
          <Button variant="primary" size="md" type="submit">
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Storage & Data Integrity Panel */}
      <Card padding="md" className="border-t-2 border-t-nexus-error">
        <h3 className="text-xs font-semibold text-nexus-text uppercase tracking-wider mb-2 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-nexus-error" />
          Local Storage & Data Integrity
        </h3>
        <p className="text-xs text-nexus-text-secondary leading-relaxed mb-4">
          All questions and candidate attempts are stored client-side in persistent IndexedDB. Clear specific data stores or reset to initial factory benchmarks below.
        </p>

        <div className="p-3 rounded bg-nexus-elevated/40 border border-nexus-border font-mono text-xs text-nexus-text-muted mb-4 space-y-1">
          <div>Platform: <strong>{APP_CONFIG.name}</strong></div>
          <div>Storage Engine: <strong>HTML5 IndexedDB (Local-First)</strong></div>
          <div>Active Questions Stored: <strong>{totalQuestionsCount} records</strong></div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearAttemptsModalOpen(true)}
          >
            Clear Attempt History
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsResetAllModalOpen(true)}
          >
            Factory Reset Database
          </Button>
        </div>
      </Card>

      {/* Clear Attempts Modal */}
      {isClearAttemptsModalOpen && (
        <Modal
          isOpen={isClearAttemptsModalOpen}
          onClose={() => setIsClearAttemptsModalOpen(false)}
          title="Clear Attempt History"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-nexus-text-secondary leading-relaxed">
              This will remove all saved examination attempts and results history. Your question bank and bookmarks will remain intact.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsClearAttemptsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleClearAttempts}>
                Clear All Attempts
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset All Modal */}
      {isResetAllModalOpen && (
        <Modal
          isOpen={isResetAllModalOpen}
          onClose={() => setIsResetAllModalOpen(false)}
          title="Reset Everything to Factory Defaults"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-nexus-text-secondary leading-relaxed">
              This will reset the local database and re-seed the default 446 CDAC questions. All custom question edits, bookmarks, and attempts will be permanently erased.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsResetAllModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleResetAllData}>
                Confirm Factory Reset
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
