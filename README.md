**English** | [한국어](README.ko.md)

# MenuNorm — Korean Product-Name Standardization

[![CI](https://github.com/pmy02/Data_Standardization/actions/workflows/ci.yml/badge.svg)](https://github.com/pmy02/Data_Standardization/actions)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](pyproject.toml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A reproducible pipeline that standardizes noisy Korean product names at
**two levels**: every row is mapped into one of **13 delivery-app categories**
(치킨, 한식, 중식, … — with **100 % coverage guaranteed**) and, where the
evidence supports it, one of **136 fine-grained canonical labels** — with
rule tracing, abstention, automatic label discovery, and a fully measurable
open benchmark.

```
★양념 치킨 라지★         →  양념치킨      | 치킨            (1.00)
[강남점] ♥하와이안피자♥   →  하와이안피자   | 피자            (1.00)
불고고기 버거             →  불고기버거    | 버거·패스트푸드   (0.89, fuzzy)
♥부찌대개세트♥           →  UNMATCHED    | 찜·탕·찌개       (label abstains — category still holds)
```

> **What's new in v3.** v2 standardized names to fine-grained labels only; v3
> adds the **level-1 category layer**: every row lands in one of 13
> research-grounded delivery-app categories with **100 % coverage** (fallback
> chain, per-row `category_source` audit), the benchmark's class mix is
> calibrated to published demand statistics, and the category level is fully
> evaluated — per-category P/R/F1, confusion matrix, and the
> graceful-degradation metric `category_accuracy_on_unmatched`.
> Full version history: **[CHANGELOG.md](CHANGELOG.md)**.

## Overview

This project began as a 2023 industry collaboration with a digital-platform
company: standardizing **~20M raw product records into ~1K canonical labels**
so that downstream search and analytics could work on clean categories. The
engagement data is under NDA, and the original implementation was a set of
ad-hoc notebooks in which normalization rules were edited by hand, one regex
at a time.

This repository (v3) is the **systematized rebuild** of that work:

- **two-level standardization** — level 1 assigns every row to one of 13
  delivery-app categories whose design is grounded in platform taxonomies and
  published demand statistics ([`docs/taxonomy.md`](docs/taxonomy.md)); level 2
  canonicalizes to 136 fine-grained labels with an abstention threshold;
- the method is a configurable, tested Python package (`menunorm`) instead of
  notebooks — every rule lives in version-controlled configuration and emits
  an audit trace;
- the NDA problem is solved with a **deterministic synthetic benchmark** that
  reproduces the documented noise modes of the real data — every number in
  this README is *measured*, on data anyone can regenerate with one command;
- the original notebooks are preserved unmodified (comments translated) under
  [`notebooks/legacy/`](notebooks/legacy) for provenance.

## Method

```mermaid
flowchart LR
    A[raw names] --> B["stage 0<br/>target filter<br/>(category + EAN-13)"]
    B --> C["stage 1<br/>rule normalization<br/>(ordered, traceable)"]
    C --> D1["morphological path<br/>MeCab + user dict"]
    C --> D2["surface path<br/>character chunks"]
    D1 --> E["span-aware<br/>stopword removal"]
    D2 --> E
    E --> F["stage 3<br/>char n-gram TF-IDF<br/>score fusion"]
    F -->|"score ≥ τ"| G["canonical label<br/>(level 2, 136)"]
    F -->|"score < τ"| H[UNMATCHED]
    G --> J["delivery-app category<br/>(level 1, 13 — 100 % coverage)"]
    H --> J
    H --> I["K-means discovery →<br/>label proposals"]
```

| Stage | What it does | Replaces (2023 version) |
|---|---|---|
| **0 — Target filter** | Drops non-food stores and rows with a *valid* EAN-13 check digit (packaged retail goods). | Same idea, now unit-tested. |
| **1 — Rule normalization** | Ordered, declarative rules (glossary translation, bracket/decoration removal, option patterns, spelling variants) with a per-row `rules_fired` trace. | Hand-edited regexes saved as `ver26.xlsx → ver27.xlsx`. |
| **2 — Dual segmentation** | MeCab with a **compiled domain user dictionary** *and* a dependency-free surface segmentation; stopwords are removed **span-aware**, so over-segmented stopwords (시그니처 → 시그/니/처) still match. | Okt nouns + manual dictionary spreadsheet. |
| **3 — Canonicalization + fusion (level 2)** | Both segmentations are scored against the canonical lexicon (exact + char 2–4-gram TF-IDF cosine); the higher-scoring candidate wins. Scores below the threshold **abstain** (`UNMATCHED`) instead of forcing a label. | One-by-one manual mapping. |
| **4 — Category assignment (level 1)** | Every surviving row gets exactly one of 13 delivery-app categories via a fallback chain (argmax label's category → store prior → batch prior), with the branch recorded per row. **Coverage is 100 % by construction** — and measured. | Did not exist. |
| **5 — Evaluation + discovery** | Gold metrics at both levels, per-path ablation, category confusion matrix, threshold sweep; unmatched names are clustered (K-means) and each cluster's most frequent member is proposed as a *new* label for review. | K-means used once as EDA. |

**Why fusion?** Morphological analysis is brittle under spacing noise (MeCab
loses characters on `돼 지국밥` and tags `쫄면` as a verb form), while pure
surface matching is weaker on glued compounds. Scoring both candidates and
taking the per-row max keeps the strengths of each — and the ablation below
quantifies it instead of asserting it.

## Category taxonomy

The 13 categories mirror the browsing rail of Korean delivery apps and are
**food-type only**: platform categories that are time- or function-based
(야식, 포장, 1인분) are excluded, following Yogiyo's own partner
documentation that defines 야식 purely by store operating hours. Apps let a
store surface in up to three categories; analytics needs a partition, so
MenuNorm assigns **exactly one** category per row. The benchmark's class mix
is calibrated to a `benchmark_share` informed by published demand statistics
(chicken first at ~0.18, thin Asian tail at ~0.01).

Full design rationale, the category table, all sources, and the decision log
(why 회 lives with 일식, why 마라탕 is 중식, …):
**[`docs/taxonomy.md`](docs/taxonomy.md)**.

## Results

All numbers are measured on the open synthetic benchmark
(20,000 rows, seed 42, single command to reproduce — see
[Reproducibility](#reproducibility)). The benchmark has two tracks:

- **standard** — noise drawn from the documented real-world modes
  (decorations, options, spacing, code-switching, spelling variants,
  branch prefixes, retail/non-food contamination);
- **hard** — standard noise **plus character-level typos** (deletion,
  transposition, duplication) that are deliberately *not covered by any
  lexicon*, probing fuzzy-matching robustness rather than lookup coverage.

| Track | Level 2: label overall acc. | Level 1: category acc. | Category coverage | Unique raw → labels | Filter leakage |
|---|---:|---:|---:|---|---:|
| standard | **100.0 %** | **100.0 %** | 100 % | 6,912 → 136 | 0 rows |
| hard | **98.44 %** | **99.72 %** | 100 % | 7,981 → 136 | 0 rows |

> **Read the standard track honestly:** the generator and the lexicons share
> the same domain vocabulary, so a perfect score there means
> *"the pipeline fully inverts every known noise mode"* — a closed-world
> regression test, not a real-world claim. The hard track exists precisely
> because of that: its typos are unseen by every lexicon.

**Label-level detail (hard track):** coverage 98.75 %, matched accuracy
99.68 %. **Ablation** — fusion beats either segmentation alone:

| Path | Coverage | Matched acc. | Overall acc. |
|---|---:|---:|---:|
| morphological only (MeCab + user dict) | 93.14 % | 99.30 % | 92.48 % |
| surface only | 98.58 % | 99.76 % | 98.34 % |
| **fused (max score)** | **98.75 %** | 99.68 % | **98.44 %** |

**Graceful degradation across levels.** On the 224 hard-track rows where the
label matcher *abstained*, the category was still correct **85.3 %** of the
time — the coarse decision survives fuzzy evidence that the fine decision
rightly refuses (`♥부찌대개세트♥` → label UNMATCHED, category 찜·탕·찌개).
This is measured on every run as `category_accuracy_on_unmatched`.

**User dictionary effect** (real MeCab output; stock dictionary
over-segments food loanwords):

| Term | Stock mecab-ko-dic | + compiled user dict |
|---|---|---|
| 아인슈페너 | `아인 / 슈페너` | `아인슈페너` |
| 크로플 | `크로 / 플` | `크로플` |
| 마라샹궈 | `마라 / 샹 / 궈` | `마라샹궈` |
| 알리오올리오 | `알 / 리오 / 올리 / 오` | `알리오올리오` |

**Category mix & confusion** — the assigned mix tracks the calibrated target
(max deviation 0.005), and the confusion matrix stays near-diagonal on the
hard track:

![Category distribution](docs/figures/category_distribution.png)

![Category confusion](docs/figures/confusion_matrix.png)

**Long-tail collapse** — the core value of standardization. 7,981 raw
variants collapse onto 136 canonical labels:

![Long-tail collapse](docs/figures/long_tail.png)

**Abstention trade-off** — the threshold is a dial between coverage and
precision; the operating point (τ = 0.45) is chosen from this sweep, which
the pipeline re-emits on every run:

![Threshold sweep](docs/figures/threshold_sweep.png)

![Pipeline funnel](docs/figures/funnel.png)

The full 20k-row run takes **≈ 1 second** end to end (single core,
Python 3.12).

### Original engagement (2023, NDA)

For context: the original collaboration reported standardizing **~20M raw
records into ~1K labels at ~95 % accuracy** (hand-audited sample). Those
numbers describe the 2023 project on proprietary data and are **not
reproducible from this repository**; everything else in this README is
measured on the open benchmark above.

### Known limitations

- The benchmark is synthetic; absolute numbers are optimistic relative to
  open-world production data (unknown typo classes, OCR noise, new menu
  trends). The hard track narrows but does not close this gap.
- `benchmark_share` is a design choice informed by published statistics, not
  a market measurement — see the honesty note in
  [`docs/taxonomy.md`](docs/taxonomy.md).
- Code-switching recovery depends on the offline glossary; unseen
  romanizations (e.g. `kimchi jjigae`) correctly fall through to
  `UNMATCHED` rather than being guessed (their category is still assigned).
- The canonical inventory (136 labels) is small; scaling experiments
  (1K+ labels, ANN search) are on the roadmap.

## Installation

```bash
git clone https://github.com/pmy02/Data_Standardization.git
cd Data_Standardization
pip install -e ".[mecab,figures,dev]"
```

`python-mecab-ko` ships Linux/macOS wheels. Without it the pipeline
automatically falls back to the surface tokenizer (`tokenizer: simple`) and
stays fully runnable — CI tests both paths.

## Usage

```bash
# 1) generate the open benchmark (deterministic, ~1.5 MB)
python scripts/generate_synthetic.py --n 20000 --seed 42
python scripts/generate_synthetic.py --n 20000 --seed 42 --hard \
    --out data/synthetic/menu_synthetic_hard.csv

# 2) run the pipeline
python scripts/run_pipeline.py --config configs/default.yaml
python scripts/run_pipeline.py --config configs/default.yaml \
    --input data/synthetic/menu_synthetic_hard.csv --outdir results/hard

# 3) figures (README plots)
python scripts/make_figures.py --results results/hard --out docs/figures
```

Outputs land in the run directory: `standardized.csv` (per-row score, match
path, **category + `category_source`**, and `rules_fired` audit trace),
`metrics.json` (both levels + ablation), `category_report.csv` (per-category
precision/recall/F1), `confusion_matrix.csv`, `threshold_sweep.csv`,
`label_proposals.csv`, `rule_trace_sample.csv`.

Library use:

```python
from menunorm import Canonicalizer, RuleSet

rules = RuleSet(translation_map={"americano": "아메리카노"})
matcher = Canonicalizer(["아메리카노", "카페라떼", "김치찌개"])

clean = rules.apply("★ICE Americano 세트★")    # -> "아메리카노"
matcher.match([clean])                          # -> 아메리카노, score 1.0
```

To run on your own data, point `configs/default.yaml` at your CSV and map
your column names under `columns:` (set `gold:` / `gold_category:` only if
you have labels).

## Project structure

```
├── src/menunorm/          # the package
│   ├── rules.py           #   stage 1: declarative, traceable normalization
│   ├── tokenize.py        #   stage 2: MeCab/simple + span-aware stopwords
│   ├── dictionary.py      #   MeCab user-dictionary builder (unicode jongseong)
│   ├── canonicalize.py    #   stage 3: exact + char n-gram TF-IDF + abstention
│   ├── taxonomy.py        #   stage 4: 13-category layer, full-coverage fallback chain
│   ├── cluster.py         #   stage 5: K-means label discovery
│   ├── evaluate.py        #   metrics + threshold sweep
│   ├── synthetic.py       #   benchmark generator (share-calibrated, standard/hard)
│   ├── barcode.py         #   EAN-13 validation (stage 0)
│   └── pipeline.py        #   orchestration + artifacts
├── CHANGELOG.md          # version history: v1 → v2 → v3
├── configs/default.yaml   # every knob in one place
├── data/lexicon/          # canonical labels, categories, stopwords, variant/translation maps
├── data/sample/           # 200-row committed sample of the benchmark
├── docs/taxonomy.md       # category design: principles, sources, decision log
├── scripts/               # generate_synthetic / run_pipeline / make_figures
├── tests/                 # 35 tests incl. end-to-end pipeline regression
└── notebooks/legacy/      # original 2023 notebooks (provenance)
```

## Reproducibility

Everything in this README regenerates with:

```bash
pip install -e ".[mecab,figures,dev]" && pytest -q
python scripts/generate_synthetic.py --n 20000 --seed 42
python scripts/run_pipeline.py --config configs/default.yaml
```

Deterministic given the seed. Verified with Python 3.12, pandas 3.0.2,
scikit-learn 1.8.0; CI exercises Python 3.10 and 3.12, both tokenizer
backends, lint, the unit suite, and a 1k-row end-to-end smoke run.

## Roadmap

- [ ] Scale the canonical inventory to 1K+ labels with ANN (FAISS) matching
- [ ] Embedding-based matcher (Korean SBERT) as a third fusion candidate,
      with the same ablation protocol
- [ ] Active-learning loop: route low-margin matches and label proposals
      into a category-aware review queue
- [ ] Hangul jamo-level n-grams for stronger typo robustness on the hard track
- [ ] 도시락·죽 category once the label inventory covers it

## Citation

```bibtex
@software{park2023menunorm,
  author  = {Park, Minyoung},
  title   = {MenuNorm: Korean Product-Name Standardization},
  year    = {2023},
  url     = {https://github.com/pmy02/Data_Standardization}
}
```

## License

MIT — see [LICENSE](LICENSE).

Maintained by [@pmy02](https://github.com/pmy02). Issues and PRs welcome.
