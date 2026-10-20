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
