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

export interface ModuleCategoryDefinition {
  /** Stable identifier for the category */
  id: string;
  /** Full display name of the category */
  name: string;
  /** Short title for cards and navigation */
  shortTitle: string;
  /** Concise description of what this category covers */
  description: string;
  /** Icon name for rendering */
  icon: string;
  /** Real curriculum topics from the question bank matching this category */
  topicNames: string[];
  /** Optional subject filter (e.g., 'linux', 'windows', 'cross_platform' for COSA) */
  subjectFilter?: string;
  /** Optional estimated question count */
  questionCount?: number;
}

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
  /** Sub-categories explicitly configured for this module */
  categories: ModuleCategoryDefinition[];
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'available',
    subjectMapping: ['fundamental-computer-networks', 'fcn'],
    categories: [
      {
        id: 'fcn-models-arch',
        name: 'Network Models, Physical Layer & Architecture',
        shortTitle: 'Models & Architecture',
        description: 'OSI 7-layer architecture, TCP/IP protocol suite, data encapsulation, physical layer mediums, cabling standards, topologies, and transmission modes.',
        icon: 'Layers',
        topicNames: ['Network Models & Architecture', 'Physical Layer & Cabling'],
      },
      {
        id: 'fcn-switching-routing',
        name: 'Ethernet Switching, Subnetting & Routing',
        shortTitle: 'Switching & Routing',
        description: 'Ethernet frames, MAC learning, VLANs, 802.1Q trunking, STP, IPv4/IPv6 CIDR subnetting, static routing, and dynamic protocols (OSPF, RIP, BGP).',
        icon: 'Network',
        topicNames: ['Data Link Layer & Switching', 'IP Addressing & Subnetting', 'Network Layer & Routing'],
      },
      {
        id: 'fcn-protocols-security',
        name: 'Transport, Application Protocols & Security',
        shortTitle: 'Protocols & Security',
        description: 'TCP three-way handshake, UDP, DNS, DHCP, HTTP/HTTPS, firewalls, Access Control Lists (ACLs), VPN tunnels, diagnostics, and WAN technologies.',
        icon: 'ShieldCheck',
        topicNames: ['Transport Layer Protocols', 'Application Layer Services & Protocols', 'Network Security, Diagnostics & WAN'],
      },
    ],
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'available',
    subjectMapping: ['programming-concepts', 'pc'],
    categories: [
      {
        id: 'pc-c-programming',
        name: 'C Programming, Pointers & Memory Allocation',
        shortTitle: 'C & Memory Management',
        description: 'Structured programming in C, control structures, functions, pointers, dynamic memory allocation (malloc/free), arrays, structs, and file handling.',
        icon: 'Code2',
        topicNames: ['C Language Fundamentals', 'C Arrays, Pointers & Memory', 'C Structures & File Systems'],
      },
      {
        id: 'pc-python-scripting',
        name: 'Python Programming & Object-Oriented Principles',
        shortTitle: 'Python & OOP',
        description: 'Python syntax, built-in data types, control flow, functions, OOP concepts (inheritance, polymorphism, encapsulation), and exception handling.',
        icon: 'Terminal',
        topicNames: ['Python Language Essentials', 'Python Advanced & Object-Oriented'],
      },
      {
        id: 'pc-database-sql',
        name: 'Relational Database Management & SQL',
        shortTitle: 'Databases & SQL',
        description: 'DBMS fundamentals, relational data model, ER modeling, normalization (1NF through BCNF), ACID transaction semantics, and SQL (DDL, DML, joins).',
        icon: 'Server',
        topicNames: ['Database Management Systems & Relational Model', 'Database Design, Normalization & Transactions', 'SQL Queries & DDL/DML'],
      },
    ],
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'available',
    subjectMapping: ['cosa', 'linux', 'windows', 'cross_platform'],
    categories: [
      {
        id: 'cosa-linux',
        name: 'Linux System Administration & Kernel Architecture',
        shortTitle: 'Linux & OS',
        description: 'Process life cycle, signals, storage hierarchies, LVM volume management, systemd service units, bash I/O, file permissions, and core administration.',
        icon: 'Terminal',
        subjectFilter: 'linux',
        topicNames: [
          'Linux Process & Service Management',
          'Linux Basics & Command Line Interface',
          'Linux Storage & File Systems',
          'Linux User Management & Network Services',
          'Linux Permissions & Security',
          'Operating System Architecture & Concurrency',
        ],
      },
      {
        id: 'cosa-windows',
        name: 'Windows Server 2022 & Active Directory Administration',
        shortTitle: 'Windows Server',
        description: 'Active Directory Domain Services (AD DS), forest trusts, FSMO roles, Group Policy Objects (GPO), PowerShell scripting, Hyper-V, and DNS/DHCP infrastructure.',
        icon: 'Server',
        subjectFilter: 'windows',
        topicNames: ['Windows Group Policy & Administration', 'Windows Server & Active Directory'],
      },
      {
        id: 'cosa-cross-platform',
        name: 'Cross-Platform Enterprise Integration & Authentication',
        shortTitle: 'Cross-Platform',
        description: 'SSSD identity management, Kerberos domain realm join, Samba/NFS file interoperability, PAM authentication, and unified hybrid administration.',
        icon: 'Layers',
        subjectFilter: 'cross_platform',
        topicNames: ['Cross-Platform Integration & Directory Services'],
      },
    ],
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'available',
    subjectMapping: ['it-infrastructure-devops', 'itid', 'iimd'],
    categories: [
      {
        id: 'itid-datacenter-cloud',
        name: 'Data Center Infrastructure, Virtualization & Cloud',
        shortTitle: 'Data Center & Cloud',
        description: 'Server architectures, enterprise SAN/NAS storage, hypervisor virtualization, AWS cloud core services (IAM, EC2, VPC, S3), and cloud networking.',
        icon: 'Cloud',
        topicNames: ['Data Center Infrastructure & Storage', 'Cloud Computing Architecture & AWS'],
      },
      {
        id: 'itid-devops-automation',
        name: 'Containers, CI/CD Pipelines & Automation',
        shortTitle: 'Containers & CI/CD',
        description: 'Docker containerization, Dockerfiles, container networking, Git distributed version control, CI/CD pipeline automation, and Ansible IaC.',
        icon: 'Code2',
        topicNames: [
          'Containers & Orchestration',
          'DevOps Methodologies & CI/CD',
          'Configuration Management & Infrastructure as Code',
          'Version Control with Git',
        ],
      },
      {
        id: 'itid-itil-framework',
        name: 'ITIL Service Management & Operations Framework',
        shortTitle: 'ITIL Framework',
        description: 'ITIL 4 Service Value System, Service Strategy, Service Design, Service Transition, Service Operation, Continual Service Improvement (CSI), and RACI matrix.',
        icon: 'ClipboardCheck',
        topicNames: [
          'ITIL Core Concepts & Service Strategy',
          'ITIL Service Design',
          'ITIL Service Transition',
          'ITIL Service Operation & Improvement',
        ],
      },
    ],
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    categories: [],
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    categories: [],
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    categories: [],
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    categories: [],
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
    accentColor: 'border-nexus-accent/30 text-nexus-accent bg-nexus-accent/10',
    contentStatus: 'coming_soon',
    subjectMapping: [],
    categories: [],
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

/** Get explicitly configured categories for a module by its ID or slug */
export function getModuleCategories(idOrSlug: string): ModuleCategoryDefinition[] {
  const mod = MODULE_REGISTRY.find((m) => m.id === idOrSlug || m.slug === idOrSlug);
  return mod?.categories || [];
}

