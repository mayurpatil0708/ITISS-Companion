/**
 * ITISS Companion — Central Application Configuration
 *
 * All branding, identity, and top-level settings are defined here.
 * Change the name/tagline in one place to update the entire application.
 */

export interface AppConfig {
  /** Full product name */
  name: string;
  /** Short brand name */
  shortName: string;
  /** Product tagline */
  tagline: string;
  /** Extended description */
  description: string;
  /** Application version */
  version: string;
  /** Course name */
  courseName: string;
  /** Default passing threshold for practice mode (%) */
  defaultPassingThreshold: number;
  /** Subject definitions — maps to question bank subject fields */
  subjects: Record<string, SubjectConfig>;
}

export interface SubjectConfig {
  id: string;
  name: string;
  shortTitle: string;
  description: string;
  icon: string;
  badgeColor: string;
}

export const APP_CONFIG: AppConfig = {
  name: 'ITISS Companion',
  shortName: 'ITISS',
  tagline: 'Your Complete PGCP-ITISS Preparation Hub',
  description: 'One platform for CMCE and CCEE preparation — study materials, technical notes, practical guides, useful resources, MCQs, mock tests, revision, and exam readiness.',
  version: '3.0.0',
  courseName: 'PGCP-ITISS at CDAC',
  defaultPassingThreshold: 70,
  subjects: {
    cosa: {
      id: 'cosa',
      name: 'Concepts of Operating System and Administration',
      shortTitle: 'COSA',
      description: 'Linux process architecture, storage, LVM, systemd, Windows Server 2022 AD DS, Group Policy, PowerShell, and Hyper-V.',
      icon: 'Monitor',
      badgeColor: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    },
    'fundamental-computer-networks': {
      id: 'fundamental-computer-networks',
      name: 'Fundamental of Computer Networks',
      shortTitle: 'Networks',
      description: 'OSI & TCP/IP models, IP addressing & subnetting, routing protocols (RIP, OSPF, BGP), VLANs, switching, and network security.',
      icon: 'Network',
      badgeColor: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    },
    'programming-concepts': {
      id: 'programming-concepts',
      name: 'Programming Concepts',
      shortTitle: 'Programming',
      description: 'C syntax, pointers & dynamic memory, Python OOP, data structures, relational database modeling, SQL queries, and ACID transactions.',
      icon: 'Code2',
      badgeColor: 'border-violet-500/30 text-violet-400 bg-violet-500/10',
    },
    'it-infrastructure-devops': {
      id: 'it-infrastructure-devops',
      name: 'IT Infrastructure Management & DevOps',
      shortTitle: 'Infra & DevOps',
      description: 'ITIL v3/4 lifecycle, Docker containerization, Kubernetes, Jenkins CI/CD, Ansible automation, and AWS cloud architecture.',
      icon: 'Cloud',
      badgeColor: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    },
    linux: {
      id: 'linux',
      name: 'Linux & Operating Systems',
      shortTitle: 'Linux & OS',
      description: 'Process management, ELF headers, storage, LVM, systemd, bash I/O, networking, and enterprise services.',
      icon: 'Terminal',
      badgeColor: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    },
    windows: {
      id: 'windows',
      name: 'Windows Server Administration',
      shortTitle: 'Windows Server',
      description: 'Active Directory DS, FSMO roles, Group Policy, PowerShell, Hyper-V, WSUS, DNS, and failover clustering.',
      icon: 'Server',
      badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
    },
    cross_platform: {
      id: 'cross_platform',
      name: 'Windows & Linux Cross-platform',
      shortTitle: 'Cross-platform',
      description: 'Active Directory realm joining, SSSD, Kerberos, Samba/NFS interop, Apache/IIS, and hybrid administration.',
      icon: 'Layers',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
  },
};
