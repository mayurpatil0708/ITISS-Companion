import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';

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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
