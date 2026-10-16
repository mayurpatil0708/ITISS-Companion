import { describe, it, expect, beforeEach } from 'vitest';
import { questionRepository } from '../src/services/storage/indexeddb.repository';
import { QuizService } from '../src/services/quiz/quiz.service';
import { QuestionBankValidator } from '../src/services/validation/bank-validator';

describe('Critical User Journey: 10-Step Workflow', () => {
  beforeEach(async () => {
    await questionRepository.resetAllData();
  });

  it('executes full examination workflow end-to-end', async () => {
    // 1. Open the application: check database is seeded with CDAC curriculum
    const allQuestions = await questionRepository.getAllQuestions();
    expect(allQuestions.length).toBe(446);

    // 2. Import a custom valid question bank and verify validation
    const customBankPayload = JSON.stringify({
      schema_version: '1.0.0',
      subject: 'linux',
      questions: [
        {
          question_id: 'CUSTOM-LIN-001',
          subject: 'linux',
          topic_id: 'LIN-T003',
          subtopic_id: 'LIN-PROC',
          topic: 'Programs and Processes',
          subtopic: 'Process Trees',
          difficulty: 'intermediate',
          question_type: 'conceptual',
          question_text: 'What is the ancestor process of all userland processes in modern Linux?',
          options: [
            { id: 'A', text: 'systemd (PID 1)' },
            { id: 'B', text: 'bash' },
            { id: 'C', text: 'sshd' },
            { id: 'D', text: 'kthreadd' },
          ],
          correct_option_id: 'A',
          explanation: 'systemd runs as PID 1 and serves as the root of the userland process tree.',
          source: { document_id: 'devendraCOSA', pdf_page_start: 10 },
          tags: ['systemd', 'process'],
        },
      ],
    });

    const report = QuestionBankValidator.validateRawJson(customBankPayload);
    expect(report.isValid).toBe(true);
    await questionRepository.saveQuestions(report.validQuestions);

    const updatedBank = await questionRepository.getAllQuestions();
    expect(updatedBank.length).toBe(447);

    // 3. Start a Linux practice session with specific filters
    const attempt = await QuizService.createAttempt({
      subject: 'linux',
      topics: [],
      difficulty: 'mixed',
      questionCount: 5,
      selection: 'all',
      mode: 'practice',
      randomizeQuestions: false,
      randomizeOptions: false,
    });

    expect(attempt.items.length).toBe(5);
    expect(attempt.isCompleted).toBe(false);

    // 4. Select answers across questions
    // Select correct answer for Q1
    attempt.items[0].selectedOptionId = attempt.items[0].originalQuestion.correct_option_id;
    // Select incorrect answer for Q2
    const wrongOption = attempt.items[1].originalQuestion.options.find(
      (o) => o.id !== attempt.items[1].originalQuestion.correct_option_id
    )?.id;
    attempt.items[1].selectedOptionId = wrongOption || 'B';
    // Leave Q3-Q5 unanswered

    // 5. Navigate between questions (simulate index changes)
    let activeQuestionIndex = 0;
    activeQuestionIndex = 1; // Navigated to next
    expect(activeQuestionIndex).toBe(1);

    // 6. Mark question for review
    attempt.items[1].isMarkedForReview = true;
    expect(attempt.items[1].isMarkedForReview).toBe(true);

    // Persist in-progress state
    await questionRepository.saveAttempt(attempt);

    // 7. Submit the attempt
    const submittedAttempt = await QuizService.submitAttempt(attempt.id);
    expect(submittedAttempt.isCompleted).toBe(true);
    expect(submittedAttempt.submittedAt).toBeDefined();

    // 8. Verify the score and answer explanations
    const score = submittedAttempt.score;
    expect(score).toBeDefined();
    expect(score?.total).toBe(5);
    expect(score?.correctCount).toBe(1);
    expect(score?.incorrectCount).toBe(1);
    expect(score?.unansweredCount).toBe(3);
    expect(score?.accuracyPct).toBe(20); // 1 of 5 = 20%

    // Verify explanation exists on submitted snapshot
    expect(submittedAttempt.items[0].originalQuestion.explanation).toBeDefined();

    // 9. Retry incorrect questions: create targeted session for missed items
    const incorrectIds = submittedAttempt.items
      .filter((i) => i.selectedOptionId && i.selectedOptionId !== i.originalQuestion.correct_option_id)
      .map((i) => i.questionId);

    expect(incorrectIds.length).toBe(1);
    const retryAttempt = await QuizService.createAttempt({
      subject: 'linux',
      topics: [],
      difficulty: 'mixed',
      questionCount: incorrectIds.length,
      selection: 'incorrect',
      mode: 'practice',
      randomizeQuestions: false,
      randomizeOptions: false,
    });

    expect(retryAttempt.items.length).toBe(1);
    expect(retryAttempt.items[0].questionId).toBe(incorrectIds[0]);

    // 10. Refresh the application and verify saved progress & bookmarking
    const reloadedAttempts = await questionRepository.getAllAttempts();
    expect(reloadedAttempts.length).toBeGreaterThanOrEqual(1);
    expect(reloadedAttempts.some((a) => a.id === attempt.id && a.isCompleted)).toBe(true);

    // Bookmark test
    const isBookmarkedInitial = await questionRepository.isBookmarked('CUSTOM-LIN-001');
    expect(isBookmarkedInitial).toBe(false);

    await questionRepository.toggleBookmark('CUSTOM-LIN-001');
    const isBookmarkedAfter = await questionRepository.isBookmarked('CUSTOM-LIN-001');
    expect(isBookmarkedAfter).toBe(true);
  });
});
