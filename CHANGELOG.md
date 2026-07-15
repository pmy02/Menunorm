# Changelog

All notable changes to this project. The git tags `v1.0.0`, `v2.0.0`, and
`v3.0.0` in this repository mark the three stages of the project's evolution
from a manual notebook workflow to a two-level standardization system.

## [3.0.0] — 2026-07-15

**Two-level standardization: 13 delivery-app categories × 136 canonical labels.**

### Added
- **Level-1 category layer** (`src/menunorm/taxonomy.py`): every row is
  assigned to exactly one of 13 delivery-app-style categories with **100 %
  coverage guaranteed** by a fallback chain (best-label's category → store
  prior → batch prior), and the fired branch recorded per row as
  `category_source`.
- **`docs/taxonomy.md`** — taxonomy design document: five design principles,
  the full category table with inclusion criteria, source citations (platform
  documentation, card-payment analysis, consumer surveys), a decision log
  (야식 excluded as time-based; 회 folded into 돈까스·회·일식; 마라탕 under
  중식; single assignment vs. platform multi-tagging), and an honesty note on
  `benchmark_share`.
- **Category evaluation**: `category_accuracy`, `category_coverage`,
  per-category precision/recall/F1 (`category_report.csv`), a row-normalized
  confusion matrix (CSV + heatmap figure), and the graceful-degradation
  metric `category_accuracy_on_unmatched` — on rows where the fine label
  abstains, is the coarse category still right?
- **Share-calibrated benchmark**: categories are sampled by a
  `benchmark_share` informed by published demand statistics (chicken-first at
  0.18, thin Asian tail at 0.01); labels follow a within-category Zipf.
  Generated mix tracks the target within ±0.005.
- **Anti-shortcut design**: `store_category` in the benchmark is
  intentionally noisy (15 % of rows sit in a different store category than
  their item), so category prediction cannot cheat by reading the store
  column; the pipeline classifies from text only.
- 4 new canonical labels for the 아시안 category (쌀국수, 팟타이, 분짜,
  똠얌꿍) → 136 labels total; matching user-dictionary entries.
- `category_distribution` figure (assigned vs. calibrated share) and
  `confusion_matrix` figure; taxonomy test suite (35 tests total).
- `CHANGELOG.md` (this file) and a "What's new in v3" section in both READMEs.

### Changed
- Results are now reported at both levels. Hard track (typos unseen by any
  lexicon): label overall accuracy 98.44 %, **category accuracy 99.72 % at
  100 % coverage**; `category_accuracy_on_unmatched` 85.3 % on 224 abstained
  rows. Standard track: 100 % at both levels (explicitly framed as a
  closed-world regression test).
- `standardized.csv` gains `pred_category` and `category_source` columns;
  `metrics.json` gains the category block.
- Package version 3.0.0.

## [2.0.0] — 2026-06-12

**Rebuild as the `menunorm` package — from hand-edited notebooks to a tested,
reproducible pipeline.**

### Added
- Declarative, ordered rule engine (`rules.py`) with a per-row `rules_fired`
  audit trace — replacing one-regex-at-a-time manual editing saved as
  `ver26.xlsx → ver27.xlsx`.
- **Dual-segmentation score fusion**: MeCab (with an auto-compiled domain
  user dictionary) and a dependency-free surface tokenizer are both scored
  against the canonical lexicon; the per-row max wins. Honest ablation showed
  fusion beating either path alone on the hard track (92.5 / 98.3 / **98.4 %**).
- Span-aware stopword removal (handles MeCab over-segmentation such as
  시그니처 → 시그/니/처) and a pure-unicode jongseong user-dictionary builder
  (drops the `jamo` dependency).
- **Deterministic synthetic benchmark** solving the NDA problem: standard
  track (documented real-world noise modes) and hard track (character-level
  typos not covered by any lexicon). Every reported number became measurable
  and reproducible from a seed.
- Canonicalization with an abstention threshold (`UNMATCHED` instead of
  forced assignments), threshold-sweep analysis, and K-means label discovery
  that turns unmatched names into a review queue of proposals.
- EAN-13 check-digit filter (stage 0), 30 tests, ruff lint, GitHub Actions CI
  (Python 3.10/3.12, both tokenizer backends, end-to-end smoke run).
- English-primary README with Korean mirror (`README.ko.md`); reproducible
  figures replacing slide screenshots.

### Changed
- Original 2023 notebooks preserved unmodified under `notebooks/legacy/`
  (prose comments translated to English, code untouched) as provenance.

## [1.0.0] — 2023-05-19

**Original industry collaboration (2023.02–2023.03).**

- EDA and standardization of ~20M raw product records into ~1K canonical
  labels (~95 % on a hand-audited sample) for a digital-platform company.
  Data under NDA.
- Workflow: barcode check-digit filtering → deduplication → K-means EDA that
  revealed the long-tail problem → manual regex normalization in notebooks →
  MeCab POS tagging with a hand-filled user-dictionary spreadsheet →
  stopword removal.
- This state is preserved at the git tag `v1.0.0` and, in later versions,
  under `notebooks/legacy/`.
