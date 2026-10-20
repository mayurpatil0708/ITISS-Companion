/**
 * Exam Stage Context — Tracks which exam stage (CMCE/CCEE) the user is viewing.
 * Persisted to localStorage so the selection survives page reloads.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ExamStage, EXAM_STAGES, ExamStageDefinition, getModulesByStage, ModuleDefinition } from '@/data/module-registry';

const STAGE_STORAGE_KEY = 'itiss_selected_exam_stage';

interface ExamStageContextType {
  /** Currently selected exam stage (null = on homepage / selection screen) */
  currentStage: ExamStage | null;
  /** Set the active exam stage */
  setStage: (stage: ExamStage) => void;
  /** Clear stage selection (return to homepage) */
  clearStage: () => void;
  /** Get the definition for the current stage */
  stageDefinition: ExamStageDefinition | null;
  /** Get modules for the current stage */
  currentModules: ModuleDefinition[];
}

const ExamStageContext = createContext<ExamStageContextType | undefined>(undefined);

export const ExamStageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStage, setCurrentStage] = useState<ExamStage | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STAGE_STORAGE_KEY);
      if (stored === 'cmce' || stored === 'ccee') return stored;
    } catch {
      // Ignore localStorage errors
    }
    return null;
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      if (currentStage) {
        localStorage.setItem(STAGE_STORAGE_KEY, currentStage);
      } else {
        localStorage.removeItem(STAGE_STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [currentStage]);

  const setStage = useCallback((stage: ExamStage) => {
    setCurrentStage(stage);
  }, []);

  const clearStage = useCallback(() => {
    setCurrentStage(null);
  }, []);

  const stageDefinition = currentStage ? EXAM_STAGES[currentStage] : null;
  const currentModules = currentStage ? getModulesByStage(currentStage) : [];

  return (
    <ExamStageContext.Provider value={{ currentStage, setStage, clearStage, stageDefinition, currentModules }}>
      {children}
    </ExamStageContext.Provider>
  );
};

export const useExamStage = (): ExamStageContextType => {
  const context = useContext(ExamStageContext);
  if (!context) {
    throw new Error('useExamStage must be used within an ExamStageProvider');
  }
  return context;
};
