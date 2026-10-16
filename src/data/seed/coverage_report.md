# CDAC CMCE Linux and Windows Question Bank — Coverage Report

## Scope and processing

The source set contains 149 pages in devendraCOSA.pdf and 447 pages in amitCOSA.pdf. Text extraction returned non-empty text for all 596 pages. Each page is recorded in topic_inventory.json with a section mapping; representative visual samples were rendered for diagrams, handwriting, low-text slides, and code examples.

The source materials were analyzed independently before related topics were classified together. Questions remain source-based; potentially disputed claims are recorded separately and excluded from definitive questions where practical.

## Question counts

Total: **446 questions**. Linux: **204**; Windows: **218**; cross-platform: **24**. Difficulty counts: foundational 91 (20.4%), intermediate 218 (48.9%), advanced 137 (30.7%). The requested approximate target is 20% / 35% / 45%, so the current distribution misses that target.

Question types include conceptual, command syntax/output, scenario, troubleshooting, sequence, comparison, security, and configuration.

## Topic inventory and question coverage

| Subject | Topic | Subtopic | Source pages | Planned | Actual | Status |
|---|---|---|---|---:|---:|---|
| linux | OS and Linux Foundations | OS functions and kernel | devendraCOSA p. 1-5, 94-98 | 5 | 5 | in_progress |
| linux | Shells, Paths, and Linux Basics | Shells, paths, and filesystems | devendraCOSA p. 4-7, 99-102 | 4 | 4 | in_progress |
| linux | Programs and Processes | Executable layout and process control block | devendraCOSA p. 8-9, 41-44 | 5 | 5 | in_progress |
| linux | Command Execution and I/O | Standard streams, redirection, and pipes | devendraCOSA p. 9-14, 45-51 | 6 | 6 | in_progress |
| linux | Linux Commands | Navigation and file/directory commands | devendraCOSA p. 6-15, 10-15 | 8 | 10 | in_progress |
| linux | Text Processing | Regular expressions and grep | devendraCOSA p. 15-16 | 5 | 5 | needs_review |
| linux | Text Processing | sed substitutions and line operations | devendraCOSA p. 19-21 | 5 | 5 | needs_review |
| linux | Text Processing | awk fields, variables, and actions | devendraCOSA p. 21-24 | 5 | 5 | in_progress |
| linux | Editors | vi/vim modes and commands | devendraCOSA p. 16-18 | 4 | 4 | needs_review |
| linux | Filesystems and Permissions | Permissions and ownership | devendraCOSA p. 25-27, 57-60 | 6 | 6 | in_progress |
| linux | Filesystems and Permissions | Inodes, file types, and filesystem layout | devendraCOSA p. 27-28, 57-60 | 5 | 5 | needs_review |
| linux | Filesystems and Permissions | Hard links and symbolic links | devendraCOSA p. 61-62 | 5 | 5 | in_progress |
| linux | Boot and Initialization | Firmware, boot process, and systemd targets | devendraCOSA p. 64-67, 89-93 | 6 | 6 | needs_review |
| linux | Boot and Initialization | System and user profiles | devendraCOSA p. 68 | 3 | 3 | needs_review |
| linux | Storage Management | Storage media and interfaces | devendraCOSA p. 70-74, 70-74 | 6 | 6 | in_progress |
| linux | Storage Management | Partitions, MBR, GPT, and tools | devendraCOSA p. 75-80, 75-80 | 7 | 7 | needs_review |
| linux | Storage Management | Filesystems and mounting | devendraCOSA p. 81-83, 81-83, 147 | 6 | 6 | needs_review |
| linux | Storage Management | Logical Volume Manager | devendraCOSA p. 84-87, 147-149 | 7 | 7 | in_progress |
| linux | Package Management | RPM/DNF/YUM and APT/dpkg | devendraCOSA p. 32-39, 32-39 | 8 | 8 | needs_review |
| linux | Linux Networking | Network inspection and troubleshooting commands | devendraCOSA p. 103-144 | 10 | 11 | in_progress |
| linux | Linux Networking | IP addressing and network tools | amitCOSA p. 60-67 | 6 | 6 | needs_review |
| linux | Linux Filesystem Hierarchy | Root directory structure | devendraCOSA p. 145-146 | 5 | 5 | needs_review |
| linux | Linux Service Administration | systemd, systemctl, and unit files | amitCOSA p. 335-345, 29-31, 149 | 8 | 8 | needs_review |
| linux | Linux Network Services | DHCP and Kea | amitCOSA p. 68-91 | 8 | 8 | needs_review |
| linux | Linux Network Services | DNS and BIND | amitCOSA p. 92-125 | 8 | 8 | needs_review |
| linux | Linux Network Services | FTP, NFS, and Samba | amitCOSA p. 126-151 | 8 | 8 | needs_review |
| linux | Linux Network Services | Apache and Nginx web serving | amitCOSA p. 386-413 | 7 | 8 | needs_review |
| linux | Linux Network Services | HAProxy | amitCOSA p. 237-244 | 6 | 6 | in_progress |
| linux | Linux Network Services | Nginx proxy and load balancing | amitCOSA p. 245-254 | 6 | 6 | needs_review |
| linux | Linux Network Services | Mail protocols and delivery pipeline | amitCOSA p. 255-282 | 9 | 9 | needs_review |
| linux | Linux Network Services | Apache HTTP Server | amitCOSA p. 386-404, 386-404 | 7 | 7 | needs_review |
| linux | Linux Network Services | Nginx web server | amitCOSA p. 405-413, 405-413 | 6 | 6 | in_progress |
| windows | Active Directory Fundamentals | AD DS purpose and evolution | amitCOSA p. 2-3 | 4 | 4 | needs_review |
| windows | Active Directory Structure | Objects, OUs, domains, trees, forests | amitCOSA p. 7-15, 4-5 | 8 | 8 | in_progress |
| windows | Active Directory Structure | Global Catalog, trusts, and naming | amitCOSA p. 13-15 | 5 | 5 | needs_review |
| windows | Active Directory Operations | DCs, database, sites, and replication | amitCOSA p. 16-24, 17-24 | 8 | 8 | needs_review |
| windows | Active Directory Operations | FSMO roles | amitCOSA p. 25, 153-156 | 7 | 7 | in_progress |
| windows | Active Directory Operations | AD files and administration tools | amitCOSA p. 26-27 | 5 | 5 | in_progress |
| windows | Active Directory Operations | FSMO role transfer operations | amitCOSA p. 152-161, 152-161 | 5 | 5 | needs_review |
| windows | Authentication and Access | Kerberos | amitCOSA p. 29-31 | 6 | 6 | in_progress |
| windows | Authentication and Access | NTLM | amitCOSA p. 32-33 | 4 | 4 | in_progress |
| windows | AD Deployment | Install AD DS, promote DC, and join clients | amitCOSA p. 34-46, 42-46 | 7 | 7 | needs_review |
| windows | AD Deployment | Additional domain controllers | amitCOSA p. 47-59, 47-59 | 7 | 7 | needs_review |
| windows | Network Services | DHCP protocol and administration | amitCOSA p. 68-91, 83-91 | 8 | 8 | needs_review |
| windows | Network Services | DNS concepts and records | amitCOSA p. 92-101, 111-125 | 8 | 8 | needs_review |
| windows | Group Policy | GPO structure, links, and processing | amitCOSA p. 162-170, 162-170 | 9 | 9 | needs_review |
| windows | Group Policy Security | Password, lockout, Kerberos, audit, and restrictions | amitCOSA p. 171-182, 171-182 | 8 | 8 | needs_review |
| windows | Virtualization | Hypervisors and virtual machines | amitCOSA p. 183-189, 190-198 | 6 | 6 | in_progress |
| windows | Virtualization | Hyper-V architecture and operations | amitCOSA p. 190-198 | 8 | 8 | needs_review |
| windows | Windows Server Administration | OS administration and server platform | amitCOSA p. 199-224, 214-224 | 6 | 6 | needs_review |
| windows | Storage and Virtualization | iSCSI | amitCOSA p. 225-229, 225-229 | 4 | 4 | needs_review |
| windows | High Availability and Load Balancing | Load balancing concepts | amitCOSA p. 230-237, 283-302 | 6 | 6 | in_progress |
| windows | High Availability and Load Balancing | Scalability and Windows NLB | amitCOSA p. 283-302 | 7 | 7 | needs_review |
| windows | File Services | SMB share and NTFS permissions | amitCOSA p. 303-309, 303-309 | 8 | 8 | needs_review |
| windows | File Services | Windows file server, FSRM, and DFS | amitCOSA p. 310-314, 310-314 | 7 | 7 | needs_review |
| windows | PowerShell | Cmdlets and object pipeline | amitCOSA p. 315-322, 315-322 | 6 | 6 | needs_review |
| windows | PowerShell | Variables, types, collections, loops, and functions | amitCOSA p. 323-334, 323-334 | 8 | 8 | needs_review |
| windows | Identity Administration | Users and account lifecycle | amitCOSA p. 346-355, 346-355 | 7 | 7 | needs_review |
| windows | Identity Administration | Groups and scope | amitCOSA p. 356-367, 356-367 | 8 | 8 | needs_review |
| windows | Identity Administration | Computer accounts and delegated administration | amitCOSA p. 368-372, 368-372 | 5 | 5 | needs_review |
| windows | Remote Access and Authentication | VPN, NPS, and RADIUS | amitCOSA p. 373-385, 373-385 | 7 | 7 | needs_review |
| windows | Web Services | IIS and HTTP fundamentals | amitCOSA p. 414-425, 414-425 | 6 | 6 | needs_review |
| windows | Deployment Services | Windows Deployment Services | amitCOSA p. 426-430, 426-430 | 6 | 6 | needs_review |
| windows | Backup and Recovery | Windows Server Backup | amitCOSA p. 431-439, 431-439 | 7 | 7 | needs_review |
| windows | Update Management | WSUS | amitCOSA p. 440-447, 440-447 | 7 | 7 | needs_review |
| cross_platform | Cross-platform Administration | Equivalent OS administration tasks | amitCOSA p. 200-224 | 4 | 10 | needs_review |
| cross_platform | Cross-platform Identity | Windows and Linux domain joining | amitCOSA p. 42-46 | 5 | 5 | in_progress |
| cross_platform | Cross-platform File Services | Windows and Linux file sharing | amitCOSA p. 145-151 | 5 | 5 | needs_review |
| cross_platform | Cross-platform Web Services | Apache and IIS roles | amitCOSA p. 386-424 | 4 | 4 | needs_review |

## Page coverage ledger

Every source page was extracted and assigned to one section range. Cover/interstitial pages are explicitly identified. The page-level ledger is included in topic_inventory.json.

### devendraCOSA (149 pages)
- PDF pages 1-7: OS concepts, kernel, paths, shell and basic commands.
- PDF pages 8-18: Programs, processes, streams, commands, regex and vi.
- PDF pages 19-24: sed and awk.
- PDF pages 25-28: Permissions and filesystem structures.
- PDF pages 29-39: systemd services and package management.
- PDF pages 40-40: Cover/interstitial slide.
- PDF pages 41-46: Executable/process diagrams, command execution, redirection and pipes.
- PDF pages 47-47: Cover/interstitial slide.
- PDF pages 48-55: Redirection and pipe diagrams.
- PDF pages 56-56: Cover/interstitial slide.
- PDF pages 57-62: Permissions, filesystem diagrams and links.
- PDF pages 63-63: Cover/interstitial slide.
- PDF pages 64-68: Firmware/boot process and shell profiles.
- PDF pages 69-69: Cover/interstitial slide.
- PDF pages 70-87: Storage media, interfaces, partitioning, filesystems, mounting and LVM.
- PDF pages 88-88: Cover/interstitial slide.
- PDF pages 89-93: Boot and system initialization slides.
- PDF pages 94-102: OS/kernel concepts, distributions, shell and filesystem paths.
- PDF pages 103-144: Linux network commands and troubleshooting.
- PDF pages 145-146: Linux root filesystem hierarchy.
- PDF pages 147-149: Storage/LVM and systemd command examples.
### amitCOSA (447 pages)
- PDF pages 1-5: Active Directory introduction and logical-structure diagrams.
- PDF pages 6-15: AD logical structure, objects, OUs, domains, forests, trusts and naming.
- PDF pages 16-27: AD physical structure, DCs, data store, replication, sites, GC, FSMO and tools.
- PDF pages 28-33: Kerberos and NTLM authentication.
- PDF pages 34-46: AD DS installation, promotion and Windows/Linux domain join.
- PDF pages 47-59: Additional domain controllers and recovery.
- PDF pages 60-67: Network management and Linux network tools.
- PDF pages 68-91: DHCP and Kea.
- PDF pages 92-125: DNS concepts, zones, records and BIND.
- PDF pages 126-133: FTP.
- PDF pages 134-144: NFS.
- PDF pages 145-151: Samba and file protocol comparison.
- PDF pages 152-161: FSMO roles and transfers.
- PDF pages 162-182: Group Policy and security policy tasks.
- PDF pages 183-198: Virtualization and Hyper-V.
- PDF pages 199-224: OS administration and Windows Server.
- PDF pages 225-229: iSCSI storage.
- PDF pages 230-244: Load balancing and HAProxy.
- PDF pages 245-254: Nginx reverse proxy/load balancing.
- PDF pages 255-282: Mail services and protocols.
- PDF pages 283-302: Scalability, load-balancer concepts and Windows NLB.
- PDF pages 303-314: SMB/NTFS permissions, file server, FSRM and DFS.
- PDF pages 315-334: PowerShell and scripts.
- PDF pages 335-345: Linux services, system initialization and systemd.
- PDF pages 346-372: AD users, groups, computer accounts and delegation.
- PDF pages 373-385: VPN and Network Policy Server.
- PDF pages 386-404: Apache HTTP Server.
- PDF pages 405-413: Nginx web server.
- PDF pages 414-425: Web fundamentals, IIS and firewall direction.
- PDF pages 426-430: Windows Deployment Services.
- PDF pages 431-439: Windows Server Backup and recovery.
- PDF pages 440-447: WSUS update management.

## Quality checks

- JSON output serialized successfully.
- Question IDs are unique across the three banks.
- Every question has exactly four distinct options, one valid correct option, and four non-empty option explanations.
- All source page references fall within the supplied PDFs.
- Exact duplicate question text was not found. A lexical-similarity screen was reviewed; close matches test distinct facts, while a full semantic near-duplicate review remains open.
- No topic is marked complete from question count alone; concept-level coverage review remains open.

## Source issues and limitations

19 source statements or formatting details need review; see source_issues.json. These flags are based on contradictions, ambiguous wording, or questionable generalizations within the supplied material; no outside fact-check was performed. Coverage status counts are: {'in_progress': 21, 'needs_review': 48}. The inventory plans 436 questions; 446 are present and every subtopic meets or exceeds its planned count. No fully unreadable page was recorded; visual review was limited to representative samples and is identified page by page in topic_inventory.json. Concept-level coverage and full semantic review remain open, and some source statements need review before they are used definitively. The target difficulty distribution is not met. These deliverables provide broad, traceable revision coverage, but they do **not** certify exhaustive coverage of every examinable detail. No definitive question relies on the most visibly contradictory claims identified in source_issues.json.
