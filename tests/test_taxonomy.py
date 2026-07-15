from pathlib import Path

import pandas as pd
import pytest

from menunorm.taxonomy import (
    assign_categories,
    category_report,
    confusion_matrix,
    label_category_map,
    load_taxonomy,
)

ROOT = Path(__file__).resolve().parent.parent
LEXICON = ROOT / "data/lexicon"


def test_taxonomy_shape_and_shares():
    tax = load_taxonomy(LEXICON)
    # Delivery-app style: between 10 and 20 mutually exclusive categories.
    assert 10 <= len(tax) <= 20
    assert abs(tax["benchmark_share"].sum() - 1.0) < 1e-9
    assert tax["category"].is_unique


def test_every_label_maps_to_a_known_category():
    tax = load_taxonomy(LEXICON)
    labels = pd.read_csv(LEXICON / "canonical_labels.csv")
    known = set(tax["category"])
    assert set(labels["category"]).issubset(known)
    # Every category is populated by at least one label (no dead categories).
    assert set(labels["category"]) == known
    mapping = label_category_map(labels)
    assert len(mapping) == len(labels)


def test_assign_categories_full_coverage_and_fallbacks():
    label_to_cat = {"아메리카노": "카페·디저트", "짜장면": "중식"}
    best = pd.Series(["아메리카노", "짜장면", "아메리카노", "아메리카노"])
    method = pd.Series(["exact", "tfidf", "empty", "empty"])
    store = pd.Series(["카페·디저트", "한식", "중식", "미확인업종"])
    pred, source = assign_categories(best, method, store, label_to_cat, {"카페·디저트", "중식"})
    assert pred.notna().all()
    assert list(source) == ["label", "label", "store", "prior"]
    assert pred[2] == "중식"          # empty name -> store category
    assert pred[3] in {"카페·디저트", "중식"}  # unknown store -> batch prior


def test_category_report_and_confusion():
    gold = pd.Series(["치킨", "치킨", "중식", "피자"])
    pred = pd.Series(["치킨", "중식", "중식", "피자"])
    report = category_report(gold, pred)
    chicken = report.set_index("category").loc["치킨"]
    assert chicken["recall"] == 0.5 and chicken["precision"] == 1.0
    cm = confusion_matrix(gold, pred, ["치킨", "중식", "피자"])
    assert cm.loc["치킨", "치킨"] == pytest.approx(0.5)
    assert cm.loc["피자", "피자"] == pytest.approx(1.0)
