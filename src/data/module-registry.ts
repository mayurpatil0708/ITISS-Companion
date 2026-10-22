/**
 * Module Registry — Central source of truth for all PGCP-ITISS modules.
 *
 * CMCE (4 modules): First exam stage, ~3 months into the course.
 * CCEE (5 modules): Second exam stage, ~2-3 months after CMCE.
 *
 * Adding a new module's content:
 *   1. Set `contentStatus` to 'available' or 'partial'
 *   2. Add seed JSON files to src/data/seed/<moduleId>/
 *   3. Register content manifest in src/data/module-content.ts
 *   No frontend redesign or changes to previously implemented modules required.
 */

export type ExamStage = 'cmce' | 'ccee';

export type ContentStatus = 'available' | 'coming_soon' | 'partial';

export interface ModuleDefinition {
  /** Stable identifier — never changes once set */
  id: string;
  /** URL-safe slug used in routes */
  slug: string;
  /** Full display name */
  name: string;
  /** Short name for compact UI */
  shortName: string;
  /** Which exam stage this module belongs to */
  examStage: ExamStage;
  /** Brief description of the module */
  description: string;
  /** Total duration in hours (from PGCP-ITISS curriculum) */
  durationHours: number;
  /** Number of curriculum topics */
  topicCount: number;
  /** Lucide icon name */
  icon: string;
  /** Accent color class for badges */
  accentColor: string;
  /** Whether content is uploaded and ready */
  contentStatus: ContentStatus;
  /** Which subjects (question bank files) map to this module */
  subjectMapping: string[];
  /** Display order within the exam stage */
  order: number;
}

export interface ExamStageDefinition {
  id: ExamStage;
  name: string;
  fullName: string;
  description: string;
  icon: string;
  moduleCount: number;
  timing: string;
}

// ─── Exam Stages ─────────────────────────────────────────────

export const EXAM_STAGES: Record<ExamStage, ExamStageDefinition> = {
  cmce: {
    id: 'cmce',
    name: 'CMCE',
    fullName: 'Common Module Comprehensive Examination',
    description: 'First examination stage covering foundational modules — conducted approximately three months into the PGCP-ITISS course.',
    icon: 'BookOpen',
    moduleCount: 4,
    timing: '~3 months into course',
  },
  ccee: {
    id: 'ccee',
    name: 'CCEE',
    fullName: 'Course Comprehensive End Examination',
    description: 'Final examination stage covering specialization modules — conducted approximately two to three months after CMCE.',
    icon: 'Shield',
    moduleCount: 5,
    timing: '~5-6 months into course',
  },
};

// ─── Module Definitions ──────────────────────────────────────

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ── CMCE Modules (4) ────────────────────────
  {
    id: 'fundamental-computer-networks',
    slug: 'fcn',
    name: 'Fundamental of Computer Networks',
    shortName: 'Networks',
    examStage: 'cmce',
    description: 'OSI and TCP/IP models, IP addressing and subnetting, routing protocols, Ethernet switching, VLANs, network troubleshooting, and network security foundations.',
    durationHours: 120,
    topicCount: 8,
    icon: 'Network',
    accentColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    contentStatus: 'available',
    subjectMapping: ['fundamental-computer-networks', 'fcn'],
    order: 1,
  },
  {
    id: 'programming-concepts',
    slug: 'pc',
    name: 'Programming Concepts',
    shortName: 'Programming',
    examStage: 'cmce',
    description: 'Core programming logic, structured programming in C, pointers, memory management, data structures, algorithms, and scripting essentials.',
    durationHours: 90,
    topicCount: 8,
    icon: 'Code2',
    accentColor: 'border-violet-500/30 text-violet-400 bg-violet-500/10',
    contentStatus: 'available',
    subjectMapping: ['programming-concepts', 'pc'],
    order: 2,
  },
  {
    id: 'cosa',
    slug: 'cosa',
    name: 'Concepts of Operating System and Administration',
    shortName: 'COSA',
    examStage: 'cmce',
    description: 'Linux process architecture, storage, LVM, systemd, Windows Server 2022 AD DS, Group Policy, PowerShell, Hyper-V, and hybrid cross-platform administration.',
    durationHours: 210,
    topicCount: 8,
    icon: 'Monitor',
    accentColor: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    contentStatus: 'available',
    subjectMapping: ['cosa', 'linux', 'windows', 'cross_platform'],
    order: 3,
  },
  {
    id: 'it-infrastructure-devops',
    slug: 'itid',
    name: 'IT Infrastructure Management & DevOps',
    shortName: 'Infra & DevOps',
    examStage: 'cmce',
    description: 'Enterprise IT infrastructure, virtualization, containerization with Docker, CI/CD pipelines, cloud fundamentals, and configuration management.',
    durationHours: 120,
    topicCount: 10,
    icon: 'Cloud',
    accentColor: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    contentStatus: 'available',
    subjectMapping: ['it-infrastructure-devops', 'itid', 'iimd'],
    order: 4,
  },

  // ── CCEE Modules (5) ────────────────────────
  {
    id: 'compliance-audit',
    slug: 'ca',
    name: 'Compliance Audit',
    shortName: 'Compliance',
    examStage: 'ccee',
    description: 'Information security governance, compliance frameworks, ISO/IEC 27001 standards, audit lifecycle, risk assessment methodologies, and regulatory controls.',
    durationHours: 30,
    topicCount: 10,
    icon: 'ClipboardCheck',
    accentColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    order: 1,
  },
  {
    id: 'security-concepts',
    slug: 'sc',
    name: 'Security Concepts',
    shortName: 'Security',
    examStage: 'ccee',
    description: 'Cryptography fundamentals, symmetric and asymmetric ciphers, hashing, application security, OWASP Top 10, authentication protocols, and threat modeling.',
    durationHours: 120,
    topicCount: 49,
    icon: 'ShieldCheck',
    accentColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    order: 2,
  },
  {
    id: 'cyber-forensics',
    slug: 'cf',
    name: 'Cyber Forensics',
    shortName: 'Forensics',
    examStage: 'ccee',
    description: 'Digital forensics principles, chain of custody, evidence acquisition, disk and memory analysis, artifact extraction, and investigative reporting.',
    durationHours: 60,
    topicCount: 4,
    icon: 'Search',
    accentColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    order: 3,
  },
  {
    id: 'public-key-infrastructure',
    slug: 'pki',
    name: 'Public Key Infrastructure',
    shortName: 'PKI',
    examStage: 'ccee',
    description: 'X.509 certificate hierarchy, Certificate Authorities (CA), certificate lifecycle management, CRLs, OCSP, SSL/TLS handshake, and trust chains.',
    durationHours: 60,
    topicCount: 13,
    icon: 'Key',
    accentColor: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    order: 4,
  },
  {
    id: 'network-defense-countermeasures',
    slug: 'ndc',
    name: 'Network Defense and Countermeasures (NDC)',
    shortName: 'NDC',
    examStage: 'ccee',
    description: 'Firewall architectures, packet filtering, stateful inspection, IDS/IPS configuration, SIEM event correlation, incident response, and defensive hardening.',
    durationHours: 90,
    topicCount: 12,
    icon: 'ShieldAlert',
    accentColor: 'border-red-500/30 text-red-400 bg-red-500/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    order: 5,
  },
];

// ─── Helper Functions ────────────────────────────────────────

/** Get all modules for a given exam stage, sorted by order */
export function getModulesByStage(stage: ExamStage): ModuleDefinition[] {
  return MODULE_REGISTRY
    .filter((m) => m.examStage === stage)
    .sort((a, b) => a.order - b.order);
}

/** Get a single module by its stable ID */
export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

/** Get a single module by its URL slug */
export function getModuleBySlug(slug: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.slug === slug);
}

/** Check if a module has any content ready */
export function isModuleAvailable(id: string): boolean {
  const mod = getModuleById(id);
  return mod ? mod.contentStatus === 'available' || mod.contentStatus === 'partial' : false;
}

/** Get all available modules across all stages */
export function getAvailableModules(): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.contentStatus !== 'coming_soon');
}

/** Map a question's subject field to its parent module */
export function getModuleForSubject(subject: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.subjectMapping.includes(subject));
}
