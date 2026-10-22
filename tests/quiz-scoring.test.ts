import { describe, it, expect } from 'vitest';
import { QuizService } from '../src/services/quiz/quiz.service';
import { AttemptRecord, Question } from '../src/types';

describe('QuizService & Scoring Engine', () => {
  const dummyQuestions: Question[] = [
    {
      question_id: 'Q-01',
      subject: 'linux',
      topic_id: 'LIN-T1',
      subtopic_id: 'LIN-S1',
      topic: 'Storage',
      subtopic: 'LVM',
      difficulty: 'foundational',
      question_type: 'conceptual',
      question_text: 'What command creates a physical volume in LVM?',
      options: [
        { id: 'A', text: 'pvcreate' },
        { id: 'B', text: 'vgcreate' },
        { id: 'C', text: 'lvcreate' },
        { id: 'D', text: 'mkfs' },
      ],
      correct_option_id: 'A',
      explanation: 'pvcreate initializes a disk or partition for LVM.',
      option_explanations: { A: 'Correct', B: 'Incorrect', C: 'Incorrect', D: 'Incorrect' },
      source: { document_id: 'devendraCOSA' },
      tags: ['lvm'],
    },
    {
      question_id: 'Q-02',
      subject: 'linux',
      topic_id: 'LIN-T1',
      subtopic_id: 'LIN-S1',
      topic: 'Storage',
      subtopic: 'LVM',
      difficulty: 'intermediate',
      question_type: 'command_syntax',
      question_text: 'What command creates a volume group?',
      options: [
        { id: 'A', text: 'pvcreate' },
        { id: 'B', text: 'vgcreate' },
        { id: 'C', text: 'lvcreate' },
        { id: 'D', text: 'mkfs' },
      ],
      correct_option_id: 'B',
      explanation: 'vgcreate creates volume groups.',
      option_explanations: { A: 'Incorrect', B: 'Correct', C: 'Incorrect', D: 'Incorrect' },
      source: { document_id: 'devendraCOSA' },
      tags: ['lvm'],
    },
    {
      question_id: 'Q-03',
      subject: 'windows',
      topic_id: 'WIN-T1',
      subtopic_id: 'WIN-S1',
      topic: 'Active Directory',
      subtopic: 'OUs',
      difficulty: 'advanced',
      question_type: 'scenario',
      question_text: 'Which container holds delegated users and computers?',
      options: [
        { id: 'A', text: 'OU' },
        { id: 'B', text: 'Site' },
        { id: 'C', text: 'Forest Root' },
        { id: 'D', text: 'Global Catalog' },
      ],
      correct_option_id: 'A',
      explanation: 'OUs provide containment for GPO links and delegation.',
      option_explanations: { A: 'Correct', B: 'Incorrect', C: 'Incorrect', D: 'Incorrect' },
      source: { document_id: 'amitCOSA' },
      tags: ['ou'],
    },
  ];

  it('correctly shuffles options without corrupting original option IDs', () => {
    const originalOptions = dummyQuestions[0].options;
    const shuffled = QuizService.prepareDisplayOptions(originalOptions, true);

    expect(shuffled.length).toBe(4);
    const ids = shuffled.map((o) => o.id).sort();
    expect(ids).toEqual(['A', 'B', 'C', 'D']);
  });

  it('accurately calculates raw score, percentage, correct and incorrect answers', () => {
    const mockAttempt: AttemptRecord = {
      id: 'test_attempt_1',
      mode: 'practice',
      title: 'Practice Test',
      subjectFilter: 'all',
      totalQuestions: 3,
      startedAt: new Date().toISOString(),
      timeSpentSeconds: 120,
      isCompleted: false,
      items: [
        {
          questionId: 'Q-01',
          originalQuestion: dummyQuestions[0],
          displayOptions: dummyQuestions[0].options,
          selectedOptionId: 'A', // Correct
          isMarkedForReview: false,
          timeSpentSeconds: 40,
        },
        {
          questionId: 'Q-02',
          originalQuestion: dummyQuestions[1],
          displayOptions: dummyQuestions[1].options,
          selectedOptionId: 'C', // Incorrect (Key is B)
          isMarkedForReview: true,
          timeSpentSeconds: 50,
        },
        {
          questionId: 'Q-03',
          originalQuestion: dummyQuestions[2],
          displayOptions: dummyQuestions[2].options,
          selectedOptionId: null, // Unanswered
          isMarkedForReview: false,
          timeSpentSeconds: 30,
        },
      ],
    };

    const breakdown = QuizService.calculateScore(mockAttempt);

    expect(breakdown.total).toBe(3);
    expect(breakdown.rawScore).toBe(1);
    expect(breakdown.correctCount).toBe(1);
    expect(breakdown.incorrectCount).toBe(1);
    expect(breakdown.unansweredCount).toBe(1);
    expect(breakdown.accuracyPct).toBe(33); // 1 out of 3 = 33%

    // Topic breakdown verification
    expect(breakdown.topicBreakdown['Storage']).toBeDefined();
    expect(breakdown.topicBreakdown['Storage'].total).toBe(2);
    expect(breakdown.topicBreakdown['Storage'].correct).toBe(1);
    expect(breakdown.topicBreakdown['Storage'].accuracyPct).toBe(50);

    // Difficulty breakdown verification
    expect(breakdown.difficultyBreakdown.foundational.correct).toBe(1);
    expect(breakdown.difficultyBreakdown.intermediate.correct).toBe(0);
  });

  it('guarantees canonical A-D display order even if options array is stored scrambled', () => {
    const scrambledOptions = [
      { id: 'C', text: 'Option C' },
      { id: 'A', text: 'Option A' },
      { id: 'D', text: 'Option D' },
      { id: 'B', text: 'Option B' },
    ];

    const sorted = QuizService.sortOptionsCanonically(scrambledOptions);
    expect(sorted.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D']);
    expect(sorted[0].text).toBe('Option A');
    expect(sorted[1].text).toBe('Option B');
    expect(sorted[2].text).toBe('Option C');
    expect(sorted[3].text).toBe('Option D');

    // prepareDisplayOptions with default/false randomize preserves canonical order
    const display = QuizService.prepareDisplayOptions(scrambledOptions, false);
    expect(display.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('preserves correct answer reference and scoring after canonical sorting', () => {
    const scrambledQuestion: Question = {
      question_id: 'SCRAMBLE-01',
      subject: 'linux',
      topic_id: 'T1',
      subtopic_id: 'S1',
      topic: 'Processes',
      subtopic: 'Signals',
      difficulty: 'intermediate',
      question_type: 'conceptual',
      question_text: 'Which signal cannot be caught or ignored?',
      options: [
        { id: 'C', text: 'SIGINT' },
        { id: 'D', text: 'SIGKILL' },
        { id: 'A', text: 'SIGTERM' },
        { id: 'B', text: 'SIGHUP' },
      ],
      correct_option_id: 'D',
      explanation: 'SIGKILL (9) cannot be caught or ignored.',
      option_explanations: { D: 'Correct', A: 'Incorrect', B: 'Incorrect', C: 'Incorrect' },
      source: { document_id: 'devendraCOSA' },
      tags: ['signals'],
    };

    const orderedOptions = QuizService.prepareDisplayOptions(scrambledQuestion.options, false);
    expect(orderedOptions.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D']);

    // Candidate selects the 4th option (SIGKILL, which has stable id D)
    const mockAttempt: AttemptRecord = {
      id: 'test_attempt_scramble',
      mode: 'practice',
      title: 'Scramble Test',
      subjectFilter: 'all',
      totalQuestions: 1,
      startedAt: new Date().toISOString(),
      timeSpentSeconds: 15,
      isCompleted: false,
      items: [
        {
          questionId: scrambledQuestion.question_id,
          originalQuestion: scrambledQuestion,
          displayOptions: orderedOptions,
          selectedOptionId: 'D', // Correct option selected
          isMarkedForReview: false,
          timeSpentSeconds: 15,
        },
      ],
    };

    const breakdown = QuizService.calculateScore(mockAttempt);
    expect(breakdown.correctCount).toBe(1);
    expect(breakdown.accuracyPct).toBe(100);

    // If candidate selects 'A' (SIGTERM), it should score incorrect
    mockAttempt.items[0].selectedOptionId = 'A';
    const failBreakdown = QuizService.calculateScore(mockAttempt);
    expect(failBreakdown.correctCount).toBe(0);
    expect(failBreakdown.incorrectCount).toBe(1);
  });

  it('handles questions with 2, 3, or 5 options in canonical sequence', () => {
    const twoOptions = [
      { id: 'B', text: 'False' },
      { id: 'A', text: 'True' },
    ];
    expect(QuizService.sortOptionsCanonically(twoOptions).map((o) => o.id)).toEqual(['A', 'B']);

    const fiveOptions = [
      { id: 'E', text: 'All of the above' },
      { id: 'C', text: 'Three' },
      { id: 'A', text: 'One' },
      { id: 'D', text: 'Four' },
      { id: 'B', text: 'Two' },
    ];
    expect(QuizService.sortOptionsCanonically(fiveOptions).map((o) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});
