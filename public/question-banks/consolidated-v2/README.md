# Consolidated ITISS Companion question-bank staging export

Generated from **13,516** source question occurrences across **217** source JSON files, producing **8,208** canonical question records.

The four banks map to the existing CMCE module IDs. The five CCEE modules currently have no question-bank inputs in the inspected extraction directory.

## Research status at batch 21

The saved research overlay contains **169** answers verified (158 unchanged, 11 corrected), **15** ambiguous, and **8,039** candidates still outside the verified quiz banks. Complete explanations: **169**; provisional review explanations: **22**. Only independently supported questions appear in verified quiz banks.

## Latest validation

The independent batch 21 audit parsed 56 staged JSON files, confirmed a complete 8,208-record partition, and checked all 217 original source JSON hashes unchanged. The audit passed without errors. Structural warnings remain in review. The active website runtime is unchanged; these staged banks are not published. See `reports/accelerated-validation-batch-021.json` and `reports/quality-assurance-report.md`.

## Resume safely

Append per-question results with stable IDs to `reports/research-results.json`, assign a new batch ID, and run the included `scripts/apply_itiss_research_progress.py`. Do not regenerate base consolidation; using `--force` resets candidate-bank annotations and requires reapplying the saved overlay. See the handoff README in the parent archive for portability details.
