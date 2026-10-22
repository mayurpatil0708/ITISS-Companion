#!/usr/bin/env python3
"""Apply saved question-level research results to the staged ITISS banks.

This script never reads or modifies the original extracted questions. Add new
item records to reports/research-results.json, then run this script to resume
and rebuild the verified/review outputs from that durable overlay.
"""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT = Path('/home/mayur/Music/AntigravityCOSA')
OUT = PROJECT / 'public/question-banks/consolidated-v2'
REPORTS = OUT / 'reports'
RESULTS_PATH = REPORTS / 'research-results.json'
PROGRESS_PATH = REPORTS / 'research-progress.json'
ACCEPTED = {'verified_correct', 'corrected'}
REMOVE_REASONS_AFTER_SOURCE_REVIEW = {
    'source_question_structure_or_answer_mapping_is_ambiguous',
    'question_does_not_have_two_or_four_options',
    'ocr_text_requires_visual_confirmation',
}
REMOVE_REASONS_AFTER_RESEARCH = {
    'independent_external_verification_pending',
    'source_answer_not_independently_researched',
    'no_answer_key_detected',
}


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding='utf-8'))


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temp.replace(path)


def apply_item(question: dict[str, Any], result: dict[str, Any]) -> None:
    status = result['status']
    if status not in {'verified_correct', 'corrected', 'ambiguous', 'unresolved', 'needs_manual_review', 'outdated_context'}:
        raise ValueError(f"Unsupported verification status for {question['id']}: {status}")
    if result.get('correctedQuestion') is not None:
        question['question'] = result['correctedQuestion']
    if result.get('correctedOptions') is not None:
        question['options'] = result['correctedOptions']
    final_ids = result.get('finalAnswerOptionIds', [])
    if status in ACCEPTED:
        available = {option.get('id') for option in question.get('options', [])}
        if not final_ids or any(answer_id not in available for answer_id in final_ids):
            raise ValueError(f"Invalid final answer option for {question['id']}")
        if not result.get('explanation', '').strip():
            raise ValueError(f"Accepted question has no explanation: {question['id']}")
        if not result.get('sources'):
            raise ValueError(f"Accepted question has no research sources: {question['id']}")
    elif final_ids:
        raise ValueError(f"Unresolved question must not expose a final answer: {question['id']}")

    verification = question.setdefault('verification', {})
    verification.update({
        'status': status,
        'finalAnswerOptionIds': final_ids,
        'confidence': result['confidence'],
        'reason': result['reason'],
        'sources': result.get('sources', []),
    })
    if 'originalAnswerOptionIds' in result:
        verification['originalAnswerOptionIds'] = result['originalAnswerOptionIds']
    if result.get('visualAnswerEvidence'):
        verification['visualAnswerEvidence'] = result['visualAnswerEvidence']
    question['correctOptionId'] = final_ids[0] if len(final_ids) == 1 else None
    question['correctOptionIds'] = final_ids
    question['explanation'] = result.get('explanation')
    question['optionExplanations'] = result.get('optionExplanations')
    question['explanationStatus'] = result.get('explanationStatus', 'complete' if status in ACCEPTED else 'pending')
    question['contentReview'] = {
        'status': 'source_visual_reviewed' if result.get('structureReviewed') else 'not_needed',
        'evidence': result.get('sourceVisualEvidence', []),
        'edits': result.get('contentEdits', []),
    }
    reasons = question.get('reviewReasons', [])
    if result.get('structureReviewed'):
        reasons = [r for r in reasons if r not in REMOVE_REASONS_AFTER_SOURCE_REVIEW]
    if result.get('sources') or status in ACCEPTED:
        # A researched item can remain ambiguous or need manual review; those
        # outcomes should retain substantive review reasons, not stale labels
        # saying no independent research has been done yet.
        reasons = [r for r in reasons if r not in REMOVE_REASONS_AFTER_RESEARCH]
    if status in ACCEPTED:
        reasons = [r for r in reasons if r != 'source_occurrences_disagree_on_answer']
    if status == 'ambiguous' and 'external_evidence_does_not_establish_unique_answer' not in reasons:
        reasons.append('external_evidence_does_not_establish_unique_answer')
    question['reviewReasons'] = reasons
    if result.get('quarantine'):
        question['quarantined'] = True
        question['quarantineReason'] = result.get('quarantineReason', result['reason'])
    else:
        question.pop('quarantined', None)
        question.pop('quarantineReason', None)


def count_explanations(questions: list[dict[str, Any]]) -> Counter[str]:
    return Counter(q.get('explanationStatus', 'pending') for q in questions)


def validate_and_report(all_banks: dict[str, dict[str, Any]], all_results: dict[str, dict[str, Any]], source_occurrences: int) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    ids: set[str] = set()
    bank_files = 0
    for sid, bank in all_banks.items():
        bank_files += 1
        questions = bank.get('questions', [])
        if bank.get('metadata', {}).get('totalQuestions') != len(questions):
            errors.append({'subjectId': sid, 'error': 'Candidate bank question count mismatch.'})
        if bank.get('examStage') != 'cmce' or bank.get('schemaVersion') != '2.0':
            errors.append({'subjectId': sid, 'error': 'Candidate bank stage or schema version mismatch.'})
        valid_subtopics = {x['id'] for x in bank.get('subtopics', [])}
        valid_topics = {(x['id'], t['id']) for x in bank.get('subtopics', []) for t in x.get('topics', [])}
        for q in questions:
            qid = q['id']
            if qid in ids:
                errors.append({'questionId': qid, 'error': 'Duplicate ID in candidate banks.'})
            ids.add(qid)
            if q.get('subjectId') != sid or q.get('subtopicId') not in valid_subtopics or (q.get('subtopicId'), q.get('topicId')) not in valid_topics:
                errors.append({'questionId': qid, 'error': 'Subject or topic assignment is invalid.'})
            if not q.get('source', {}).get('files'):
                errors.append({'questionId': qid, 'error': 'Source provenance is missing.'})
            option_ids = [o.get('id') for o in q.get('options', []) if isinstance(o, dict)]
            if len(option_ids) != len(q.get('options', [])) or len(option_ids) != len(set(option_ids)):
                errors.append({'questionId': qid, 'error': 'Malformed options or duplicate option IDs.'})
            if any(not o.get('text') for o in q.get('options', []) if isinstance(o, dict)):
                warnings.append({'questionId': qid, 'warning': 'Blank option text is retained for manual review.'})
            status = q.get('verification', {}).get('status')
            if not status:
                errors.append({'questionId': qid, 'error': 'Verification status is missing.'})
            if status in ACCEPTED:
                if q.get('correctOptionId') not in set(option_ids) or not q.get('explanation') or not q.get('verification', {}).get('sources'):
                    errors.append({'questionId': qid, 'error': 'Accepted question lacks a valid answer, explanation, or evidence.'})
            elif q.get('correctOptionId') is not None or q.get('correctOptionIds'):
                errors.append({'questionId': qid, 'error': 'Unresolved answer exposed as final.'})

    for sid, bank in all_banks.items():
        verified_path = OUT / 'verified-quiz' / 'cmce' / f'{sid}.json'
        review_path = OUT / 'review' / 'cmce' / f'{sid}.json'
        verified = load(verified_path)
        review = load(review_path)
        for kind, data in [('verified', verified), ('review', review)]:
            if data.get('metadata', {}).get('totalQuestions') != len(data.get('questions', [])):
                errors.append({'subjectId': sid, 'collection': kind, 'error': 'Question count metadata mismatch.'})
        if any(q.get('verification', {}).get('status') not in ACCEPTED for q in verified.get('questions', [])):
            errors.append({'subjectId': sid, 'collection': 'verified', 'error': 'Unverified question is present.'})
        if any(q.get('verification', {}).get('status') in ACCEPTED for q in review.get('questions', [])):
            errors.append({'subjectId': sid, 'collection': 'review', 'error': 'Accepted question is duplicated in review.'})
    report = {
        'valid': not errors,
        'sourceOccurrences': source_occurrences,
        'canonicalRecordsValidated': len(ids),
        'consolidatedBankFilesValidated': bank_files,
        'verifiedQuestions': sum(r['status'] in ACCEPTED for r in all_results.values()),
        'structuralReviewWarnings': len(warnings),
        'warnings': warnings,
        'errors': errors,
    }
    atomic_json(REPORTS / 'validation-report.json', report)
    return report


def main() -> int:
    data = load(RESULTS_PATH)
    results_list = data.get('items', [])
    current_batch_id = data.get('batchId', 'unspecified-batch')
    for item in results_list:
        item.setdefault('batchId', current_batch_id)
    results = {item['questionId']: item for item in results_list}
    if len(results) != len(results_list):
        raise SystemExit('Duplicate questionId entries in research-results.json.')
    manifest = load(OUT / 'manifest.json')
    source_occurrences = manifest['sourceQuestionOccurrenceCount']

    banks: dict[str, dict[str, Any]] = {}
    found: set[str] = set()
    for path in sorted((OUT / 'cmce').glob('*.json')):
        bank = load(path)
        sid = bank['subject']['id']
        for question in bank['questions']:
            if question['id'] in results:
                apply_item(question, results[question['id']])
                found.add(question['id'])
        questions = bank['questions']
        status_counts = Counter(q['verification']['status'] for q in questions)
        verified = [q for q in questions if q['verification']['status'] in ACCEPTED]
        bank['metadata'].update({
            'totalQuestions': len(questions),
            'verifiedQuestions': len(verified),
            'correctedQuestions': status_counts['corrected'],
            'reviewRequiredQuestions': len(questions) - len(verified),
            'answerStatusCounts': dict(status_counts),
            'explanationsCompleted': sum(q.get('explanationStatus') == 'complete' for q in questions),
            'explanationsProvisional': sum(q.get('explanationStatus') == 'provisional' for q in questions),
            'activationStatus': 'staged_research_in_progress_not_published' if verified else 'staged_unverified',
            'description': 'Research-progress staging bank. Only questions with independent evidence appear in the verified quiz collection; this candidate bank is not loaded by the active website.',
        })
        atomic_json(path, bank)
        banks[sid] = bank
        verified_bank = {
            **bank,
            'metadata': {**bank['metadata'], 'description': 'Questions independently verified for the research batch so far.', 'totalQuestions': len(verified), 'verifiedQuestions': len(verified), 'correctedQuestions': status_counts['corrected'], 'reviewRequiredQuestions': 0, 'activationStatus': 'staged_not_published'},
            'questions': verified,
        }
        atomic_json(OUT / 'verified-quiz' / 'cmce' / f'{sid}.json', verified_bank)
        review_questions = [q for q in questions if q['verification']['status'] not in ACCEPTED]
        atomic_json(OUT / 'review' / 'cmce' / f'{sid}.json', {
            'schemaVersion': '2.0', 'examStage': 'cmce', 'subject': bank['subject'],
            'metadata': {'totalQuestions': len(review_questions), 'status': 'unresolved, ambiguous, quarantined, or awaiting research'},
            'questions': review_questions,
        })
        quarantined = [q for q in questions if q.get('quarantined')]
        atomic_json(OUT / 'review' / 'quarantine' / 'cmce' / f'{sid}.json', {
            'schemaVersion': '2.0', 'examStage': 'cmce', 'subject': bank['subject'],
            'metadata': {'totalQuestions': len(quarantined)}, 'questions': quarantined,
        })

    unknown = sorted(set(results) - found)
    if unknown:
        raise SystemExit(f'Research results reference unknown question IDs: {unknown[:10]}')

    flat = [q for bank in banks.values() for q in bank['questions']]
    status_counts = Counter(q['verification']['status'] for q in flat)
    explanation_counts = count_explanations(flat)
    accepted_count = sum(status_counts[x] for x in ACCEPTED)
    processed_count = len(results)
    completed_explanations = sum(q.get('explanationStatus') == 'complete' for q in flat)
    provisional_explanations = sum(q.get('explanationStatus') == 'provisional' for q in flat)
    corrected_ids = {qid for qid, result in results.items() if result['status'] == 'corrected'}
    quarantined_ids = {qid for qid, result in results.items() if result.get('quarantine')}

    batch_map: dict[str, list[str]] = {}
    for item in results_list:
        batch_map.setdefault(item['batchId'], []).append(item['questionId'])
    saved_batches = {b.get('batchId'): b for b in data.get('batches', [])}
    for batch_id, question_ids in batch_map.items():
        saved_batches[batch_id] = {
            'batchId': batch_id,
            'questionIds': sorted(question_ids),
            'completedAt': data.get('generatedAt') if batch_id == current_batch_id else saved_batches.get(batch_id, {}).get('completedAt'),
            'status': 'saved_and_applied',
        }
    data['batches'] = [saved_batches[k] for k in sorted(saved_batches)]
    data['items'] = results_list
    atomic_json(RESULTS_PATH, data)

    progress = {
        'schemaVersion': '1.0',
        'updatedAt': datetime.now(timezone.utc).isoformat(),
        'totalCandidateQuestions': len(flat),
        'sourceQuestionOccurrences': source_occurrences,
        'researchBatchCount': len(batch_map),
        'processedQuestionCount': processed_count,
        'verifiedUnchangedCount': status_counts['verified_correct'],
        'correctedAndVerifiedCount': status_counts['corrected'],
        'ambiguousCount': status_counts['ambiguous'],
        'unresolvedCount': status_counts['unresolved'],
        'manualReviewCount': status_counts['needs_manual_review'],
        'outdatedContextCount': status_counts['outdated_context'],
        'verifiedOrCorrectedCount': accepted_count,
        'stillNotVerifiedCount': len(flat) - accepted_count,
        'explanationsCompleted': completed_explanations,
        'explanationsProvisional': provisional_explanations,
        'explanationsPending': len(flat) - completed_explanations - provisional_explanations,
        'quarantinedCount': len(quarantined_ids),
        'statusCounts': dict(status_counts),
        'explanationStatusCounts': dict(explanation_counts),
        'batches': [{**saved_batches[k], 'researchResultsFile': 'reports/research-results.json'} for k in sorted(saved_batches)],
        'resumeInstructions': 'Append new per-question results to reports/research-results.json using stable question IDs, then run python3 /home/mayur/Music/AntigravityCOSA/scripts/apply_itiss_research_progress.py. Do not regenerate the base consolidation unless needed; if it is regenerated, reapply this overlay afterward.',
    }
    atomic_json(PROGRESS_PATH, progress)

    corrections = []
    content_corrections = []
    for qid, result in results.items():
        if result['status'] == 'corrected':
            corrections.append({k: result.get(k) for k in ('questionId', 'originalAnswerOptionIds', 'finalAnswerOptionIds', 'reason', 'sources', 'sourceVisualEvidence') if result.get(k) is not None})
        if result.get('contentEdits'):
            content_corrections.append({'questionId': qid, 'edits': result['contentEdits'], 'sourceVisualEvidence': result.get('sourceVisualEvidence', [])})
    atomic_json(REPORTS / 'answer-corrections.json', {'corrections': corrections, 'note': 'Only evidence-supported answer corrections are recorded here.'})
    atomic_json(REPORTS / 'content-corrections.json', {'corrections': content_corrections})
    atomic_json(REPORTS / 'quarantine-report.json', {
        'quarantinedQuestionIds': sorted(quarantined_ids),
        'quarantinedCount': len(quarantined_ids),
        'visuallyReconstructedRecords': [qid for qid, result in results.items() if result.get('structureReviewed') and result.get('contentEdits')],
        'note': 'Malformed records were inspected against source PDF pages. Records reconstructable from the original layout were repaired with an audit trail; only records explicitly marked quarantine are placed in the quarantine collections.',
    })

    unresolved = []
    source_refs = []
    for q in flat:
        source_refs.append({'questionId': q['id'], 'subjectId': q['subjectId'], 'sources': q['source']['files'], 'researchSources': q['verification'].get('sources', [])})
        if q['verification']['status'] not in ACCEPTED:
            unresolved.append({'questionId': q['id'], 'subjectId': q['subjectId'], 'status': q['verification']['status'], 'reviewReasons': q.get('reviewReasons', []), 'originalAnswerOptionIds': q['verification'].get('originalAnswerOptionIds', []), 'explanationStatus': q.get('explanationStatus', 'pending')})
    atomic_json(REPORTS / 'unresolved-questions.json', {'items': unresolved})
    atomic_json(REPORTS / 'source-references.json', {'items': source_refs})

    answer_report = load(REPORTS / 'answer-verification-report.json')
    answer_report.update({
        'externalResearchPerformed': True,
        'questionsExternallyVerified': accepted_count,
        'answersCorrected': status_counts['corrected'],
        'questionsAwaitingExternalVerification': len(flat) - accepted_count,
        'questionsResearchedOrReviewed': processed_count,
        'explanationsCompleted': completed_explanations,
        'explanationsProvisional': provisional_explanations,
        'statusCounts': dict(status_counts),
        'researchBatchCount': len(batch_map),
        'reason': 'Progress is saved by stable question ID in reports/research-results.json; the per-question evidence and conclusion are in each record.',
    })
    atomic_json(REPORTS / 'answer-verification-report.json', answer_report)

    consolidation_report = load(REPORTS / 'consolidation-report.json')
    consolidation_report.update({
        'externallyVerifiedQuestions': accepted_count,
        'answersCorrected': status_counts['corrected'],
        'questionsResearchedOrReviewed': processed_count,
        'questionsAwaitingExternalVerification': len(flat) - accepted_count,
        'verificationStatusCounts': dict(status_counts),
        'explanationsCompleted': completed_explanations,
        'explanationsProvisional': provisional_explanations,
    })
    atomic_json(REPORTS / 'consolidation-report.json', consolidation_report)

    dup = load(REPORTS / 'duplicate-report.json')
    resolved_conflicts = 0
    unresolved_conflicts = 0
    for group in dup.get('exactDuplicateGroups', []):
        qid = group.get('canonicalQuestionId')
        if qid in results:
            result = results[qid]
            group['researchResolution'] = {
                'status': result['status'], 'finalAnswerOptionIds': result.get('finalAnswerOptionIds', []),
                'reason': result['reason'], 'researchSources': result.get('sources', []),
            }
            if group.get('answerConflict'):
                if result['status'] in ACCEPTED:
                    resolved_conflicts += 1
                else:
                    unresolved_conflicts += 1
    dup['resolvedConflictingAnswerGroups'] = resolved_conflicts
    dup['unresolvedConflictingAnswerGroups'] = dup.get('conflictingAnswerGroupCount', 0) - resolved_conflicts
    atomic_json(REPORTS / 'duplicate-report.json', dup)

    manifest['researchStatus'] = {
        'externalQuestionLevelVerification': 'in_progress',
        'processedQuestionCount': processed_count,
        'verifiedUnchangedQuestionCount': status_counts['verified_correct'],
        'correctedQuestionCount': status_counts['corrected'],
        'verifiedOrCorrectedQuestionCount': accepted_count,
        'ambiguousQuestionCount': status_counts['ambiguous'],
        'stillNotVerifiedCount': len(flat) - accepted_count,
        'explanationsCompleted': completed_explanations,
        'explanationsProvisional': provisional_explanations,
        'quarantinedCount': len(quarantined_ids),
        'progressFile': 'reports/research-progress.json',
        'resultsFile': 'reports/research-results.json',
    }
    for subject_entry in manifest.get('subjects', []):
        subject_id = subject_entry.get('moduleId')
        subject_questions = banks.get(subject_id, {}).get('questions', [])
        subject_entry['verifiedQuestionCount'] = sum(q['verification']['status'] in ACCEPTED for q in subject_questions)
        subject_entry['correctedQuestionCount'] = sum(q['verification']['status'] == 'corrected' for q in subject_questions)
        subject_entry['reviewRequiredQuestionCount'] = len(subject_questions) - subject_entry['verifiedQuestionCount']
        subject_entry['status'] = 'staged_research_in_progress'
    manifest['outputFiles'] = sorted(set(manifest.get('outputFiles', []) + [
        'reports/research-results.json', 'reports/research-progress.json',
        'reports/content-corrections.json', 'reports/quarantine-report.json',
        'review/quarantine/cmce/cosa.json', 'review/quarantine/cmce/fundamental-computer-networks.json',
        'review/quarantine/cmce/programming-concepts.json', 'review/quarantine/cmce/it-infrastructure-devops.json',
    ]))
    atomic_json(OUT / 'manifest.json', manifest)

    qa_path = REPORTS / 'quality-assurance-report.md'
    inventory = load(REPORTS / 'input-inventory.json').get('files', [])
    extracted_files = sum(item.get('sourceKind') == 'extracted_pdf_bank' for item in inventory)
    legacy_files = sum(item.get('sourceKind') == 'existing_website_bank' for item in inventory)
    dup_report = load(REPORTS / 'duplicate-report.json')
    qa_lines = [
        '# Quality-assurance report', '',
        '## Inputs and consolidation', '',
        f'- Extracted PDF-bank JSON files: {extracted_files}.',
        f'- Existing website-bank JSON files included as legacy source occurrences: {legacy_files}.',
        f'- Source question occurrences: {source_occurrences:,}. Canonical records: {len(flat):,}.',
        f'- Exact duplicate groups: {len(dup_report.get("exactDuplicateGroups", [])):,}; grouped duplicate occurrences: {consolidation_report["duplicateOccurrencesMergedOrGrouped"]:,}.',
        f'- Source-answer conflict groups: {dup_report.get("conflictingAnswerGroupCount", 0)}; externally resolved: {resolved_conflicts}; still unresolved: {dup_report.get("unresolvedConflictingAnswerGroups", 0)}.',
        '', '## Research and explanations', '',
        f'- Candidate questions researched or reviewed in saved batches: {processed_count:,} of {len(flat):,}.',
        f'- Verified unchanged: {status_counts["verified_correct"]:,}; corrected and verified: {status_counts["corrected"]:,}.',
        f'- Ambiguous: {status_counts["ambiguous"]:,}; still awaiting work: {len(flat) - accepted_count - status_counts["ambiguous"]:,}.',
        f'- Explanations completed for verified or corrected questions: {completed_explanations:,}. Provisional review explanations: {provisional_explanations:,}.',
        f'- Questions not yet eligible for quizzes: {len(flat) - accepted_count:,}.',
        f'- Quarantined: {len(quarantined_ids)}. Visually reconstructed malformed records: {sum(bool(r.get("structureReviewed") and r.get("contentEdits")) for r in results_list)}.',
        '', '## Validation and publication state', '',
        '- Structural validation checks IDs, source provenance, subject/topic membership, answer references, required explanations for accepted questions, and verified/review collection separation.',
        '- The active website runtime and original extracted JSON files remain unchanged.',
        '- These staged banks are not loaded by the active quiz runtime. Continue research before publication.',
        '', '## Resume', '',
        'Append question-level results with stable IDs to `reports/research-results.json`, assign each new item a batch ID, then run `python3 /home/mayur/Music/AntigravityCOSA/scripts/apply_itiss_research_progress.py`.',
    ]
    old_qa = '\n'.join(qa_lines) + '\n'
    batch_items = results_list
    qa_path.write_text(old_qa, encoding='utf-8')

    readme_path = OUT / 'README.md'
    readme_path.write_text(
        '# Consolidated ITISS Companion question-bank staging export\n\n'
        f'Generated from **{source_occurrences:,}** source question occurrences across **{extracted_files + legacy_files}** source JSON files, producing **{len(flat):,}** canonical question records.\n\n'
        'The four banks map to the existing CMCE module IDs. The five CCEE modules currently have no question-bank inputs in the inspected extraction directory.\n\n'
        '## Research status\n\n'
        f'Independent research is in progress: **{accepted_count:,}** answers verified ({status_counts["verified_correct"]:,} unchanged, {status_counts["corrected"]:,} corrected), **{status_counts["ambiguous"]:,}** ambiguous, and **{len(flat) - accepted_count - status_counts["ambiguous"]:,}** still awaiting verification or review. '
        f'Complete explanations: **{completed_explanations:,}**; provisional explanations: **{provisional_explanations:,}**. Only independently supported questions appear in the verified quiz banks.\n\n'
        'Source answer markings remain candidates until independently checked. Original extracted JSON files, existing website banks, and active website runtime are preserved. These staged banks are not published.\n\n'
        '## Resume safely\n\n'
        'Append new per-question results with stable IDs to `reports/research-results.json`, assign a new batch ID, then run `python3 /home/mayur/Music/AntigravityCOSA/scripts/apply_itiss_research_progress.py`. Avoid regenerating the base consolidation: using `--force` resets candidate-bank annotations and requires reapplying this saved research overlay.\n',
        encoding='utf-8',
    )

    validation = validate_and_report(banks, results, source_occurrences)
    print(json.dumps({
        'batchId': data.get('batchId'), 'processed': processed_count,
        'verifiedUnchanged': status_counts['verified_correct'], 'correctedAndVerified': status_counts['corrected'],
        'ambiguous': status_counts['ambiguous'], 'totalNotVerified': len(flat) - accepted_count,
        'explanationsCompleted': completed_explanations, 'explanationsProvisional': provisional_explanations,
        'quarantined': len(quarantined_ids), 'validationPassed': validation['valid'],
        'validationErrors': len(validation['errors']), 'validationWarnings': validation['structuralReviewWarnings'],
    }, ensure_ascii=False, indent=2))
    return 0 if validation['valid'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
