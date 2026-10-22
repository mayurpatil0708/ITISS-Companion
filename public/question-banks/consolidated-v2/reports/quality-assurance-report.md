# Quality-assurance report

## Inputs and consolidation

- Extracted PDF-bank JSON files: 214.
- Existing website-bank JSON files included as legacy source occurrences: 3.
- Source question occurrences: 13,516. Canonical records: 8,208.
- Exact duplicate groups: 1,518; grouped duplicate occurrences: 5,308.
- Source-answer conflict groups: 2; externally resolved: 1; still unresolved: 1.

## Research and explanations (batch 21 checkpoint)

- Candidate questions researched or reviewed in saved batches: 191 of 8,208.
- Verified unchanged: 158; corrected and verified: 11.
- Ambiguous: 15; unresolved or awaiting manual review: 8,024.
- Explanations completed for verified or corrected questions: 169. Provisional review explanations: 22.
- Questions not yet eligible for quizzes: 8,039.
- Quarantined: 1. Visually reconstructed malformed records: 58.

## Validation and publication state

- Independent batch 21 audit parsed 56 staged JSON files and confirmed all 217 source-file hashes are unchanged.
- All 8,208 candidates partition exactly into four CMCE subject banks: 169 verified and 8,039 in review. No CCEE modules without input were fabricated.
- All verified records have a valid answer reference, supporting research sources, and a complete explanation. The 572 detected option-structure warnings remain isolated to review.
- Pipeline and independent validation passed with no errors. The active website runtime and original extracted JSON files remain unchanged; staged banks are not published.

## Resume

Append question-level results with stable IDs to `reports/research-results.json`, assign each new item a batch ID, then run `python3 scripts/apply_itiss_research_progress.py` from the project root or use the absolute path in the handoff README. Resume from the progress manifest; do not regenerate base consolidation.
