import { describe, it, expect, beforeEach } from 'vitest';
import { questionRepository } from '../src/services/storage/indexeddb.repository';
import { QuizService } from '../src/services/quiz/quiz.service';
import { QuestionOption } from '../src/types';

describe('ITISS Companion: Dual Design System & Theme Consistency', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes and persists theme preference without data corruption', () => {
    // Default or stored preference
    questionRepository.savePreferences({ theme: 'dark' });
    let prefs = questionRepository.getPreferences();
    expect(prefs.theme).toBe('dark');

    // Switch to Apple light theme
    questionRepository.savePreferences({ theme: 'light' });
    prefs = questionRepository.getPreferences();
    expect(prefs.theme).toBe('light');

    // Switch back to Netflix/Spotify dark theme
    questionRepository.savePreferences({ theme: 'dark' });
    prefs = questionRepository.getPreferences();
    expect(prefs.theme).toBe('dark');
  });

  it('guarantees canonical A, B, C, D sequence for MCQ options in both themes', () => {
    const scrambledOptions: QuestionOption[] = [
      { id: 'C', text: 'Third option' },
      { id: 'A', text: 'First option' },
      { id: 'D', text: 'Fourth option' },
      { id: 'B', text: 'Second option' },
    ];

    const sorted = QuizService.sortOptionsCanonically(scrambledOptions);

    expect(sorted.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D']);
    expect(sorted[0].text).toBe('First option');
    expect(sorted[1].text).toBe('Second option');
    expect(sorted[2].text).toBe('Third option');
    expect(sorted[3].text).toBe('Fourth option');
  });

  it('preserves correct answer mappings when options are prepared for display', () => {
    const mockQuestion = {
      question_id: 'test_q1',
      correct_option_id: 'B',
      options: [
        { id: 'D', text: 'Delta' },
        { id: 'A', text: 'Alpha' },
        { id: 'C', text: 'Charlie' },
        { id: 'B', text: 'Bravo' },
      ],
    };

    const displayOpts = QuizService.prepareDisplayOptions(mockQuestion.options, false);

    // Display options must be sorted A-D
    expect(displayOpts.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D']);

    // The option with id 'B' must still be 'Bravo' (the correct answer)
    const correctOpt = displayOpts.find((o) => o.id === mockQuestion.correct_option_id);
    expect(correctOpt).toBeDefined();
    expect(correctOpt!.text).toBe('Bravo');
  });
});
