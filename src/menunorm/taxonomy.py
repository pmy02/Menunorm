"""Delivery-app category taxonomy (level 1 of the two-level standardization).

Real Korean delivery apps organize stores into 10-20 browsable food
categories (치킨, 한식, 중식, ...). This module implements that layer on top
of the fine-grained canonical labels (level 2), with one deliberate
difference: apps let a store appear in up to three categories, whereas
analytics needs a *partition* - so every row is assigned to **exactly one**
category. The taxonomy design and its sources are documented in
``docs/taxonomy.md``.

Assignment guarantees 100 % coverage through a fallback chain:

1. The best-matching canonical label's category - used even when the label
   matcher *abstained* (category is a coarser decision than label, so the
   argmax label's category is still informative; the pipeline measures this
   claim separately as ``category_accuracy_on_unmatched``).
2. If the name is empty after normalization, the store's own (noisy)
   category when it is a known food category.
3. Otherwise, the most frequent category in the batch (global prior).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd


def load_taxonomy(lexicon_dir: str | Path) -> pd.DataFrame:
    """Load ``categories.csv`` (columns: category, category_en, benchmark_share)."""
    frame = pd.read_csv(Path(lexicon_dir) / "categories.csv")
    if not np.isclose(frame["benchmark_share"].sum(), 1.0, atol=1e-6):
        raise ValueError("benchmark_share must sum to 1.0")
    return frame


def label_category_map(labels_df: pd.DataFrame) -> dict[str, str]:
    """Build the canonical-label -> category lookup from ``canonical_labels.csv``."""
    return dict(zip(labels_df["label"], labels_df["category"]))


def assign_categories(
    best_labels: pd.Series,
    methods: pd.Series,
    store_categories: pd.Series,
    label_to_cat: dict[str, str],
    known_categories: set[str],
) -> tuple[pd.Series, pd.Series]:
    """Assign exactly one category per row (full coverage).

    Args:
        best_labels: Argmax canonical label per row (pre-threshold).
        methods: Match method per row (``empty`` marks unusable names).
        store_categories: The store's own category column (noisy prior).
        label_to_cat: Canonical label -> category lookup.
        known_categories: Valid taxonomy categories.

    Returns:
        ``(pred_category, category_source)`` where ``category_source`` is one
        of ``label`` | ``store`` | ``prior`` for auditability.
    """
    pred = best_labels.map(label_to_cat)
    source = pd.Series("label", index=pred.index)

    empty = methods.to_numpy() == "empty"
    store_ok = store_categories.isin(known_categories).to_numpy()
    use_store = empty & store_ok
    pred = pred.where(~use_store, store_categories)
    source = source.where(~use_store, "store")

    still_missing = pred.isna().to_numpy() | (empty & ~store_ok)
    if still_missing.any():
        valid = pred[~still_missing]
        prior = valid.mode().iloc[0] if len(valid) else next(iter(known_categories))
        pred = pred.where(~still_missing, prior)
        source = source.where(~still_missing, "prior")
    return pred, source


def category_report(gold: pd.Series, pred: pd.Series) -> pd.DataFrame:
    """Per-category precision / recall / F1 / support."""
    cats = sorted(set(gold.unique()) | set(pred.unique()))
    rows = []
    for cat in cats:
        tp = int(((gold == cat) & (pred == cat)).sum())
        fp = int(((gold != cat) & (pred == cat)).sum())
        fn = int(((gold == cat) & (pred != cat)).sum())
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        rows.append(
            {
                "category": cat,
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1": round(f1, 4),
                "support": int((gold == cat).sum()),
            }
        )
    return pd.DataFrame(rows).sort_values("support", ascending=False).reset_index(drop=True)


def confusion_matrix(gold: pd.Series, pred: pd.Series, order: list[str]) -> pd.DataFrame:
    """Row-normalized confusion matrix (gold rows x predicted columns)."""
    counts = pd.crosstab(gold, pred).reindex(index=order, columns=order, fill_value=0)
    return counts.div(counts.sum(axis=1).replace(0, 1), axis=0)
