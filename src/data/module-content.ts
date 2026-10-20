/**
 * Module Content Architecture — Extensible content manifests for all PGCP-ITISS modules.
 *
 * Each module has an independent content manifest describing its available:
 * - Study materials (PDF notes, slides, flash revision)
 * - Practical guides & command walkthroughs
 * - Useful links (official documentation, tools, specifications)
 * - Revision resources (command cheat sheets, high-yield summaries)
 * - Topic lists & syllabus structure
 * - Question banks
 *
 * Modules without content display clear Coming Soon states.
 * Modules with partial content display available sections while marking missing ones Coming Soon.
 * Uploading content for any module requires only adding or updating its manifest.
 */

export interface StudyResourceItem {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'notes' | 'cheatsheet' | 'slides';
  fileUrl: string;
  fileSize?: string;
  pageCount?: number;
  badge?: string;
}

export interface PracticalGuideItem {
  id: string;
  title: string;
  category: 'linux' | 'windows' | 'cross_platform' | 'networking' | 'security' | 'devops' | 'audit' | 'forensics';
  summary: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  keyCommands: string[];
  stepsSummary: string[];
}

export interface UsefulLinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  category: 'official_doc' | 'tools' | 'tutorials' | 'standards';
  isExternal: boolean;
}

export interface RevisionResourceItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  highYieldBullets: string[];
  keyTerms?: { term: string; explanation: string }[];
}

export interface ModuleContentManifest {
  moduleId: string;
  moduleSlug: string;
  hasQuestionBank: boolean;
  hasTopics: boolean;
  hasStudyResources: boolean;
  hasPracticalGuides: boolean;
  hasUsefulLinks: boolean;
  hasRevisionResources: boolean;
  studyResources: StudyResourceItem[];
  practicalGuides: PracticalGuideItem[];
  usefulLinks: UsefulLinkItem[];
  revisionResources: RevisionResourceItem[];
}

// ─── Concrete Manifest: COSA (Concepts of Operating System and Administration) ───

export const COSA_CONTENT_MANIFEST: ModuleContentManifest = {
  moduleId: 'cosa',
  moduleSlug: 'cosa',
  hasQuestionBank: true,
  hasTopics: true,
  hasStudyResources: true,
  hasPracticalGuides: true,
  hasUsefulLinks: true,
  hasRevisionResources: true,
  studyResources: [
    {
      id: 'cosa-rapid-fire',
      title: 'COSA Rapid Fire Revision Guide',
      description: 'Concise high-yield question & answer summary for rapid last-minute exam revision.',
      type: 'pdf',
      fileUrl: '/materials/cosa/COSA_RapidFire.pdf',
      fileSize: '80 KB',
      badge: 'High Yield',
    },
    {
      id: 'cosa-linux-devendra',
      title: 'Linux & OS System Administration Comprehensive Guide',
      description: '149-page in-depth curriculum guide: process management, signals, storage, LVM, systemd, bash I/O, and enterprise networking.',
      type: 'pdf',
      fileUrl: '/materials/cosa/devendraCOSA.pdf',
      fileSize: '16 MB',
      pageCount: 149,
      badge: 'Core Reference',
    },
    {
      id: 'cosa-windows-amit',
      title: 'Windows Server 2022 Enterprise Administration Guide',
      description: '447-page complete technical manual: Active Directory Domain Services, FSMO roles, Group Policy, PowerShell, Hyper-V, and WSUS.',
      type: 'pdf',
      fileUrl: '/materials/cosa/amitCOSA.pdf',
      fileSize: '24 MB',
      pageCount: 447,
      badge: 'Core Reference',
    },
  ],
  practicalGuides: [
    {
      id: 'guide-lvm-storage',
      title: 'Linux Logical Volume Manager (LVM) Setup & Online Resizing',
      category: 'linux',
      summary: 'Step-by-step walkthrough for initializing Physical Volumes (PV), Volume Groups (VG), Logical Volumes (LV), and expanding ext4/xfs filesystems live.',
      difficulty: 'intermediate',
      estimatedMinutes: 25,
      keyCommands: ['pvcreate /dev/sdb', 'vgcreate vg_data /dev/sdb', 'lvcreate -n lv_app -L 20G vg_data', 'lvextend -L +10G /dev/vg_data/lv_app -r'],
      stepsSummary: [
        'Partition or identify unformatted raw storage block device',
        'Initialize Physical Volume with pvcreate',
        'Create Volume Group grouping physical storage with vgcreate',
        'Allocate Logical Volume using lvcreate with requested PE extents',
        'Format with mkfs.ext4 or mkfs.xfs and mount persistently in /etc/fstab',
        'Perform live online resizing with lvextend using -r/--resizefs flag',
      ],
    },
    {
      id: 'guide-systemd-service',
      title: 'Systemd Unit Creation & Service Lifecycle Management',
      category: 'linux',
      summary: 'Creating custom systemd service units, defining dependencies, automatic restarts, and log inspection with journalctl.',
      difficulty: 'foundational',
      estimatedMinutes: 20,
      keyCommands: ['systemctl daemon-reload', 'systemctl enable --now app.service', 'systemctl status app.service', 'journalctl -u app.service -f'],
      stepsSummary: [
        'Author unit file in /etc/systemd/system/myapp.service',
        'Configure [Unit] section with Description and After=network.target',
        'Define [Service] section with ExecStart, Restart=always, User/Group',
        'Define [Install] section with WantedBy=multi-user.target',
        'Reload systemd configuration manager using systemctl daemon-reload',
        'Enable and start unit, and verify real-time stdout/stderr via journalctl -u',
      ],
    },
    {
      id: 'guide-ad-fsmo',
      title: 'Active Directory Domain Services Deployment & FSMO Management',
      category: 'windows',
      summary: 'Promoting Windows Server to Domain Controller, verifying DNS SRV records, and querying/transferring FSMO operational roles.',
      difficulty: 'advanced',
      estimatedMinutes: 35,
      keyCommands: ['Install-WindowsFeature AD-Domain-Services -IncludeManagementTools', 'Install-ADDSForest -DomainName itiss.local', 'netdom query fsmo', 'Move-ADDirectoryServerOperationMasterRole -Identity "DC02" -OperationMasterRole 0,1,2,3,4'],
      stepsSummary: [
        'Install AD-Domain-Services feature via Server Manager or PowerShell',
        'Execute Install-ADDSForest creating root tree and forward lookup DNS zones',
        'Verify DNS registration of _ldap and _kerberos SRV records in _msdcs zone',
        'Query FSMO role holders across Schema, Domain Naming, PDC, RID, and Infrastructure',
        'Demonstrate graceful FSMO role transfer and seize procedures in disaster recovery',
      ],
    },
    {
      id: 'guide-powershell-admin',
      title: 'Windows PowerShell Automated Administration & Bulk User Onboarding',
      category: 'windows',
      summary: 'Utilizing Active Directory cmdlets to import, query, modify, and audit candidate user accounts in bulk from CSV datasets.',
      difficulty: 'intermediate',
      estimatedMinutes: 25,
      keyCommands: ['Get-ADUser -Filter * -Properties Department, MemberOf', 'New-ADUser -Name "John Doe" -SamAccountName "jdoe" -Path "OU=Students,DC=itiss,DC=local"', 'Get-GPO -All', 'Export-Clixml -Path users.xml'],
      stepsSummary: [
        'Import ActiveDirectory PowerShell module in elevated session',
        'Query directory objects with filtering using Get-ADUser -Filter',
        'Read external CSV file containing user metadata using Import-Csv',
        'Iterate across collection with ForEach-Object creating secure accounts',
        'Assign target Organisational Unit (OU) path and initial password requirements',
      ],
    },
    {
      id: 'guide-cross-platform-sssd',
      title: 'Cross-Platform Active Directory Integration via SSSD & Kerberos',
      category: 'cross_platform',
      summary: 'Joining enterprise Linux servers to a Windows Active Directory domain with realm join, SSSD, and Kerberos ticket-granting authentication.',
      difficulty: 'advanced',
      estimatedMinutes: 30,
      keyCommands: ['realm discover itiss.local', 'realm join --user=Administrator itiss.local', 'kinit username@ITISS.LOCAL', 'klist'],
      stepsSummary: [
        'Ensure synchronized NTP time and correct AD DNS resolver configuration',
        'Verify discovery of domain controllers with realm discover',
        'Join Linux host to AD domain creating computer object in Active Directory',
        'Review /etc/sssd/sssd.conf for id_provider=ad and default_shell settings',
        'Test single sign-on ticket acquisition using kinit and inspect with klist',
        'Verify user lookup and home directory auto-creation with pam_mkhomedir',
      ],
    },
  ],
  usefulLinks: [
    {
      id: 'link-kernel-docs',
      title: 'The Linux Kernel Documentation',
      url: 'https://docs.kernel.org/',
      description: 'Official authoritative documentation for Linux kernel internals, process scheduler, memory subsystem, and sysfs.',
      category: 'official_doc',
      isExternal: true,
    },
    {
      id: 'link-ms-windows-server',
      title: 'Microsoft Learn: Windows Server Administration',
      url: 'https://learn.microsoft.com/en-us/windows-server/',
      description: 'Official Microsoft documentation on Active Directory DS, Group Policy management, Hyper-V, failover clustering, and PowerShell.',
      category: 'official_doc',
      isExternal: true,
    },
    {
      id: 'link-systemd-man',
      title: 'systemd System and Service Manager Manual',
      url: 'https://www.freedesktop.org/software/systemd/man/latest/',
      description: 'Complete man pages for systemctl, journalctl, systemd.service, systemd.timer, and socket activation.',
      category: 'official_doc',
      isExternal: true,
    },
    {
      id: 'link-rhel-storage',
      title: 'Red Hat Enterprise Linux Storage Administration Guide',
      url: 'https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/',
      description: 'Practical enterprise guidance on LVM volumes, ext4/XFS filesystems, disk partitioning, and multipath storage.',
      category: 'standards',
      isExternal: true,
    },
    {
      id: 'link-samba-docs',
      title: 'Samba Project Documentation',
      url: 'https://wiki.samba.org/',
      description: 'Configuration guides for Samba Active Directory DC, domain member setups, SMB3 shares, and POSIX ACL mapping.',
      category: 'tools',
      isExternal: true,
    },
  ],
  revisionResources: [
    {
      id: 'rev-fsmo-matrix',
      title: 'FSMO Roles Responsibility & Placement Matrix',
      summary: 'Quick reference for the 5 Flexible Single Master Operation roles in Active Directory, their scope, and failure impacts.',
      category: 'Windows Server Active Directory',
      highYieldBullets: [
        'Schema Master (Forest-wide): Controls updates and modifications to directory schema structure.',
        'Domain Naming Master (Forest-wide): Controls additions or removals of domains in directory forest.',
        'PDC Emulator (Domain-wide): Master time source, password change processing, GPO editing master, legacy NT4 support.',
        'RID Master (Domain-wide): Allocates pools of Relative IDs (RIDs) to DCs for creating security principals.',
        'Infrastructure Master (Domain-wide): Updates cross-domain object references and GUID-SID mappings (do not host on Global Catalog DC unless all DCs are GCs).',
      ],
      keyTerms: [
        { term: 'FSMO Transfer', explanation: 'Graceful move of role ownership between active online Domain Controllers.' },
        { term: 'FSMO Seizure', explanation: 'Emergency force-takeover when original role holder has suffered permanent hardware loss.' },
      ],
    },
    {
      id: 'rev-linux-process-storage',
      title: 'Linux Process States & Storage Hierarchy Cheat Sheet',
      summary: 'Essential Linux concepts tested in CDAC CMCE examinations regarding process lifecycles and storage layers.',
      category: 'Linux Operating Systems',
      highYieldBullets: [
        'Process States: R (Running/Runnable), S (Interruptible Sleep), D (Uninterruptible Sleep / Disk I/O), Z (Zombie / Terminated awaiting parent wait()), T (Stopped).',
        'Signals: SIGHUP (1 - Reload), SIGINT (2 - Ctrl+C), SIGKILL (9 - Uncatchable terminate), SIGTERM (15 - Polite terminate), SIGSTOP (19 - Uncatchable freeze).',
        'LVM Stack Hierarchy: Physical Device (/dev/sdb) -> Physical Volume (PV) -> Volume Group (VG pool) -> Logical Volume (LV) -> Filesystem.',
        'systemd Target Equivalents: multi-user.target = Runlevel 3 (CLI), graphical.target = Runlevel 5 (GUI), rescue.target = Runlevel 1 (Single user).',
      ],
      keyTerms: [
        { term: 'Zombie Process', explanation: 'A process that has finished execution but still has an entry in the process table so its parent can read its exit status.' },
        { term: 'PE (Physical Extent)', explanation: 'The smallest allocatable chunk of disk space in an LVM Volume Group (default 4MB).' },
      ],
    },
  ],
};

// ─── Content Manifest Registry ───────────────────────────────

const MANIFEST_REGISTRY: Map<string, ModuleContentManifest> = new Map([
  ['cosa', COSA_CONTENT_MANIFEST],
]);

/**
 * Get content manifest for a module.
 * If the module does not have an explicit manifest, returns an empty Coming Soon manifest.
 */
export function getModuleContentManifest(moduleId: string, moduleSlug?: string): ModuleContentManifest {
  const existing = MANIFEST_REGISTRY.get(moduleId);
  if (existing) return existing;

  return {
    moduleId,
    moduleSlug: moduleSlug || moduleId,
    hasQuestionBank: false,
    hasTopics: false,
    hasStudyResources: false,
    hasPracticalGuides: false,
    hasUsefulLinks: false,
    hasRevisionResources: false,
    studyResources: [],
    practicalGuides: [],
    usefulLinks: [],
    revisionResources: [],
  };
}

/**
 * Register or update a module's content manifest.
 * Performs safe schema validation to ensure no corrupt entries are added.
 */
export function registerModuleContentManifest(manifest: ModuleContentManifest): boolean {
  if (!manifest || !manifest.moduleId) {
    console.warn('Rejected invalid manifest: missing moduleId');
    return false;
  }
  MANIFEST_REGISTRY.set(manifest.moduleId, manifest);
  return true;
}
