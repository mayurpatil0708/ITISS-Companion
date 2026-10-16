import { describe, it, expect } from 'vitest';
import { QuestionBankValidator } from '../src/services/validation/bank-validator';

describe('QuestionBankValidator', () => {
  it('validates a correct question bank JSON', () => {
    const validJson = JSON.stringify({
      schema_version: '1.0.0',
      subject: 'linux',
      questions: [
        {
          question_id: 'TEST-001',
          subject: 'linux',
          topic_id: 'LIN-T001',
          subtopic_id: 'LIN-SUB-1',
          topic: 'OS and Linux Foundations',
          subtopic: 'Kernel Architectures',
          difficulty: 'intermediate',
          question_type: 'conceptual',
          question_text: 'What is the primary function of the Linux kernel?',
          options: [
            { id: 'A', text: 'Resource management and hardware abstraction' },
            { id: 'B', text: 'Text editing' },
            { id: 'C', text: 'Web browsing' },
            { id: 'D', text: 'Graphical layout' },
          ],
          correct_option_id: 'A',
          explanation: 'The kernel manages hardware resources and provides system call interfaces.',
          option_explanations: {
            A: 'Correct: Hardware abstraction and memory/process scheduling.',
            B: 'Incorrect: Handled by userland utilities.',
            C: 'Incorrect: Client software.',
            D: 'Incorrect: Desktop environment/compositor.',
          },
          source: {
            document_id: 'devendraCOSA',
            pdf_page_start: 1,
            pdf_page_end: 5,
          },
          tags: ['kernel', 'os'],
        },
      ],
    });

    const report = QuestionBankValidator.validateRawJson(validJson);
    expect(report.isValid).toBe(true);
    expect(report.validQuestions.length).toBe(1);
    expect(report.errors.length).toBe(0);
    expect(report.validQuestions[0].question_id).toBe('TEST-001');
  });

  it('rejects invalid JSON string', () => {
    const report = QuestionBankValidator.validateRawJson('{ invalid_json: 123');
    expect(report.isValid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors[0].message).toContain('JSON Parse Error');
  });

  it('detects duplicate question IDs within imported payload', () => {
    const duplicateJson = JSON.stringify({
      schema_version: '1.0.0',
      subject: 'windows',
      questions: [
        {
          question_id: 'DUP-001',
          subject: 'windows',
          topic_id: 'WIN-T001',
          subtopic_id: 'WIN-S1',
          topic: 'Active Directory',
          subtopic: 'Forests',
          difficulty: 'intermediate',
          question_type: 'conceptual',
          question_text: 'First question',
          options: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correct_option_id: 'A',
          explanation: 'Exp',
        },
        {
          question_id: 'DUP-001',
          subject: 'windows',
          topic_id: 'WIN-T001',
          subtopic_id: 'WIN-S1',
          topic: 'Active Directory',
          subtopic: 'Forests',
          difficulty: 'advanced',
          question_type: 'conceptual',
          question_text: 'Second question with same ID',
          options: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correct_option_id: 'B',
          explanation: 'Exp',
        },
      ],
    });

    const report = QuestionBankValidator.validateRawJson(duplicateJson);
    expect(report.isValid).toBe(false);
    expect(report.duplicateIds).toContain('DUP-001');
    expect(report.errors.some((e) => e.message.includes('Duplicate question ID'))).toBe(true);
  });

  it('rejects question with missing required fields or invalid options', () => {
    const missingFieldsJson = JSON.stringify({
      schema_version: '1.0.0',
      subject: 'linux',
      questions: [
        {
          question_id: 'BAD-001',
          subject: 'linux',
          // missing topic, subtopic, etc.
          question_text: 'Incomplete question',
          options: [
            { id: 'A', text: 'Only two options' },
            { id: 'B', text: 'Second option' },
          ],
          correct_option_id: 'C', // invalid option reference
          explanation: 'Exp',
        },
      ],
    });

    const report = QuestionBankValidator.validateRawJson(missingFieldsJson);
    expect(report.isValid).toBe(false);
    expect(report.validQuestions.length).toBe(0);
    expect(report.errors.length).toBeGreaterThan(0);
  });
});
