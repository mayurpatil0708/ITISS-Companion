import { describe, it, expect } from 'vitest';
import { AnalyticsService } from '../src/services/analytics/analytics.service';
import { AttemptRecord } from '../src/types';

describe('AnalyticsService Calculations', () => {
  it('correctly calculates study streak based on attempt dates', () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2);

    const attempts: AttemptRecord[] = [
      {
        id: '1',
        mode: 'practice',
        title: 'T1',
        subjectFilter: 'all',
        startedAt: today.toISOString(),
        totalQuestions: 10,
        timeSpentSeconds: 60,
        isCompleted: true,
        items: [],
      },
      {
        id: '2',
        mode: 'practice',
        title: 'T2',
        subjectFilter: 'all',
        startedAt: yesterday.toISOString(),
        totalQuestions: 10,
        timeSpentSeconds: 60,
        isCompleted: true,
        items: [],
      },
      {
        id: '3',
        mode: 'practice',
        title: 'T3',
        subjectFilter: 'all',
        startedAt: twoDaysAgo.toISOString(),
        totalQuestions: 10,
        timeSpentSeconds: 60,
        isCompleted: true,
        items: [],
      },
    ];

    const streak = AnalyticsService.calculateStreak(attempts);
    expect(streak).toBe(3);
  });

  it('returns 0 streak if user has not attempted questions today or yesterday', () => {
    const fourDaysAgo = new Date(Date.now() - 86400000 * 4);
    const attempts: AttemptRecord[] = [
      {
        id: '1',
        mode: 'practice',
        title: 'Old Attempt',
        subjectFilter: 'all',
        startedAt: fourDaysAgo.toISOString(),
        totalQuestions: 10,
        timeSpentSeconds: 60,
        isCompleted: true,
        items: [],
      },
    ];

    const streak = AnalyticsService.calculateStreak(attempts);
    expect(streak).toBe(0);
  });
});
