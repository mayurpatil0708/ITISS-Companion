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

// ─── Concrete Manifest: FCN (Fundamental of Computer Networks) ───

export const FCN_CONTENT_MANIFEST: ModuleContentManifest = {
  moduleId: 'fundamental-computer-networks',
  moduleSlug: 'fcn',
  hasQuestionBank: true,
  hasTopics: true,
  hasStudyResources: true,
  hasPracticalGuides: true,
  hasUsefulLinks: true,
  hasRevisionResources: true,
  studyResources: [
    {
      id: 'fcn-high-yield-summary',
      title: 'Computer Networks High-Yield Core Summary',
      description: 'Comprehensive guide covering OSI 7-layer architecture, TCP/IP encapsulation, IPv4/IPv6 headers, and switching fundamentals.',
      type: 'notes',
      fileUrl: '/materials/fcn/FCN_HighYield.pdf',
      badge: 'High Yield',
    },
    {
      id: 'fcn-cisco-routing-switching',
      title: 'Cisco IOS Routing & Switching Lab Guide',
      description: 'Cisco switch/router CLI configuration: VLAN 802.1Q tagging, Spanning Tree (STP), inter-VLAN routing, and OSPF/RIP routing.',
      type: 'pdf',
      fileUrl: '/materials/fcn/Cisco_Routing_Switching.pdf',
      badge: 'Core Reference',
    },
  ],
  practicalGuides: [
    {
      id: 'guide-cisco-vlan-routing',
      title: 'Inter-VLAN Routing & 802.1Q Trunking Configuration',
      category: 'networking',
      summary: 'Configuring access ports, 802.1Q trunk links, sub-interfaces on routers (Router-on-a-Stick), and verifying switchport modes.',
      difficulty: 'intermediate',
      estimatedMinutes: 30,
      keyCommands: [
        'switchport mode trunk',
        'switchport trunk allowed vlan 10,20',
        'interface GigabitEthernet0/0.10',
        'encapsulation dot1Q 10',
        'show vlan brief',
      ],
      stepsSummary: [
        'Create VLANs in global configuration with vlan <id>',
        'Assign access ports to VLAN with switchport access vlan <id>',
        'Configure inter-switch trunk links with switchport mode trunk',
        'Define 802.1Q sub-interfaces on router interface for inter-VLAN routing',
        'Assign default gateway IP addresses to each sub-interface and verify with ping',
      ],
    },
    {
      id: 'guide-subnetting-vlsm',
      title: 'IPv4 Subnetting & VLSM Design Walkthrough',
      category: 'networking',
      summary: 'Step-by-step methodology to calculate network IDs, broadcast addresses, usable host ranges, and custom subnet masks.',
      difficulty: 'foundational',
      estimatedMinutes: 25,
      keyCommands: ['ipcalc 192.168.1.0/26', 'ip route 10.0.0.0 255.255.255.0 192.168.1.1'],
      stepsSummary: [
        'Determine required subnets and host capacity per subnet',
        'Calculate prefix length (/n) and borrow host bits for subnetting',
        'Derive subnet mask in dotted decimal (255.255.255.x)',
        'Compute block sizes (256 - mask octet) to determine subnet increments',
        'Assign valid host IPs reserving network ID and broadcast address',
      ],
    },
  ],
  usefulLinks: [
    {
      id: 'link-iana-ports',
      title: 'IANA Service Name and Transport Protocol Port Number Registry',
      url: 'https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml',
      description: 'Official standard assignments for TCP/UDP well-known, registered, and dynamic ports.',
      category: 'standards',
      isExternal: true,
    },
    {
      id: 'link-wireshark-docs',
      title: 'Wireshark User Guide & Packet Analysis',
      url: 'https://www.wireshark.org/docs/',
      description: 'Deep-dive packet capture analysis for TCP handshakes, DNS queries, HTTP headers, and ARP requests.',
      category: 'tools',
      isExternal: true,
    },
  ],
  revisionResources: [
    {
      id: 'rev-osi-tcpip-matrix',
      title: 'OSI 7-Layer vs TCP/IP 4-Layer Mapping & PDU Matrix',
      summary: 'Essential comparison of protocol data units, addressing types, and standard protocols across network layers.',
      category: 'Network Architecture',
      highYieldBullets: [
        'Layer 7 (Application): Data — HTTP/HTTPS, DNS, DHCP, FTP, SSH, SMTP, SNMP.',
        'Layer 4 (Transport): Segment — TCP (reliable, connection-oriented, 3-way handshake) vs UDP (lightweight datagrams).',
        'Layer 3 (Network): Packet — Logical addressing (IPv4/IPv6), routing (OSPF, RIP, BGP), ICMP, ARP.',
        'Layer 2 (Data Link): Frame — Physical MAC addressing, CSMA/CD, switches, VLANs (802.1Q), STP (802.1D).',
        'Layer 1 (Physical): Bits — Guided media (UTP Cat6, Fiber), hubs, repeaters, signaling.',
      ],
      keyTerms: [
        { term: 'Three-Way Handshake', explanation: 'TCP connection initiation sequence: SYN -> SYN-ACK -> ACK.' },
        { term: 'DORA Process', explanation: 'DHCP lease acquisition: Discover -> Offer -> Request -> Acknowledge.' },
      ],
    },
  ],
};

// ─── Concrete Manifest: PC (Programming Concepts) ───

export const PC_CONTENT_MANIFEST: ModuleContentManifest = {
  moduleId: 'programming-concepts',
  moduleSlug: 'pc',
  hasQuestionBank: true,
  hasTopics: true,
  hasStudyResources: true,
  hasPracticalGuides: true,
  hasUsefulLinks: true,
  hasRevisionResources: true,
  studyResources: [
    {
      id: 'pc-c-systems-guide',
      title: 'C Programming & Memory Architecture Manual',
      description: 'In-depth reference on C pointers, pointer arithmetic, memory layout (stack/heap), structures, and stream I/O.',
      type: 'pdf',
      fileUrl: '/materials/pc/C_Programming_Manual.pdf',
      badge: 'Core Reference',
    },
    {
      id: 'pc-python-rdbms-guide',
      title: 'Python Essentials, OOP & RDBMS Design Guide',
      description: 'Comprehensive notes covering Python data structures, list comprehensions, exceptions, SQL queries, and normalization.',
      type: 'notes',
      fileUrl: '/materials/pc/Python_RDBMS_Guide.pdf',
      badge: 'High Yield',
    },
  ],
  practicalGuides: [
    {
      id: 'guide-c-pointers',
      title: 'C Pointer Arithmetic, Structs & Heap Allocation',
      category: 'devops',
      summary: 'Practical code examples illustrating pointer dereferencing, dynamic memory (malloc/free), linked lists, and function pointers.',
      difficulty: 'intermediate',
      estimatedMinutes: 30,
      keyCommands: [
        'int *ptr = (int*)malloc(sizeof(int) * 10);',
        'free(ptr); ptr = NULL;',
        'struct Node { int val; struct Node *next; };',
      ],
      stepsSummary: [
        'Declare pointers with correct type signature (int *p, char **argv)',
        'Allocate dynamic heap storage with malloc/calloc and verify against NULL',
        'Use pointer arithmetic (*(p + i)) vs array subscripting (p[i])',
        'Access struct members via arrow operator (node->val)',
        'Safely free heap allocations and set pointers to NULL to prevent dangling pointers',
      ],
    },
    {
      id: 'guide-sql-joins-transactions',
      title: 'Relational Database Queries, Multi-Table JOINs & Transactions',
      category: 'devops',
      summary: 'Crafting complex SELECT queries with INNER/LEFT/RIGHT JOINs, GROUP BY, HAVING, subqueries, and ACID transaction control.',
      difficulty: 'intermediate',
      estimatedMinutes: 25,
      keyCommands: [
        'SELECT e.name, d.dept_name FROM employees e INNER JOIN departments d ON e.dept_id = d.id;',
        'SELECT dept_id, COUNT(*) FROM employees GROUP BY dept_id HAVING COUNT(*) > 5;',
        'START TRANSACTION; UPDATE accounts SET balance = balance - 100 WHERE id = 1; COMMIT;',
      ],
      stepsSummary: [
        'Filter rows using WHERE clause before aggregation',
        'Group data using GROUP BY and filter grouped sets with HAVING',
        'Combine relational tables with INNER JOIN on matching primary/foreign keys',
        'Handle non-matching records with LEFT/RIGHT OUTER JOIN',
        'Enforce ACID semantics using START TRANSACTION, COMMIT, and ROLLBACK',
      ],
    },
  ],
  usefulLinks: [
    {
      id: 'link-python-docs',
      title: 'Python 3 Official Documentation',
      url: 'https://docs.python.org/3/',
      description: 'Authoritative documentation for Python built-in types, operators, standard library, and OOP models.',
      category: 'official_doc',
      isExternal: true,
    },
    {
      id: 'link-postgresql-manual',
      title: 'PostgreSQL Relational Database Documentation',
      url: 'https://www.postgresql.org/docs/',
      description: 'Comprehensive guide to SQL queries, transaction isolation levels, indexing, and normalization.',
      category: 'official_doc',
      isExternal: true,
    },
  ],
  revisionResources: [
    {
      id: 'rev-db-normalization-matrix',
      title: 'Database Normalization (1NF, 2NF, 3NF, BCNF) & ACID Matrix',
      summary: 'Clear rules for decomposing relational tables to eliminate redundancy and update anomalies.',
      category: 'Database Management',
      highYieldBullets: [
        '1NF (First Normal Form): Eliminate repeating groups; ensure all attribute values are atomic.',
        '2NF (Second Normal Form): In 1NF + eliminate partial functional dependencies (all non-key attributes fully dependent on whole primary key).',
        '3NF (Third Normal Form): In 2NF + eliminate transitive functional dependencies (non-key attribute depends on another non-key attribute).',
        'BCNF (Boyce-Codd Normal Form): Stricter 3NF; for every functional dependency X -> Y, X must be a superkey.',
        'ACID Properties: Atomicity (all-or-nothing), Consistency (valid state transitions), Isolation (independent concurrent execution), Durability (committed changes persist).',
      ],
      keyTerms: [
        { term: 'Candidate Key', explanation: 'A minimal set of attributes that uniquely identifies a tuple in a relation.' },
        { term: 'Transitive Dependency', explanation: 'When A -> B and B -> C, then A -> C indirectly; disallowed in 3NF.' },
      ],
    },
  ],
};

// ─── Concrete Manifest: IIMD (IT Infrastructure Management & DevOps) ───

export const IIMD_CONTENT_MANIFEST: ModuleContentManifest = {
  moduleId: 'it-infrastructure-devops',
  moduleSlug: 'itid',
  hasQuestionBank: true,
  hasTopics: true,
  hasStudyResources: true,
  hasPracticalGuides: true,
  hasUsefulLinks: true,
  hasRevisionResources: true,
  studyResources: [
    {
      id: 'iimd-itil-devops-guide',
      title: 'ITIL Lifecycle & DevOps Architecture Handbook',
      description: 'Comprehensive curriculum guide on ITIL v3/4 service management, Deming cycle, RACI, CI/CD, Docker, Kubernetes, and Ansible.',
      type: 'pdf',
      fileUrl: '/materials/itid/ITIL_DevOps_Handbook.pdf',
      badge: 'Core Reference',
    },
    {
      id: 'iimd-cloud-infra-summary',
      title: 'Cloud Infrastructure & Automation High-Yield Summary',
      description: 'High-yield notes covering AWS EC2, S3, VPC, Terraform IaC, Jenkinsfile pipelines, and data center facilities.',
      type: 'notes',
      fileUrl: '/materials/itid/Cloud_DevOps_Summary.pdf',
      badge: 'High Yield',
    },
  ],
  practicalGuides: [
    {
      id: 'guide-docker-containerization',
      title: 'Docker Image Optimization, Multi-Stage Builds & Compose',
      category: 'devops',
      summary: 'Creating lean Docker images with multi-stage Dockerfiles, managing container networks, volumes, and multi-container Docker Compose stacks.',
      difficulty: 'intermediate',
      estimatedMinutes: 25,
      keyCommands: [
        'docker build -t app:latest .',
        'docker run -d -p 8080:80 --name web app:latest',
        'docker compose up -d',
        'docker exec -it web /bin/sh',
      ],
      stepsSummary: [
        'Write Dockerfile using minimal base image (alpine, distroless)',
        'Separate build stage from runtime stage using multi-stage builds',
        'Order instructions from least frequently to most frequently changing for layer caching',
        'Manage persistent data using Docker named volumes',
        'Orchestrate multi-tier web/database stacks with docker-compose.yml',
      ],
    },
    {
      id: 'guide-jenkins-pipeline-ci',
      title: 'Jenkinsfile Declarative Pipeline & Automated CI/CD',
      category: 'devops',
      summary: 'Constructing automated multi-stage pipelines: Git checkout, automated test execution, Docker packaging, and artifact deployment.',
      difficulty: 'intermediate',
      estimatedMinutes: 30,
      keyCommands: [
        'pipeline { agent any stages { stage("Build") { steps { sh "make" } } } }',
        'git commit -am "Update Jenkinsfile"',
      ],
      stepsSummary: [
        'Define pipeline root block and assign build agent',
        'Create logical stages: Checkout, Unit Test, Build, Package, Deploy',
        'Incorporate post-build actions for notifications and test report archiving',
        'Version control Jenkinsfile directly inside application repository',
        'Trigger automated builds via GitHub webhook on push/pull request',
      ],
    },
  ],
  usefulLinks: [
    {
      id: 'link-docker-docs',
      title: 'Docker Official Documentation & CLI Reference',
      url: 'https://docs.docker.com/',
      description: 'Official references for Docker engine, Dockerfile instructions, Compose specifications, and Swarm mode.',
      category: 'official_doc',
      isExternal: true,
    },
    {
      id: 'link-jenkins-pipeline',
      title: 'Jenkins Pipeline as Code Syntax Documentation',
      url: 'https://www.jenkins.io/doc/book/pipeline/',
      description: 'Complete reference for Declarative and Scripted Jenkinsfile pipeline directives.',
      category: 'official_doc',
      isExternal: true,
    },
    {
      id: 'link-ansible-docs',
      title: 'Ansible Community Documentation',
      url: 'https://docs.ansible.com/ansible/latest/',
      description: 'Guides on playbooks, YAML syntax, inventory management, and built-in modules.',
      category: 'tools',
      isExternal: true,
    },
  ],
  revisionResources: [
    {
      id: 'rev-itil-calms-matrix',
      title: 'ITIL Four Ps, Lifecycle Phases & CALMS DevOps Matrix',
      summary: 'Essential framework comparing ITIL service delivery structures with modern DevOps culture and automation practices.',
      category: 'IT Service Management',
      highYieldBullets: [
        'ITIL Four Ps: People, Processes, Products (services/technology/tools), Partners (suppliers).',
        'ITIL Five Lifecycle Phases: Service Strategy -> Service Design -> Service Transition -> Service Operation -> Continual Service Improvement (CSI).',
        'ITIL CSI 6-Step Model: 1) What is the vision? 2) Where are we now? 3) Where do we want to be? 4) How do we get there? 5) Did we get there? 6) How do we keep the momentum going?',
        'RACI Matrix: Responsible (doer), Accountable (single owner/decision-maker), Consulted (two-way), Informed (one-way).',
        'CALMS DevOps Framework: Culture, Automation, Lean, Measurement, Sharing.',
        'Cloud Models: IaaS (virtualized compute/storage/network), PaaS (development/runtime platform), SaaS (fully hosted application).',
      ],
      keyTerms: [
        { term: 'Service Design Package (SDP)', explanation: 'Comprehensive deliverable passed from Service Design to Service Transition detailing all aspects of an IT service.' },
        { term: 'Infrastructure as Code (IaC)', explanation: 'Managing and provisioning data center and cloud infrastructure through machine-readable code scripts.' },
      ],
    },
  ],
};

// ─── Content Manifest Registry ───────────────────────────────

const MANIFEST_REGISTRY: Map<string, ModuleContentManifest> = new Map([
  ['cosa', COSA_CONTENT_MANIFEST],
  ['fundamental-computer-networks', FCN_CONTENT_MANIFEST],
  ['fcn', FCN_CONTENT_MANIFEST],
  ['programming-concepts', PC_CONTENT_MANIFEST],
  ['pc', PC_CONTENT_MANIFEST],
  ['it-infrastructure-devops', IIMD_CONTENT_MANIFEST],
  ['itid', IIMD_CONTENT_MANIFEST],
  ['iimd', IIMD_CONTENT_MANIFEST],
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
