import { describe, it, expect } from 'vitest';
import {
  COSA_CONTENT_MANIFEST,
  getModuleContentManifest,
  registerModuleContentManifest,
  ModuleContentManifest,
} from '../src/data/module-content';

describe('ITISS Companion: Modular Content Architecture', () => {
  it('provides real study materials, practical guides, and revision items for COSA', () => {
    expect(COSA_CONTENT_MANIFEST.moduleId).toBe('cosa');
    expect(COSA_CONTENT_MANIFEST.hasStudyResources).toBe(true);
    expect(COSA_CONTENT_MANIFEST.hasPracticalGuides).toBe(true);
    expect(COSA_CONTENT_MANIFEST.hasRevisionResources).toBe(true);
    expect(COSA_CONTENT_MANIFEST.hasUsefulLinks).toBe(true);
    expect(COSA_CONTENT_MANIFEST.hasQuestionBank).toBe(true);

    // Study resources check
    expect(COSA_CONTENT_MANIFEST.studyResources.length).toBeGreaterThanOrEqual(3);
    const pdfs = COSA_CONTENT_MANIFEST.studyResources.map((r) => r.fileUrl);
    expect(pdfs).toContain('/materials/cosa/COSA_RapidFire.pdf');
    expect(pdfs).toContain('/materials/cosa/devendraCOSA.pdf');
    expect(pdfs).toContain('/materials/cosa/amitCOSA.pdf');

    // Practical guides check
    expect(COSA_CONTENT_MANIFEST.practicalGuides.length).toBeGreaterThanOrEqual(5);
    for (const guide of COSA_CONTENT_MANIFEST.practicalGuides) {
      expect(guide.title).toBeTruthy();
      expect(guide.keyCommands.length).toBeGreaterThan(0);
      expect(guide.stepsSummary.length).toBeGreaterThan(0);
    }

    // Useful links check
    expect(COSA_CONTENT_MANIFEST.usefulLinks.length).toBeGreaterThanOrEqual(5);
    for (const link of COSA_CONTENT_MANIFEST.usefulLinks) {
      expect(link.url.startsWith('https://')).toBe(true);
    }
  });

  it('returns clean Coming Soon manifest for modules without uploaded content', () => {
    const caManifest = getModuleContentManifest('compliance-audit', 'ca');
    expect(caManifest.moduleId).toBe('compliance-audit');
    expect(caManifest.hasStudyResources).toBe(false);
    expect(caManifest.hasPracticalGuides).toBe(false);
    expect(caManifest.hasQuestionBank).toBe(false);
    expect(caManifest.studyResources).toHaveLength(0);
    expect(caManifest.practicalGuides).toHaveLength(0);

    const scManifest = getModuleContentManifest('security-concepts', 'sc');
    expect(scManifest.moduleId).toBe('security-concepts');
    expect(scManifest.hasStudyResources).toBe(false);
  });

  it('safely registers new module manifests without corrupting existing modules', () => {
    const testManifest: ModuleContentManifest = {
      moduleId: 'compliance-audit',
      moduleSlug: 'ca',
      hasQuestionBank: false,
      hasTopics: true,
      hasStudyResources: true,
      hasPracticalGuides: false,
      hasUsefulLinks: false,
      hasRevisionResources: false,
      studyResources: [
        {
          id: 'ca-iso27001-notes',
          title: 'ISO/IEC 27001 Audit Checklist',
          description: 'Control assessment framework and auditor checklist.',
          type: 'pdf',
          fileUrl: '/materials/ca/ISO27001_Audit_Checklist.pdf',
        },
      ],
      practicalGuides: [],
      usefulLinks: [],
      revisionResources: [],
    };

    const registered = registerModuleContentManifest(testManifest);
    expect(registered).toBe(true);

    const loaded = getModuleContentManifest('compliance-audit');
    expect(loaded.hasStudyResources).toBe(true);
    expect(loaded.studyResources).toHaveLength(1);
    expect(loaded.studyResources[0].id).toBe('ca-iso27001-notes');

    // Verify COSA was not corrupted
    const cosaAfter = getModuleContentManifest('cosa');
    expect(cosaAfter.hasStudyResources).toBe(true);
    expect(cosaAfter.studyResources).toHaveLength(3);
  });

  it('rejects invalid manifests without crashing or corrupting data', () => {
    // @ts-expect-error Testing invalid runtime input
    const invalidResult = registerModuleContentManifest(null);
    expect(invalidResult).toBe(false);

    // @ts-expect-error Testing invalid runtime input
    const emptyResult = registerModuleContentManifest({});
    expect(emptyResult).toBe(false);
  });
});
