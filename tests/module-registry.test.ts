import { describe, it, expect } from 'vitest';
import {
  MODULE_REGISTRY,
  EXAM_STAGES,
  getModulesByStage,
  getModuleById,
  getModuleBySlug,
  isModuleAvailable,
  getAvailableModules,
  getModuleForSubject,
} from '../src/data/module-registry';
import { questionRepository } from '../src/services/storage/indexeddb.repository';

describe('ITISS Companion: Module Registry & Exam Stage Isolation', () => {
  it('defines exactly two exam stages: CMCE and CCEE', () => {
    expect(Object.keys(EXAM_STAGES)).toEqual(['cmce', 'ccee']);
    expect(EXAM_STAGES.cmce.name).toBe('CMCE');
    expect(EXAM_STAGES.ccee.name).toBe('CCEE');
    expect(EXAM_STAGES.cmce.moduleCount).toBe(4);
    expect(EXAM_STAGES.ccee.moduleCount).toBe(5);
  });

  it('contains exactly 4 modules under CMCE in correct order', () => {
    const cmceModules = getModulesByStage('cmce');
    expect(cmceModules).toHaveLength(4);

    expect(cmceModules[0].id).toBe('fundamental-computer-networks');
    expect(cmceModules[0].slug).toBe('fcn');
    expect(cmceModules[0].durationHours).toBe(120);
    expect(cmceModules[0].topicCount).toBe(16);

    expect(cmceModules[1].id).toBe('programming-concepts');
    expect(cmceModules[1].slug).toBe('pc');
    expect(cmceModules[1].durationHours).toBe(90);
    expect(cmceModules[1].topicCount).toBe(19);

    expect(cmceModules[2].id).toBe('cosa');
    expect(cmceModules[2].slug).toBe('cosa');
    expect(cmceModules[2].name).toBe('Concepts of Operating System and Administration');
    expect(cmceModules[2].durationHours).toBe(210);
    expect(cmceModules[2].topicCount).toBe(40);

    expect(cmceModules[3].id).toBe('it-infrastructure-devops');
    expect(cmceModules[3].slug).toBe('itid');
    expect(cmceModules[3].durationHours).toBe(120);
    expect(cmceModules[3].topicCount).toBe(11);
  });

  it('contains exactly 5 modules under CCEE in correct order', () => {
    const cceeModules = getModulesByStage('ccee');
    expect(cceeModules).toHaveLength(5);

    expect(cceeModules[0].id).toBe('compliance-audit');
    expect(cceeModules[0].slug).toBe('ca');
    expect(cceeModules[0].durationHours).toBe(30);
    expect(cceeModules[0].topicCount).toBe(10);

    expect(cceeModules[1].id).toBe('security-concepts');
    expect(cceeModules[1].slug).toBe('sc');
    expect(cceeModules[1].durationHours).toBe(120);
    expect(cceeModules[1].topicCount).toBe(49);

    expect(cceeModules[2].id).toBe('cyber-forensics');
    expect(cceeModules[2].slug).toBe('cf');
    expect(cceeModules[2].durationHours).toBe(60);
    expect(cceeModules[2].topicCount).toBe(4);

    expect(cceeModules[3].id).toBe('public-key-infrastructure');
    expect(cceeModules[3].slug).toBe('pki');
    expect(cceeModules[3].durationHours).toBe(60);
    expect(cceeModules[3].topicCount).toBe(13);

    expect(cceeModules[4].id).toBe('network-defense-countermeasures');
    expect(cceeModules[4].slug).toBe('ndc');
    expect(cceeModules[4].durationHours).toBe(90);
    expect(cceeModules[4].topicCount).toBe(12);
  });

  it('preserves existing COSA content as the only currently available module', () => {
    const available = getAvailableModules();
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe('cosa');
    expect(available[0].contentStatus).toBe('available');
    expect(available[0].subjectMapping).toEqual(['linux', 'windows', 'cross_platform']);

    // Check all other 8 modules are coming_soon
    const comingSoon = MODULE_REGISTRY.filter((m) => m.contentStatus === 'coming_soon');
    expect(comingSoon).toHaveLength(8);
    for (const mod of comingSoon) {
      expect(isModuleAvailable(mod.id)).toBe(false);
      expect(mod.subjectMapping).toHaveLength(0);
    }
  });

  it('correctly maps subjects to COSA module', () => {
    expect(getModuleForSubject('linux')?.id).toBe('cosa');
    expect(getModuleForSubject('windows')?.id).toBe('cosa');
    expect(getModuleForSubject('cross_platform')?.id).toBe('cosa');
    expect(getModuleForSubject('unknown_subject')).toBeUndefined();
  });

  it('resolves modules by id and slug', () => {
    expect(getModuleById('cosa')?.name).toBe('Concepts of Operating System and Administration');
    expect(getModuleBySlug('cosa')?.id).toBe('cosa');
    expect(getModuleBySlug('fcn')?.id).toBe('fundamental-computer-networks');
    expect(getModuleBySlug('ndc')?.id).toBe('network-defense-countermeasures');
    expect(getModuleById('non-existent')).toBeUndefined();
    expect(getModuleBySlug('non-existent')).toBeUndefined();
  });

  it('maps all 446 seeded question bank items strictly to the COSA module', async () => {
    const allQuestions = await questionRepository.getAllQuestions();
    expect(allQuestions.length).toBe(446);

    const cosaModule = getModuleById('cosa')!;
    const cosaQuestions = allQuestions.filter((q) => cosaModule.subjectMapping.includes(q.subject));
    expect(cosaQuestions.length).toBe(446);

    // Verify each question belongs to one of linux, windows, or cross_platform
    for (const q of allQuestions) {
      expect(['linux', 'windows', 'cross_platform']).toContain(q.subject);
    }
  });
});
