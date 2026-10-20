import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ExamStageProvider } from '@/context/ExamStageContext';
import { AppLayout } from '@/components/layout/AppLayout';

import { ExamSelectionPage } from '@/pages/ExamSelectionPage';
import { ExamDashboardPage } from '@/pages/ExamDashboardPage';
import { ModuleWorkspacePage } from '@/pages/ModuleWorkspacePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PracticeSetupPage } from '@/pages/PracticeSetupPage';
import { MockExamPage } from '@/pages/MockExamPage';
import { ActiveQuizPage } from '@/pages/ActiveQuizPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { TopicExplorerPage } from '@/pages/TopicExplorerPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { QuestionBankPage } from '@/pages/QuestionBankPage';
import { SettingsPage } from '@/pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <ExamStageProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                {/* 1. Root: Exam Selection Landing Page */}
                <Route index element={<ExamSelectionPage />} />

                {/* 2. Legacy / Direct Overview */}
                <Route path="overview" element={<DashboardPage />} />

                {/* 3. Stage Dashboards & Module Workspaces */}
                <Route path=":stage" element={<ExamDashboardPage />} />
                <Route path=":stage/:moduleSlug" element={<ModuleWorkspacePage />} />

                {/* 4. Module-Level Tools */}
                <Route path=":stage/:moduleSlug/practice" element={<PracticeSetupPage />} />
                <Route path=":stage/:moduleSlug/topics" element={<TopicExplorerPage />} />
                <Route path=":stage/:moduleSlug/exam" element={<MockExamPage />} />
                <Route path=":stage/:moduleSlug/review" element={<ReviewPage />} />

                {/* 5. Stage-Level Tools */}
                <Route path=":stage/practice" element={<PracticeSetupPage />} />
                <Route path=":stage/practice/linux" element={<PracticeSetupPage />} />
                <Route path=":stage/practice/windows" element={<PracticeSetupPage />} />
                <Route path=":stage/practice/cross-platform" element={<PracticeSetupPage />} />
                <Route path=":stage/topics" element={<TopicExplorerPage />} />
                <Route path=":stage/exam" element={<MockExamPage />} />
                <Route path=":stage/quiz/:quizId" element={<ActiveQuizPage />} />
                <Route path=":stage/results/:attemptId" element={<ResultsPage />} />
                <Route path=":stage/review" element={<ReviewPage />} />
                <Route path=":stage/analytics" element={<AnalyticsPage />} />
                <Route path=":stage/question-bank" element={<QuestionBankPage />} />

                {/* 6. Root-Level Direct Tool Routes (Backwards Compatibility) */}
                <Route path="practice" element={<PracticeSetupPage />} />
                <Route path="practice/linux" element={<PracticeSetupPage />} />
                <Route path="practice/windows" element={<PracticeSetupPage />} />
                <Route path="practice/cross-platform" element={<PracticeSetupPage />} />
                <Route path="topics" element={<TopicExplorerPage />} />
                <Route path="exam" element={<MockExamPage />} />
                <Route path="quiz/:quizId" element={<ActiveQuizPage />} />
                <Route path="results/:attemptId" element={<ResultsPage />} />
                <Route path="review" element={<ReviewPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="question-bank" element={<QuestionBankPage />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ExamStageProvider>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
