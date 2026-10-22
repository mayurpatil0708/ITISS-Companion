#!/usr/bin/env python3
"""Build non-published CMCE candidate banks from the extracted MCQ JSON files.

The original extraction files and the website's current banks are read-only.
This script creates a separate schema-v2 staging export. It intentionally does
not infer external answer verification or publish unverified answers to quizzes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT = Path('/home/mayur/Music/AntigravityCOSA')
EXTRACTED = Path('/home/mayur/Music/Material/CCEE/SORTED/extrated/question_banks')
WEBSITE_BANKS = PROJECT / 'public/question-banks'
WEBSITE_MANIFEST = WEBSITE_BANKS / 'manifest.json'
OUTPUT = WEBSITE_BANKS / 'consolidated-v2'

SUBJECTS = {
    'fundamental-computer-networks': {
        'name': 'Fundamental of Computer Networks', 'short': 'FCN', 'folder': 'fcn',
    },
    'programming-concepts': {
        'name': 'Programming Concepts', 'short': 'PC', 'folder': 'pc',
    },
    'cosa': {
        'name': 'Concepts of Operating System and Administration', 'short': 'COSA', 'folder': 'cosa',
    },
    'it-infrastructure-devops': {
        'name': 'IT Infrastructure Management & DevOps', 'short': 'IIMD', 'folder': 'iimd',
    },
}
FOLDER_TO_SUBJECT = {v['folder']: k for k, v in SUBJECTS.items()}
LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)


def digest_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def clean_text(value: Any) -> str:
    if value is None:
        return ''
    if isinstance(value, list):
        value = '\n'.join(str(x) for x in value)
    text = str(value).replace('\r', '\n').replace('\u00a0', ' ')
    lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n')]
    while lines and not lines[0]:
        lines.pop(0)
    while lines and not lines[-1]:
        lines.pop()
    compact: list[str] = []
    for line in lines:
        if not line and (not compact or not compact[-1]):
            continue
        compact.append(line)
    return '\n'.join(compact)


def key_text(value: Any) -> str:
    return re.sub(r'[^a-z0-9]+', ' ', clean_text(value).casefold()).strip()


def patterns_score(text: str, patterns: list[tuple[str, int]]) -> int:
    return sum(weight for pattern, weight in patterns if re.search(pattern, text, re.I))


SUBJECT_CUES = {
    'programming-concepts': [
        (r'\bpython\b|\bmysql\b|\bsql\b|\bdbms\b|\bdatabase\b|\bquery\b|\bprogramming\b', 5),
        (r'\b(variable|loop|function|class|exception|tuple|dictionary|list comprehension|lambda|cursor|join|normalization)\b', 3),
        (r'\b(array|operator|syntax|data type|algorithm|recursion|inheritance)\b', 2),
    ],
    'it-infrastructure-devops': [
        (r'\b(devops|itil|aws|amazon web services|ec2|s3|rds|vpc|cloud computing|terraform|jenkins|docker|kubernetes|container)\b', 5),
        (r'\b(ci/?cd|pipeline|incident management|change management|problem management|service desk|cmdb|data cent(?:er|re)|configuration management|ansible)\b', 4),
        (r'\b(virtual machine|hypervisor|infrastructure|sla|service level|release management|deployment)\b', 2),
    ],
    'fundamental-computer-networks': [
        (r'\b(osi|tcp/?ip|ipv4|ipv6|subnet|subnetting|routing|router|switching|ethernet|vlan|ospf|bgp|arp|icmp|nat|mac address)\b', 5),
        (r'\b(dns|dhcp|udp|tcp|http|https|wireless|wi-?fi|network protocol|network layer|data link|port number)\b', 3),
        (r'\b(network model|network topology|packet|frame|ip address|bandwidth|collision domain)\b', 2),
    ],
    'cosa': [
        (r'\b(linux|ubuntu|red hat|rocky linux|windows server|active directory|group policy|powershell|systemd|bash|kernel)\b', 5),
        (r'\b(operating system|process|thread|deadlock|cpu scheduling|virtual memory|paging|filesystem|file system|lvm|permission|user account|domain controller|fsm[o]?)\b', 4),
        (r'\b(system administration|boot process|shell command|registry|dns server|dhcp server|storage management|service administration)\b', 3),
    ],
}


TOPIC_RULES = {
    'cosa': [
        ('operating-system-fundamentals', 'Operating System Fundamentals', 'Processes and Threads', 'processes-and-threads', r'\b(process|thread|pcb|context switch)\b'),
        ('operating-system-fundamentals', 'Operating System Fundamentals', 'CPU Scheduling and Deadlocks', 'scheduling-and-deadlocks', r'\b(schedul|deadlock|semaphore|mutex|critical section|starvation)\b'),
        ('operating-system-fundamentals', 'Operating System Fundamentals', 'Memory Management', 'memory-management', r'\b(memory|paging|page fault|segmentation|virtual address|swap space)\b'),
        ('operating-system-fundamentals', 'Operating System Fundamentals', 'OS Architecture and Boot', 'os-architecture-and-boot', r'\b(kernel|system call|boot|operating system|monolithic|microkernel)\b'),
        ('linux-administration', 'Linux Administration', 'Linux Commands and Shell', 'linux-commands-and-shell', r'\b(linux|bash|shell|grep|awk|sed|chmod|chown|systemd|command line)\b'),
        ('linux-administration', 'Linux Administration', 'Users, Permissions, and Packages', 'users-permissions-packages', r'\b(user|group|permission|sudo|package|apt|yum|dnf|rpm)\b'),
        ('windows-server-administration', 'Windows Server Administration', 'Active Directory and Group Policy', 'active-directory-and-group-policy', r'\b(active directory|domain controller|group policy|gpo|fsm[o]?|forest|organizational unit|\bou\b)\b'),
        ('windows-server-administration', 'Windows Server Administration', 'Windows Server and PowerShell', 'windows-server-and-powershell', r'\b(windows|powershell|wsus|hyper-v|iis|server manager)\b'),
        ('storage-and-file-systems', 'Storage and File Systems', 'Disks, LVM, and File Systems', 'disks-lvm-filesystems', r'\b(storage|disk|partition|lvm|filesystem|file system|inode|raid|mount)\b'),
        ('network-administration', 'Network Administration', 'DNS, DHCP, and Network Services', 'dns-dhcp-network-services', r'\b(dns|dhcp|network service|samba|nfs|sssd|kerberos|firewall)\b'),
        ('virtualization-and-security', 'Virtualization and Security', 'Virtualization and Access Control', 'virtualization-access-control', r'\b(virtualization|hypervisor|security|authentication|authorization|acl|encryption)\b'),
        ('system-administration', 'System Administration', 'Monitoring, Backup, and Troubleshooting', 'monitoring-backup-troubleshooting', r'\b(monitor|backup|recovery|troubleshoot|log file|syslog|audit)\b'),
    ],
    'fundamental-computer-networks': [
        ('network-models-and-protocols', 'Network Models and Protocols', 'OSI and TCP/IP Models', 'osi-and-tcp-ip-models', r'\b(osi|tcp/?ip|layer [1-7]|encapsulation|protocol suite)\b'),
        ('ip-addressing-and-routing', 'IP Addressing and Routing', 'IP Addressing and Subnetting', 'ip-addressing-subnetting', r'\b(ipv4|ipv6|ip address|subnet|subnetting|cidr|apipa)\b'),
        ('ip-addressing-and-routing', 'IP Addressing and Routing', 'Routing Protocols', 'routing-protocols', r'\b(rout(e|ing|er)|ospf|bgp|rip|static route|default route)\b'),
        ('ethernet-and-switching', 'Ethernet and Switching', 'Ethernet, VLANs, and Switching', 'ethernet-vlan-switching', r'\b(ethernet|switch|switching|vlan|trunk|stp|spanning tree|mac address)\b'),
        ('transport-and-application-protocols', 'Transport and Application Protocols', 'TCP, UDP, DNS, and DHCP', 'tcp-udp-dns-dhcp', r'\b(tcp|udp|dns|dhcp|http|https|ftp|smtp|port number|socket)\b'),
        ('network-access-and-security', 'Network Access and Security', 'Wireless and Network Security', 'wireless-network-security', r'\b(wireless|wi-?fi|wlan|security|firewall|nat|vpn|acl|encryption)\b'),
        ('network-troubleshooting', 'Network Troubleshooting', 'Diagnostics and Troubleshooting', 'diagnostics-troubleshooting', r'\b(ping|traceroute|diagnos|troubleshoot|packet capture|wireshark|tcpdump)\b'),
    ],
    'programming-concepts': [
        ('python-programming', 'Python Programming', 'Python Syntax and Data Types', 'python-syntax-data-types', r'\b(python|tuple|dictionary|list comprehension|lambda|indentation|pip|__init__)\b'),
        ('python-programming', 'Python Programming', 'Control Flow, Functions, and OOP', 'python-control-functions-oop', r'\b(function|loop|if statement|class|object|inheritance|exception|recursion|iterator|generator)\b'),
        ('sql-and-mysql', 'SQL and MySQL', 'SQL Queries and Joins', 'sql-queries-joins', r'\b(sql|mysql|select|insert|update|delete|join|where clause|group by|having)\b'),
        ('database-concepts', 'Database Concepts', 'Database Design and Transactions', 'database-design-transactions', r'\b(database|dbms|normalization|primary key|foreign key|transaction|acid|index|schema|view)\b'),
        ('programming-fundamentals', 'Programming Fundamentals', 'Variables, Operators, and Control Structures', 'variables-operators-control-structures', r'\b(variable|operator|data type|array|string|conditional|loop|algorithm|pseudocode)\b'),
        ('data-structures-and-algorithms', 'Data Structures and Algorithms', 'Data Structures and Algorithms', 'data-structures-algorithms', r'\b(stack|queue|linked list|tree|graph|sorting|searching|complexity|big o)\b'),
    ],
    'it-infrastructure-devops': [
        ('it-service-management', 'IT Service Management', 'ITIL Practices and Service Lifecycle', 'itil-practices-service-lifecycle', r'\b(itil|incident management|problem management|change management|service desk|service level|cmdb|release management)\b'),
        ('cloud-computing', 'Cloud Computing', 'AWS and Cloud Services', 'aws-cloud-services', r'\b(aws|amazon|ec2|s3|rds|vpc|cloud|availability zone|autoscaling|load balancer)\b'),
        ('data-center-infrastructure', 'Data Center Infrastructure', 'Data Center Design and Operations', 'data-center-design-operations', r'\b(data cent(?:er|re)|rack|power distribution|cooling|ups|pue|server room|cabling)\b'),
        ('devops-and-cicd', 'DevOps and CI/CD', 'Pipelines, Builds, and Release', 'pipelines-builds-release', r'\b(devops|ci/?cd|pipeline|jenkins|build|artifact|git|version control|deployment|release)\b'),
        ('containers-and-virtualization', 'Containers and Virtualization', 'Docker, Kubernetes, and Virtual Machines', 'docker-kubernetes-vms', r'\b(docker|container|kubernetes|pod|image|hypervisor|virtual machine|vmware)\b'),
        ('infrastructure-automation', 'Infrastructure Automation', 'Configuration and Infrastructure as Code', 'configuration-and-iac', r'\b(terraform|ansible|puppet|chef|configuration management|infrastructure as code|automation)\b'),
        ('infrastructure-operations', 'Infrastructure Operations', 'Monitoring and Service Operations', 'monitoring-service-operations', r'\b(monitoring|logging|alert|availability|capacity|backup|disaster recovery|sla|operations)\b'),
    ],
}


def infer_subject(text: str, source_folder_subject: str) -> tuple[str, str, str]:
    scores = {sid: patterns_score(text, cues) for sid, cues in SUBJECT_CUES.items()}
    ranked = sorted(scores.items(), key=lambda x: (-x[1], x[0]))
    best_id, best_score = ranked[0]
    second_score = ranked[1][1]
    folder_score = scores.get(source_folder_subject, 0)
    if best_score >= 5 and best_score >= folder_score + 2 and best_score - second_score >= 2:
        return best_id, 'high', 'question_content_cues'
    if folder_score >= 3 and folder_score >= best_score - 1:
        return source_folder_subject, 'medium', 'content_and_source_subject_folder'
    if best_score >= 5 and best_score - second_score >= 2:
        return best_id, 'medium', 'question_content_cues'
    return source_folder_subject, 'low', 'source_subject_folder_fallback'


def infer_topic(subject_id: str, text: str) -> tuple[dict[str, str], dict[str, str], str]:
    for sub_id, sub_name, topic_name, topic_id, pattern in TOPIC_RULES[subject_id]:
        if re.search(pattern, text, re.I):
            return {'id': sub_id, 'name': sub_name}, {'id': topic_id, 'name': topic_name}, 'content_keyword_rule'
    meta = {
        'cosa': ('system-administration', 'System Administration', 'General Administration', 'general-administration'),
        'fundamental-computer-networks': ('network-fundamentals', 'Network Fundamentals', 'General Networking', 'general-networking'),
        'programming-concepts': ('programming-fundamentals', 'Programming Fundamentals', 'General Programming', 'general-programming'),
        'it-infrastructure-devops': ('infrastructure-operations', 'Infrastructure Operations', 'General Infrastructure', 'general-infrastructure'),
    }[subject_id]
    return {'id': meta[0], 'name': meta[1]}, {'id': meta[3], 'name': meta[2]}, 'subject_fallback'


def parse_options(q: dict[str, Any], legacy: bool) -> tuple[list[dict[str, str]], bool, dict[str, int]]:
    raw = q.get('options') or []
    if not isinstance(raw, list):
        return [], True, {}
    options: list[dict[str, str]] = []
    source_label_positions: dict[str, list[int]] = defaultdict(list)
    invalid = len(raw) < 2 or len(raw) > len(LETTERS)
    for i, item in enumerate(raw):
        if isinstance(item, dict):
            text = clean_text(item.get('text', item.get('value', '')))
            label = str(item.get('id', item.get('label', LETTERS[i] if i < len(LETTERS) else i + 1))).upper()
        else:
            text = clean_text(item)
            label = LETTERS[i] if i < len(LETTERS) else str(i + 1)
        if not text:
            invalid = True
        source_label_positions[label].append(i)
        options.append({'id': LETTERS[i] if i < len(LETTERS) else str(i + 1), 'text': text})
    if len(raw) not in (2, 4):
        invalid = True
    if len(source_label_positions) != len(raw):
        invalid = True
    label_to_index = {label: pos[0] for label, pos in source_label_positions.items() if len(pos) == 1}
    if legacy and len(raw) == 4:
        label_to_index.update({LETTERS[i]: i for i in range(4)})
    return options, invalid, label_to_index


def answers_for(q: dict[str, Any], label_to_index: dict[str, int], option_count: int, legacy: bool) -> tuple[tuple[str, ...], bool, list[str]]:
    raw = q.get('correctAnswers')
    if raw is None and q.get('correct_option_id'):
        raw = [q.get('correct_option_id')]
    if raw is None:
        raw = q.get('correct_answer', q.get('answer'))
    if isinstance(raw, (str, int)):
        raw = [raw]
    if not isinstance(raw, list):
        return (), False, []
    raw_labels = [str(x).strip().upper() for x in raw if str(x).strip()]
    mapped: list[str] = []
    invalid = False
    for label in raw_labels:
        if label in label_to_index:
            idx = label_to_index[label]
            mapped.append(LETTERS[idx] if idx < len(LETTERS) else str(idx + 1))
        elif label.isdigit() and 1 <= int(label) <= option_count:
            idx = int(label) - 1
            mapped.append(LETTERS[idx] if idx < len(LETTERS) else str(idx + 1))
        else:
            invalid = True
    return tuple(sorted(set(mapped))), invalid, raw_labels


def iter_inputs() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    source_manifest = {}
    if WEBSITE_MANIFEST.exists():
        try:
            m = json.loads(WEBSITE_MANIFEST.read_text(encoding='utf-8'))
            source_manifest = {x.get('document_id'): x for x in m.get('source_documents', [])}
        except Exception:
            source_manifest = {}
    occurrences: list[dict[str, Any]] = []
    inventory: list[dict[str, Any]] = []
    paths = sorted(EXTRACTED.rglob('*.json')) if EXTRACTED.exists() else []
    for path in paths:
        rel = path.relative_to(EXTRACTED).as_posix()
        folder = path.parent.name.lower()
        source_subject = FOLDER_TO_SUBJECT.get(folder)
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
            qs = data.get('questions', []) if isinstance(data, dict) else []
            if not isinstance(qs, list):
                raise ValueError('questions field is not a list')
        except Exception as exc:
            inventory.append({'sourceJson': rel, 'sourceKind': 'extracted_pdf_bank', 'questionCount': 0, 'error': str(exc)})
            continue
        source_meta = data.get('source', {}) if isinstance(data.get('source'), dict) else {}
        inventory.append({'sourceJson': rel, 'sourceKind': 'extracted_pdf_bank', 'sourceSubjectFolder': folder,
                          'sourcePdf': source_meta.get('relativePath'), 'questionCount': len(qs),
                          'sha256': digest_file(path), 'ocrPagesUsed': source_meta.get('ocrPagesUsed', [])})
        for q in qs:
            if not isinstance(q, dict):
                q = {'question': str(q)}
            occurrences.append(make_occurrence(q, path, rel, source_meta, source_subject, False, None))

    legacy_names = {
        'linux_question_bank.json', 'windows_question_bank.json', 'cross_platform_question_bank.json'
    }
    for path in sorted(WEBSITE_BANKS.glob('*_question_bank.json')):
        if path.name not in legacy_names:
            continue
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
            qs = data.get('questions', []) if isinstance(data, dict) else []
            if not isinstance(qs, list):
                raise ValueError('questions field is not a list')
        except Exception as exc:
            inventory.append({'sourceJson': path.relative_to(PROJECT).as_posix(), 'sourceKind': 'existing_website_bank', 'questionCount': 0, 'error': str(exc)})
            continue
        inventory.append({'sourceJson': path.relative_to(PROJECT).as_posix(), 'sourceKind': 'existing_website_bank',
                          'sourceSubjectFolder': data.get('subject'), 'questionCount': len(qs), 'sha256': digest_file(path)})
        for q in qs:
            if not isinstance(q, dict):
                q = {'question_text': str(q)}
            doc_id = q.get('source', {}).get('document_id') if isinstance(q.get('source'), dict) else None
            doc_meta = source_manifest.get(doc_id, {})
            occurrences.append(make_occurrence(q, path, path.relative_to(PROJECT).as_posix(), doc_meta,
                                               'cosa', True, doc_id))
    return occurrences, inventory


def make_occurrence(q: dict[str, Any], json_path: Path, json_rel: str, source_meta: dict[str, Any],
                    source_subject: str | None, legacy: bool, doc_id: str | None) -> dict[str, Any]:
    subject_folder = source_subject or 'cosa'
    question = clean_text(q.get('question', q.get('question_text', q.get('stem', ''))))
    raw_topic = clean_text(q.get('topic', ''))
    raw_subtopic = clean_text(q.get('subtopic', ''))
    options, malformed_options, label_to_index = parse_options(q, legacy)
    answer_sig, answer_invalid, raw_answers = answers_for(q, label_to_index, len(options), legacy)
    evidence = q.get('answerEvidence') if isinstance(q.get('answerEvidence'), dict) else {}
    answer_origin = evidence.get('method') or evidence.get('source') or ('existing_curated_bank' if legacy and raw_answers else 'none')
    source_pdf = source_meta.get('relativePath') or source_meta.get('filename') or source_meta.get('file')
    if not source_pdf and doc_id:
        source_pdf = source_meta.get('filename') or doc_id
    page = q.get('sourcePage')
    if page is None:
        refs = q.get('sourceReferences')
        if isinstance(refs, list) and refs and isinstance(refs[0], dict):
            page = refs[0].get('page')
    if page is None:
        page = q.get('source', {}).get('pdf_page_start') if isinstance(q.get('source'), dict) else None
    qpages = set(q.get('sourcePages', []))
    if page is not None:
        qpages.add(page)
    ocr_pages = set(source_meta.get('ocrPagesUsed', []))
    if q.get('sourceTextMethod') == 'ocr' or bool(qpages & ocr_pages):
        source_text = 'ocr'
    elif legacy:
        source_text = 'existing_website_bank'
    else:
        source_text = 'native_pdf_text'
    content = '\n'.join([question, raw_topic, raw_subtopic, *[o['text'] for o in options]])
    sid, subject_confidence, subject_method = infer_subject(content, subject_folder)
    return {
        'question': question, 'options': options, 'subjectId': sid,
        'subjectConfidence': subject_confidence, 'subjectMethod': subject_method,
        'topicLabel': raw_topic, 'subtopicLabel': raw_subtopic,
        'topicContent': content,
        'source': {
            'filename': json_path.name, 'sourceJson': json_rel,
            'sourcePdf': source_pdf, 'sourcePdfPath': source_meta.get('path'), 'page': page,
            'originalQuestionId': q.get('id') or q.get('question_id') or q.get('sourceQuestionNumber'),
            'sourceQuestionNumber': q.get('sourceQuestionNumber'),
            'sourceSubjectFolder': subject_folder,
            'sourceTextMethod': source_text,
            'answerCandidateOptionIds': list(answer_sig),
            'answerCandidateRawLabels': raw_answers,
            'answerEvidenceOrigin': answer_origin,
            'answerEvidenceSummary': evidence.get('evidenceDetails') or evidence.get('supportingEvidence') or '',
            'sourceDraftExplanation': clean_text(q.get('explanation')) or None,
            'sourceDraftOptionExplanations': q.get('option_explanations') if legacy else None,
            'legacyTopic': raw_topic or None, 'legacySubtopic': raw_subtopic or None,
            'parserAmbiguous': bool(q.get('parserAmbiguous', False)),
            'malformedOptions': malformed_options,
            'invalidAnswerReference': answer_invalid,
            'sourceQuestionType': q.get('questionType') or q.get('question_type'),
        },
        'answerSignature': answer_sig,
        'difficulty': q.get('difficulty'),
    }


def build_records(occurrences: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    groups: dict[tuple[str, str, tuple[str, ...]], list[dict[str, Any]]] = defaultdict(list)
    stem_groups: dict[tuple[str, str], set[tuple[str, ...]]] = defaultdict(set)
    cross_subject: dict[tuple[str, tuple[str, ...]], set[str]] = defaultdict(set)
    for occ in occurrences:
        qkey = key_text(occ['question'])
        optkey = tuple(key_text(o['text']) for o in occ['options'])
        if not qkey or len(optkey) < 2:
            # Empty or optionless parser records are not safe to collapse.
            qkey += ' source-record ' + occ['source']['sourceJson'] + ' ' + str(occ['source']['originalQuestionId'])
        groups[(occ['subjectId'], qkey, optkey)].append(occ)
        stem_groups[(occ['subjectId'], qkey)].add(optkey)
        cross_subject[(qkey, optkey)].add(occ['subjectId'])

    records: list[dict[str, Any]] = []
    exact_groups: list[dict[str, Any]] = []
    near_groups: list[dict[str, Any]] = []
    conflict_count = 0
    for (sid, qkey, optkey), items in sorted(groups.items(), key=lambda kv: kv[0]):
        signatures = {tuple(item['answerSignature']) for item in items if item['answerSignature']}
        has_conflict = len(signatures) > 1
        if has_conflict:
            conflict_count += 1
        chosen = sorted(items, key=lambda x: (x['source']['sourceTextMethod'] == 'ocr', -len(x['question']), x['source']['sourceJson']))[0]
        subtopic, topic, topic_method = infer_topic(sid, '\n'.join([chosen['topicContent'], chosen['topicLabel'], chosen['subtopicLabel']]))
        source_items = []
        for item in sorted(items, key=lambda x: (x['source']['sourceJson'], str(x['source']['page']), str(x['source']['originalQuestionId']))):
            s = item['source'].copy()
            s['answerCandidateOptionIds'] = list(item['answerSignature'])
            source_items.append(s)
        serialized_key = json.dumps([sid, qkey, optkey], ensure_ascii=False, separators=(',', ':'))
        qid = f"{SUBJECTS[sid]['short'].lower()}-{hashlib.sha256(serialized_key.encode()).hexdigest()[:16]}"
        option_labels = [o['id'] for o in chosen['options']]
        review_reasons = ['independent_external_verification_pending']
        if has_conflict:
            verification_status = 'ambiguous'
            review_reasons.append('source_occurrences_disagree_on_answer')
        elif not signatures:
            verification_status = 'unresolved'
            review_reasons.append('no_answer_key_detected')
        else:
            verification_status = 'unresolved'
            review_reasons.append('source_answer_not_independently_researched')
        if any(x['source']['parserAmbiguous'] or x['source']['malformedOptions'] or x['source']['invalidAnswerReference'] for x in items):
            verification_status = 'needs_manual_review' if not has_conflict else 'ambiguous'
            review_reasons.append('source_question_structure_or_answer_mapping_is_ambiguous')
        if any(x['source']['sourceTextMethod'] == 'ocr' for x in items):
            if verification_status != 'ambiguous':
                verification_status = 'needs_manual_review'
            review_reasons.append('ocr_text_requires_visual_confirmation')
        if chosen['subjectConfidence'] == 'low':
            review_reasons.append('subject_classification_low_confidence')
        if len(chosen['options']) not in (2, 4):
            review_reasons.append('question_does_not_have_two_or_four_options')
        if len(set(x['source']['sourceQuestionType'] for x in items if x['source']['sourceQuestionType'])) > 1:
            review_reasons.append('question_type_varies_across_sources')
        qtype = chosen['source']['sourceQuestionType'] or ('true_false' if len(chosen['options']) == 2 else 'single_choice')
        source_answer_sets = []
        seen_sets = set()
        for item in items:
            if item['answerSignature']:
                sig = tuple(item['answerSignature'])
                if sig not in seen_sets:
                    seen_sets.add(sig)
                    source_answer_sets.append(list(sig))
        original_drafts = [x['sourceDraftExplanation'] for x in source_items if x.get('sourceDraftExplanation')]
        original_drafts = list(dict.fromkeys(original_drafts))
        record = {
            'id': qid, 'subjectId': sid,
            'subtopicId': subtopic['id'], 'subtopicName': subtopic['name'],
            'topicId': topic['id'], 'topicName': topic['name'],
            'question': chosen['question'],
            'questionType': qtype,
            'options': chosen['options'],
            'correctOptionId': None, 'correctOptionIds': [],
            'explanation': None, 'optionExplanations': None,
            'explanationStatus': 'pending_independent_research',
            'difficulty': next((x['difficulty'] for x in items if x.get('difficulty')), None),
            'source': {'files': source_items},
            'verification': {
                'status': verification_status, 'originalAnswerOptionIds': source_answer_sets,
                'finalAnswerOptionIds': [], 'confidence': 'low',
                'reason': 'No independent technical reference has been consulted for this question. Source answer markings are preserved as candidates and are not asserted as correct.',
                'sources': [],
            },
            'classification': {
                'status': 'needs_manual_review' if chosen['subjectConfidence'] == 'low' else 'assigned',
                'confidence': chosen['subjectConfidence'], 'method': chosen['subjectMethod'],
                'topicMethod': topic_method, 'originalLabels': list(dict.fromkeys(
                    f"{x['topicLabel']} / {x['subtopicLabel']}".strip(' /') for x in items if x['topicLabel'] or x['subtopicLabel'])),
            },
            'reviewReasons': list(dict.fromkeys(review_reasons)),
            'sourceDraftExplanations': original_drafts,
            'tags': [SUBJECTS[sid]['short'].lower(), subtopic['id'], topic['id']],
        }
        records.append(record)
        if len(items) > 1:
            exact_groups.append({'canonicalQuestionId': qid, 'subjectId': sid,
                'occurrenceCount': len(items), 'mergedDuplicateOccurrences': len(items) - 1,
                'answerSignatures': source_answer_sets, 'answerConflict': has_conflict,
                'decision': 'preserved_as_ambiguous_group' if has_conflict else 'exact_text_options_grouped; answer remains unverified',
                'sources': [{'sourceJson': s['sourceJson'], 'sourcePdf': s['sourcePdf'], 'page': s['page'],
                             'originalQuestionId': s['originalQuestionId'], 'answerCandidateOptionIds': s['answerCandidateOptionIds']}
                            for s in source_items]})
    for (sid, stem), options in stem_groups.items():
        if len(options) > 1:
            ids = [r['id'] for r in records if r['subjectId'] == sid and key_text(r['question']) == stem]
            near_groups.append({'subjectId': sid, 'questionIds': ids,
                                'message': 'Same normalized question stem appears with different option sets; retained separately pending semantic review.'})
    cross_groups = [{'normalizedStem': k[0], 'normalizedOptions': list(k[1]), 'subjectIds': sorted(v)}
                    for k, v in cross_subject.items() if len(v) > 1 and k[0]]
    details = {
        'exactDuplicateGroups': exact_groups, 'nearDuplicateGroups': near_groups,
        'crossSubjectDuplicateGroups': cross_groups, 'conflictingAnswerGroupCount': conflict_count,
        'sourceOccurrenceCount': len(occurrences), 'canonicalQuestionCount': len(records),
    }
    return records, details


def make_bank(sid: str, questions: list[dict[str, Any]], source_file_count: int) -> dict[str, Any]:
    topic_counts: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for q in questions:
        sub = topic_counts[q['subtopicId']]
        if q['topicId'] not in sub:
            sub[q['topicId']] = {'id': q['topicId'], 'name': q['topicName'], 'questionCount': 0}
        sub[q['topicId']]['questionCount'] += 1
    subtopics = []
    for sub_id, topicmap in sorted(topic_counts.items()):
        example = next(q for q in questions if q['subtopicId'] == sub_id)
        subtopics.append({'id': sub_id, 'name': example['subtopicName'],
                          'topics': [topicmap[k] for k in sorted(topicmap)]})
    counts = Counter(q['verification']['status'] for q in questions)
    return {
        'schemaVersion': '2.0', 'examStage': 'cmce',
        'subject': {'id': sid, 'name': SUBJECTS[sid]['name']},
        'metadata': {
            'description': 'Consolidated staging bank. No answer is externally verified; it is not included in the active quiz pool.',
            'totalQuestions': len(questions), 'verifiedQuestions': 0, 'correctedQuestions': 0,
            'reviewRequiredQuestions': len(questions), 'sourceJsonFiles': source_file_count,
            'answerStatusCounts': dict(counts), 'explanationsCompleted': 0,
            'activationStatus': 'staged_unverified',
        },
        'subtopics': subtopics, 'questions': questions,
    }


def write_outputs(records: list[dict[str, Any]], inventory: list[dict[str, Any]], duplicate_info: dict[str, Any], out: Path) -> dict[str, Any]:
    out.mkdir(parents=True, exist_ok=True)
    by_subject: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for q in records:
        by_subject[q['subjectId']].append(q)
    files_written = []
    all_review_items = []
    source_references = []
    topic_inventory = []
    for sid, spec in SUBJECTS.items():
        questions = sorted(by_subject.get(sid, []), key=lambda q: q['id'])
        source_count = sum(1 for f in inventory if f.get('questionCount', 0) and (
            f.get('sourceSubjectFolder') == spec['folder'] or
            (sid == 'cosa' and f.get('sourceKind') == 'existing_website_bank')
        ))
        bank = make_bank(sid, questions, source_count)
        slug = {
            'fundamental-computer-networks': 'fundamental-computer-networks',
            'programming-concepts': 'programming-concepts', 'cosa': 'cosa',
            'it-infrastructure-devops': 'it-infrastructure-devops',
        }[sid]
        bank_path = out / 'cmce' / f'{slug}.json'
        atomic_json(bank_path, bank)
        files_written.append(bank_path.relative_to(out).as_posix())
        verified_path = out / 'verified-quiz' / 'cmce' / f'{slug}.json'
        atomic_json(verified_path, {**bank, 'metadata': {**bank['metadata'], 'description': 'Only externally verified questions may appear here.', 'totalQuestions': 0, 'verifiedQuestions': 0, 'reviewRequiredQuestions': 0}, 'questions': []})
        files_written.append(verified_path.relative_to(out).as_posix())
        review_qs = [q for q in questions if q['verification']['status'] != 'verified_correct' and q['verification']['status'] != 'corrected']
        review_path = out / 'review' / 'cmce' / f'{slug}.json'
        atomic_json(review_path, {'schemaVersion': '2.0', 'examStage': 'cmce', 'subject': bank['subject'],
                                  'metadata': {'totalQuestions': len(review_qs), 'status': 'all candidates require independent research or review'},
                                  'questions': review_qs})
        files_written.append(review_path.relative_to(out).as_posix())
        for q in questions:
            all_review_items.append({'questionId': q['id'], 'subjectId': sid,
                                     'status': q['verification']['status'],
                                     'reviewReasons': q['reviewReasons'],
                                     'originalAnswerOptionIds': q['verification']['originalAnswerOptionIds']})
            source_references.append({'questionId': q['id'], 'subjectId': sid, 'sources': q['source']['files']})
        for sub in bank['subtopics']:
            for topic in sub['topics']:
                topic_inventory.append({'subjectId': sid, 'subtopicId': sub['id'], 'subtopic': sub['name'],
                                        'topicId': topic['id'], 'topic': topic['name'],
                                        'questionCount': topic['questionCount']})

    ccee_modules = [
        ('compliance-audit', 'Compliance Audit'), ('security-concepts', 'Security Concepts'),
        ('cyber-forensics', 'Cyber Forensics'), ('public-key-infrastructure', 'Public Key Infrastructure'),
        ('network-defense-countermeasures', 'Network Defense and Countermeasures (NDC)'),
    ]
    output_map = {
        'input-inventory.json': {'files': inventory},
        'consolidation-report.json': {
            'sourceOccurrenceCount': duplicate_info['sourceOccurrenceCount'],
            'canonicalQuestionCount': len(records),
            'questionsBySubject': {sid: len(by_subject.get(sid, [])) for sid in SUBJECTS},
            'exactDuplicateGroups': len(duplicate_info['exactDuplicateGroups']),
            'duplicateOccurrencesMergedOrGrouped': duplicate_info['sourceOccurrenceCount'] - len(records),
            'conflictingAnswerGroups': duplicate_info['conflictingAnswerGroupCount'],
            'malformedOrParserAmbiguousQuestions': sum('source_question_structure_or_answer_mapping_is_ambiguous' in q['reviewReasons'] for q in records),
            'excludedQuestions': 0, 'externallyVerifiedQuestions': 0,
        },
        'duplicate-report.json': duplicate_info,
        'answer-verification-report.json': {
            'externalResearchPerformed': False, 'questionsExternallyVerified': 0, 'answersCorrected': 0,
            'questionsAwaitingExternalVerification': len(records),
            'sourceMarkedAnswerCounts': dict(Counter('marked' if q['verification']['originalAnswerOptionIds'] else 'unmarked' for q in records)),
            'statusCounts': dict(Counter(q['verification']['status'] for q in records)),
            'policy': 'PDF answer keys/highlights and the existing website explanations are retained as source evidence only. They are not independent technical verification.',
            'reason': 'No per-question external research was completed in this processing pass; no answer is labeled verified or corrected.',
        },
        'answer-corrections.json': {'corrections': [], 'note': 'No answer was changed because no independent answer research was completed.'},
        'unresolved-questions.json': {'items': all_review_items},
        'source-references.json': {'items': source_references},
        'topic-inventory.json': {'schemaVersion': '2.0', 'examStage': 'cmce', 'topics': topic_inventory},
    }
    report_dir = out / 'reports'
    for name, payload in output_map.items():
        atomic_json(report_dir / name, payload)
        files_written.append(f'reports/{name}')

    source_counts = Counter()
    for item in inventory:
        source_counts[item.get('sourceKind', 'unknown')] += 1
    subject_manifest = []
    for sid, spec in SUBJECTS.items():
        qcount = len(by_subject.get(sid, []))
        subject_manifest.append({'moduleId': sid, 'subjectName': spec['name'], 'examStage': 'cmce',
            'candidateBank': f'cmce/{sid}.json', 'verifiedQuizBank': f'verified-quiz/cmce/{sid}.json',
            'reviewCollection': f'review/cmce/{sid}.json', 'questionCount': qcount,
            'verifiedQuestionCount': 0, 'status': 'staged_unverified', 'activationStatus': 'not_loaded_by_current_app'})
    manifest = {
        'schemaVersion': '2.0', 'generatedAt': datetime.now(timezone.utc).isoformat(),
        'project': str(PROJECT), 'sourceDirectory': str(EXTRACTED), 'existingWebsiteBanks': str(WEBSITE_BANKS),
        'sourceJsonFileCounts': dict(source_counts), 'sourceJsonFileCount': len(inventory),
        'sourceQuestionOccurrenceCount': duplicate_info['sourceOccurrenceCount'],
        'canonicalQuestionCount': len(records), 'examStagesIncluded': ['cmce'],
        'subjects': subject_manifest,
        'cceeModulesWithoutInput': [{'moduleId': module, 'name': name, 'sourceJsonFiles': 0, 'status': 'no_input_questions_found'} for module, name in ccee_modules],
        'outputFiles': sorted(files_written + ['manifest.json', 'reports/quality-assurance-report.md', 'reports/validation-report.json', 'README.md']),
        'researchStatus': {'externalQuestionLevelVerification': 'not_performed', 'verifiedQuestionCount': 0},
        'currentWebsiteBanksPreserved': True,
        'note': 'This staging export is not imported into the active quiz database. The current runtime accepts only linux/windows/cross_platform COSA records and does not represent independent answer research.',
    }
    atomic_json(out / 'manifest.json', manifest)
    files_written.append('manifest.json')
    readme = f"""# Consolidated ITISS Companion question-bank staging export\n\nGenerated from **{duplicate_info['sourceOccurrenceCount']:,}** source question occurrences across **{len(inventory)}** source JSON files, producing **{len(records):,}** canonical question records.\n\nThe four banks map to the existing CMCE module IDs. The five CCEE modules currently have no question-bank inputs in the inspected extraction directory.\n\n## Publication state\n\nThis is a **staging, unverified export**. No question-level external answer research was completed, so the verified quiz banks are empty. Extracted answer markings are preserved only as candidates under `verification.originalAnswerOptionIds`. The existing website banks and runtime seed files were left unchanged.\n\nOCR-derived, malformed, conflicting, or low-confidence classifications remain in review. Source explanations from existing banks are retained as drafts, not promoted as verified explanations.\n\n## Regenerate\n\n```bash\npython3 {PROJECT}/scripts/consolidate_itiss_question_banks.py --force\n```\n\nInput extracted JSON: `{EXTRACTED}`. Existing website source banks: `{WEBSITE_BANKS}`. Output: `{out}`.\n"""
    (out / 'README.md').write_text(readme, encoding='utf-8')
    qa = make_qa(records, inventory, duplicate_info, out, files_written)
    (report_dir / 'quality-assurance-report.md').write_text(qa, encoding='utf-8')
    return manifest


def make_qa(records: list[dict[str, Any]], inventory: list[dict[str, Any]], dup: dict[str, Any], out: Path, files_written: list[str]) -> str:
    by_subject = Counter(q['subjectId'] for q in records)
    ver = Counter(q['verification']['status'] for q in records)
    review = Counter(reason for q in records for reason in q['reviewReasons'])
    source_count = Counter(f.get('sourceKind', 'unknown') for f in inventory)
    source_occurrences = dup['sourceOccurrenceCount']
    lines = [
        '# Quality-assurance report', '',
        '## Input inventory', '',
        f'- Extracted PDF-bank JSON files: {source_count.get("extracted_pdf_bank", 0)}.',
        f'- Existing website question-bank JSON files preserved and included as legacy source occurrences: {source_count.get("existing_website_bank", 0)}.',
        f'- Total source question occurrences: {source_occurrences:,}.',
        f'- Canonical records after exact question/options grouping: {len(records):,}.',
        '', '## Consolidation by CMCE subject', '',
    ]
    for sid, spec in SUBJECTS.items():
        lines.append(f'- {spec["name"]}: {by_subject.get(sid, 0):,} canonical records.')
    lines += [
        '', '## Duplicate handling', '',
        f'- Exact normalized question-and-option groups: {len(dup["exactDuplicateGroups"]):,}.',
        f'- Source occurrences merged or represented in grouped records: {source_occurrences - len(records):,}.',
        f'- Groups with conflicting extracted answers: {dup["conflictingAnswerGroupCount"]:,}; retained as ambiguous review records.',
        f'- Same-stem groups with differing options: {len(dup["nearDuplicateGroups"]):,}; retained separately for semantic review.',
        f'- Cross-subject duplicate groups flagged: {len(dup["crossSubjectDuplicateGroups"]):,}.',
        '', '## Answer verification and explanations', '',
        '- External question-level web research: not performed in this pass.',
        '- Answers independently verified unchanged: 0.',
        '- Answers corrected: 0.',
        f'- Questions awaiting external answer verification: {len(records):,}.',
        '- Verified quiz-bank records: 0. The verified banks are deliberately empty.',
        '- Extracted answer keys/highlights are recorded as original candidates, not as verified answers.',
        '- No generated explanation was represented as a researched explanation. Existing website explanations were preserved in `sourceDraftExplanations` only.',
        '', '## Quality checks', '',
        f'- JSON serialization: passed for generated files in `{out}`.',
        '- Stable question IDs: generated from subject plus normalized question/options; the validator checks collisions.',
        '- Source provenance: retained for every canonical record; see `reports/source-references.json`.',
        '- Questions excluded or discarded: 0; malformed/uncertain records remain in the review collections.',
        '- Existing website source banks, seed banks, registry, and runtime behavior: unchanged.',
        '', '## Limitations', '',
        'This output is not ready for publication as a quiz bank. Answer correctness, question-specific educational explanations, and semantic near-duplicate decisions still require independent review. The current application uses a legacy COSA-only schema and imports seed banks directly, so these schema-v2 candidate banks are staged separately and are not active in its quiz pool. The CCEE extraction subjects were not present in the inspected input banks.',
        '', 'The source extraction count includes question records from PDFs, not proof that every item is a valid MCQ. A parser ambiguity, an OCR page, or a source disagreement is explicitly represented in the review status.',
    ]
    return '\n'.join(lines) + '\n'


def validate_output(out: Path, records: list[dict[str, Any]], source_occurrences: int) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    ids: set[str] = set()
    banks = list((out / 'cmce').glob('*.json'))
    for path in list(out.rglob('*.json')):
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except Exception as exc:
            errors.append({'file': path.relative_to(out).as_posix(), 'error': f'JSON parse error: {exc}'})
            continue
        if path.parent == out / 'cmce' and 'questions' in data:
            if data.get('schemaVersion') != '2.0' or data.get('examStage') != 'cmce':
                errors.append({'file': path.relative_to(out).as_posix(), 'error': 'Incorrect schema version or exam stage.'})
            if data.get('metadata', {}).get('totalQuestions') != len(data.get('questions', [])):
                errors.append({'file': path.relative_to(out).as_posix(), 'error': 'Question count metadata mismatch.'})
            valid_subtopics = {x['id'] for x in data.get('subtopics', [])}
            topic_pairs = {(x['id'], t['id']) for x in data.get('subtopics', []) for t in x.get('topics', [])}
            for q in data.get('questions', []):
                if q['id'] in ids:
                    errors.append({'questionId': q['id'], 'error': 'Duplicate ID across output banks.'})
                ids.add(q['id'])
                if q.get('subjectId') != data.get('subject', {}).get('id'):
                    errors.append({'questionId': q['id'], 'error': 'Cross-subject assignment mismatch.'})
                if q.get('subtopicId') not in valid_subtopics or (q.get('subtopicId'), q.get('topicId')) not in topic_pairs:
                    errors.append({'questionId': q['id'], 'error': 'Unknown subtopic/topic assignment.'})
                if not isinstance(q.get('source', {}).get('files'), list) or not q['source']['files']:
                    errors.append({'questionId': q['id'], 'error': 'Source provenance missing.'})
                if q.get('verification', {}).get('status') in ('verified_correct', 'corrected'):
                    errors.append({'questionId': q['id'], 'error': 'Unresearched question incorrectly marked verified.'})
                if q.get('correctOptionId') is not None or q.get('correctOptionIds'):
                    errors.append({'questionId': q['id'], 'error': 'Unverified answer exposed as final correct option.'})
                if not q.get('verification', {}).get('status') or not q.get('verification', {}).get('confidence'):
                    errors.append({'questionId': q['id'], 'error': 'Verification status or confidence is missing.'})
                if not q.get('question') or not isinstance(q.get('options'), list):
                    warnings.append({'questionId': q['id'], 'warning': 'Question text or options collection is missing; retained for review.'})
                option_ids = [o.get('id') for o in q.get('options', []) if isinstance(o, dict)]
                if len(option_ids) != len(q.get('options', [])) or len(option_ids) != len(set(option_ids)):
                    warnings.append({'questionId': q['id'], 'warning': 'Option records are malformed or option IDs repeat; retained for review.'})
                if any(not o.get('text') for o in q.get('options', []) if isinstance(o, dict)):
                    warnings.append({'questionId': q['id'], 'warning': 'One or more option texts are empty; retained in review and excluded from verified quiz banks.'})
        if path.parent.name == 'cmce' and path.parent.parent.name in ('verified-quiz', 'review'):
            rel = path.relative_to(out).as_posix()
            questions = data.get('questions', [])
            if data.get('metadata', {}).get('totalQuestions') != len(questions):
                errors.append({'file': rel, 'error': 'Review or verified-bank question count metadata mismatch.'})
            if path.parent.parent.name == 'verified-quiz':
                for q in questions:
                    if q.get('verification', {}).get('status') not in ('verified_correct', 'corrected'):
                        errors.append({'file': rel, 'questionId': q.get('id'), 'error': 'Unverified question included in verified quiz bank.'})
                    option_ids = {o.get('id') for o in q.get('options', []) if isinstance(o, dict)}
                    if q.get('correctOptionId') not in option_ids or not q.get('explanation'):
                        errors.append({'file': rel, 'questionId': q.get('id'), 'error': 'Verified quiz question lacks a valid answer or explanation.'})
            elif any(q.get('verification', {}).get('status') in ('verified_correct', 'corrected') for q in questions):
                errors.append({'file': rel, 'error': 'Verified question duplicated into review collection.'})
    report = {'valid': not errors, 'sourceOccurrences': source_occurrences, 'canonicalRecordsValidated': len(ids),
              'consolidatedBankFilesValidated': len(banks), 'verifiedQuestions': 0,
              'structuralReviewWarnings': len(warnings), 'warnings': warnings, 'errors': errors}
    atomic_json(out / 'reports' / 'validation-report.json', report)
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--force', action='store_true', help='Regenerate files in this script-owned staging directory.')
    args = parser.parse_args()
    out = args.output
    if out.exists() and any(out.iterdir()) and not args.force:
        raise SystemExit(f'{out} is not empty; inspect it or use --force to regenerate this staging export.')
    occurrences, inventory = iter_inputs()
    if not occurrences:
        raise SystemExit('No question records were found in the configured inputs.')
    records, duplicates = build_records(occurrences)
    manifest = write_outputs(records, inventory, duplicates, out)
    validation = validate_output(out, records, len(occurrences))
    qa_path = out / 'reports' / 'quality-assurance-report.md'
    with qa_path.open('a', encoding='utf-8') as f:
        f.write(f'\nAutomated staging schema validation: **{"passed" if validation["valid"] else "failed"}** ({len(validation["errors"])} errors, {validation["structuralReviewWarnings"]} structural-review warnings).\n')
        f.write(f'Generated at {manifest["generatedAt"]}.\n')
    print(json.dumps({'output': str(out), 'sourceFiles': len(inventory), 'sourceOccurrences': len(occurrences),
                      'canonicalQuestions': len(records), 'verificationStatuses': dict(Counter(q['verification']['status'] for q in records)),
                      'duplicateGroups': len(duplicates['exactDuplicateGroups']), 'validation': validation['valid'],
                      'validationErrors': len(validation['errors'])}, ensure_ascii=False, indent=2))
    return 0 if validation['valid'] else 1


if __name__ == '__main__':
    sys.exit(main())
