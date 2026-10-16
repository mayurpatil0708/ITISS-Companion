export interface AppConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  version: string;
  examName: string;
  defaultPassingThreshold: number; // Practice benchmark setting, default 70%
  subjects: {
    linux: {
      id: 'linux';
      name: string;
      shortTitle: string;
      description: string;
      icon: string;
      badgeColor: string;
    };
    windows: {
      id: 'windows';
      name: string;
      shortTitle: string;
      description: string;
      icon: string;
      badgeColor: string;
    };
    cross_platform: {
      id: 'cross_platform';
      name: string;
      shortTitle: string;
      description: string;
      icon: string;
      badgeColor: string;
    };
  };
  navigation: {
    title: string;
    path: string;
    icon: string;
  }[];
}

export const APP_CONFIG: AppConfig = {
  name: 'NEXUS | System Administration Academy',
  shortName: 'NEXUS',
  tagline: 'Master Linux. Master Windows. Own the fundamentals.',
  description: 'A production-grade certification and assessment preparation platform for CDAC CMCE / CCEE and enterprise system administrators.',
  version: '2.4.0-prod',
  examName: 'CDAC CMCE / CCEE System Administration Exam',
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
  navigation: [
    { title: 'Overview', path: '/', icon: 'LayoutDashboard' },
    { title: 'Practice Setup', path: '/practice', icon: 'Sparkles' },
    { title: 'Linux Bank', path: '/practice/linux', icon: 'Terminal' },
    { title: 'Windows Bank', path: '/practice/windows', icon: 'Server' },
    { title: 'Cross-platform', path: '/practice/cross-platform', icon: 'Layers' },
    { title: 'Topic Explorer', path: '/topics', icon: 'FolderTree' },
    { title: 'Mock Exam', path: '/exam', icon: 'GraduationCap' },
    { title: 'Review Mistakes', path: '/review', icon: 'RotateCcw' },
    { title: 'Analytics', path: '/analytics', icon: 'BarChart3' },
    { title: 'Question Bank', path: '/question-bank', icon: 'Database' },
    { title: 'Settings', path: '/settings', icon: 'Settings' },
  ],
};
