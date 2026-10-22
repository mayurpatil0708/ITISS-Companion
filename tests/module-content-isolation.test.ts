import { describe, it, expect } from 'vitest';
import {
  MODULE_REGISTRY,
  getModuleBySlug,
  getModuleById,
  getModuleCategories,
} from '../src/data/module-registry';

describe('ITISS Companion: Strict Module Content Isolation', () => {
  describe('Fundamental of Computer Networks (fcn)', () => {
    it('returns only network-specific categories and ZERO COSA categories', () => {
      const fcnModule = getModuleBySlug('fcn')!;
      expect(fcnModule).toBeDefined();
      expect(fcnModule.name).toBe('Fundamental of Computer Networks');

      const categories = getModuleCategories('fcn');
      expect(categories).toHaveLength(3);

      const categoryIds = categories.map((c) => c.id);
      expect(categoryIds).toEqual([
        'fcn-models-arch',
        'fcn-switching-routing',
        'fcn-protocols-security',
      ]);

      // Strictly verify no COSA categories or filters leak into Networks
      for (const cat of categories) {
        expect(cat.subjectFilter).toBeUndefined();
        expect(cat.id).not.toContain('linux');
        expect(cat.id).not.toContain('windows');
        expect(cat.id).not.toContain('cross');
        expect(cat.name).not.toMatch(/Linux|Windows|SSSD|Active Directory/i);
      }
    });

    it('has valid network topic names assigned to each category', () => {
      const categories = getModuleCategories('fcn');
      const allTopics = categories.flatMap((c) => c.topicNames || []);
      expect(allTopics.length).toBe(8);

      expect(allTopics).toContain('Network Models & Architecture');
      expect(allTopics).toContain('Physical Layer & Cabling');
      expect(allTopics).toContain('Data Link Layer & Switching');
      expect(allTopics).toContain('IP Addressing & Subnetting');
      expect(allTopics).toContain('Network Layer & Routing');
      expect(allTopics).toContain('Transport Layer Protocols');
      expect(allTopics).toContain('Application Layer Services & Protocols');
      expect(allTopics).toContain('Network Security, Diagnostics & WAN');
    });
  });

  describe('Programming Concepts (pc)', () => {
    it('returns only programming-specific categories', () => {
      const pcModule = getModuleBySlug('pc')!;
      expect(pcModule).toBeDefined();

      const categories = getModuleCategories('pc');
      expect(categories).toHaveLength(3);

      const categoryIds = categories.map((c) => c.id);
      expect(categoryIds).toEqual([
        'pc-c-programming',
        'pc-python-scripting',
        'pc-database-sql',
      ]);

      for (const cat of categories) {
        expect(cat.subjectFilter).toBeUndefined();
        expect(cat.name).not.toMatch(/Linux|Windows Server|Subnetting|OSI/i);
      }
    });
  });

  describe('Concepts of Operating System and Administration (cosa)', () => {
    it('returns its own dedicated Linux, Windows Server, and Cross-Platform categories', () => {
      const cosaModule = getModuleBySlug('cosa')!;
      expect(cosaModule).toBeDefined();

      const categories = getModuleCategories('cosa');
      expect(categories).toHaveLength(3);

      const categoryIds = categories.map((c) => c.id);
      expect(categoryIds).toEqual([
        'cosa-linux',
        'cosa-windows',
        'cosa-cross-platform',
      ]);

      // Verify explicit subjectFilters are configured for COSA
      const linuxCat = categories.find((c) => c.id === 'cosa-linux')!;
      expect(linuxCat.subjectFilter).toBe('linux');

      const winCat = categories.find((c) => c.id === 'cosa-windows')!;
      expect(winCat.subjectFilter).toBe('windows');

      const crossCat = categories.find((c) => c.id === 'cosa-cross-platform')!;
      expect(crossCat.subjectFilter).toBe('cross_platform');
    });
  });

  describe('IT Infrastructure Management & DevOps (itid)', () => {
    it('returns only infrastructure and DevOps categories', () => {
      const itidModule = getModuleBySlug('itid')!;
      expect(itidModule).toBeDefined();

      const categories = getModuleCategories('itid');
      expect(categories).toHaveLength(3);

      const categoryIds = categories.map((c) => c.id);
      expect(categoryIds).toEqual([
        'itid-datacenter-cloud',
        'itid-devops-automation',
        'itid-itil-framework',
      ]);

      for (const cat of categories) {
        expect(cat.subjectFilter).toBeUndefined();
        expect(cat.name).not.toMatch(/Linux System Administration|Windows Server 2022|C Programming/i);
      }
    });
  });

  describe('CCEE Specialization Modules (5 modules)', () => {
    it('strictly maintains empty categories for all 5 CCEE modules', () => {
      const cceeSlugs = ['ca', 'sc', 'cf', 'pki', 'ndc'];

      for (const slug of cceeSlugs) {
        const mod = getModuleBySlug(slug)!;
        expect(mod).toBeDefined();
        expect(mod.examStage).toBe('ccee');
        expect(mod.contentStatus).toBe('coming_soon');

        const categories = getModuleCategories(slug);
        expect(categories).toEqual([]);
      }
    });
  });

  describe('Category Lookup Consistency', () => {
    it('returns identical categories whether resolved by ID or slug', () => {
      const cmceSlugs = ['fcn', 'pc', 'cosa', 'itid'];

      for (const slug of cmceSlugs) {
        const mod = getModuleBySlug(slug)!;
        const byId = getModuleCategories(mod.id);
        const bySlug = getModuleCategories(slug);

        expect(byId).toEqual(bySlug);
        expect(byId.length).toBeGreaterThan(0);
      }
    });

    it('returns empty array for invalid or non-existent module IDs', () => {
      expect(getModuleCategories('non-existent-module')).toEqual([]);
      expect(getModuleCategories('')).toEqual([]);
    });
  });
});
