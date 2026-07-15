# Category taxonomy design

MenuNorm standardizes at **two levels**: level 2 assigns each product name to
one of 136 fine-grained canonical labels, and level 1 — this document — maps
every row into exactly one of **13 delivery-app-style categories**. This is
the browsing granularity Korean consumers actually use (치킨, 한식, 중식, …),
and the level at which order-share statistics are published.

## Design principles

1. **Platform-aligned.** Category names and boundaries follow the taxonomies
   of major Korean delivery platforms (배달의민족, 요기요, 쿠팡이츠), so the
   output is directly comparable to industry reporting.
2. **Food-type only.** Platforms mix food categories with *functional* ones —
   Yogiyo's partner documentation defines 야식 (late-night) purely by store
   operating hours (order cutoff past 00:30 on most business days) and lists
   포장/1인분 as function categories [S1]. Time- and function-based groupings
   are excluded here because they are not properties of a product name.
3. **A partition, not tags.** Platforms let one store surface in up to three
   categories [S1]. Analytics needs mutually exclusive, exhaustive classes,
   so every row is assigned to **exactly one** category and coverage is
   guaranteed to be 100 %.
4. **10–20 classes.** Matches the visible category rail of the major apps and
   keeps per-class support meaningful.
5. **Share-calibrated benchmark.** The synthetic benchmark samples categories
   by a `benchmark_share` weight informed by published demand statistics
   [S2–S4], so the class balance (chicken-heavy, long everything-else tail)
   resembles real order books rather than a uniform toy distribution.

## The 13 categories

| # | Category | English | Inclusion criteria | Example labels | Benchmark share |
|---|---|---|---|---|---:|
| 1 | 치킨 | Chicken | Fried/seasoned chicken and its sides | 후라이드치킨, 양념치킨, 치즈볼 | 0.18 |
| 2 | 한식 | Korean | Korean staples not covered by 3, 10, 11 | 비빔밥, 제육볶음, 돼지국밥, 물냉면 | 0.10 |
| 3 | 중식 | Chinese | Korean-Chinese and Sichuan-style dishes | 짜장면, 짬뽕, 마라탕, 탕수육 | 0.10 |
| 4 | 카페·디저트 | Cafe & Dessert | Beverages, bakery, and desserts | 아메리카노, 크로플, 치즈케이크 | 0.10 |
| 5 | 분식 | Bunsik (Street Food) | Korean snack-bar and street food | 떡볶이, 김밥, 순대, 붕어빵 | 0.09 |
| 6 | 찜·탕·찌개 | Stew & Soup | Stews, soups, braised dishes | 김치찌개, 갈비탕, 찜닭, 해물찜 | 0.08 |
| 7 | 돈까스·회·일식 | Japanese & Sashimi | Japanese dishes incl. raw fish | 돈가스, 모둠초밥, 돈코츠라멘, 물회 | 0.08 |
| 8 | 피자 | Pizza | Pizza | 페퍼로니피자, 고르곤졸라피자 | 0.07 |
| 9 | 버거·패스트푸드 | Burgers & Fast Food | Burgers, fries, quick western snacks | 치즈버거, 감자튀김, 핫도그, 토스트 | 0.07 |
| 10 | 족발·보쌈 | Jokbal & Bossam | Braised pork trotters / wraps | 족발, 보쌈 | 0.05 |
| 11 | 고기·구이 | BBQ & Grilled | Grilled meats and offal | 삼겹살, 닭갈비, 곱창 | 0.04 |
| 12 | 양식 | Western | Pasta, risotto, steak-house dishes | 까르보나라, 리조또, 함박스테이크 | 0.03 |
| 13 | 아시안 | Asian | Southeast-Asian dishes | 쌀국수, 팟타이, 분짜, 똠얌꿍 | 0.01 |

Machine-readable version: [`data/lexicon/categories.csv`](../data/lexicon/categories.csv).
The label→category assignment for all 136 canonical labels lives in
[`data/lexicon/canonical_labels.csv`](../data/lexicon/canonical_labels.csv).

## Sources

| ID | Source | What it grounds |
|---|---|---|
| S1 | Yogiyo partner documentation, “요기요 카테고리 소개” (partner.yogiyo.co.kr) | Platform taxonomy structure; food vs. functional categories; 야식 defined by operating hours; up to 3 categories per store |
| S2 | 하나금융경영연구소, *배달 앱 이용 현황과 메뉴 유형별 수요 특성* (2022; card-payment data) | Chicken as the #1 delivery category; the category vocabulary used in industry analysis (치킨, 족발·보쌈, 피자, 중식, 패스트푸드, 한식) |
| S3 | 엠브레인 트렌드모니터 배달앱 조사 (2019; multiple response) | Ordering frequency ranking: 치킨 85.2 %, 중국음식 60.3 %, 피자 51.1 %, 족발/보쌈 28.5 % |
| S4 | Consumer survey reported Dec 2024 (favorite delivery menu, single response) | 치킨 47.5 %, 고기류(족발·보쌈·삼겹 등) 8.9 %, 한식(국·탕·볶음) 8.5 % |
| S5 | 나무위키 “배달” (secondary, illustrative) | Expansion of deliverable cuisine: 마라탕, Vietnamese 쌀국수, Thai 팟타이, 회/초밥, 삼겹살 — motivates the 아시안 category and 회 coverage |

> **Honesty note on `benchmark_share`.** Published statistics differ in
> methodology (payment data vs. surveys; single vs. multiple response;
> favorite-menu vs. order-volume) and none releases a complete volume
> breakdown across all 13 classes. The share column is therefore a *design
> choice informed by* S2–S4 — chicken clearly first (~0.18), a broad middle,
> a thin Asian tail — **not a market measurement**. It exists so the
> benchmark's class imbalance is realistic; do not cite it as industry data.

## Decision log

- **야식 excluded** — time-based, not a food type (S1); non-exclusive with
  every other category.
- **도시락·죽 excluded** — no coverage in the current 136-label inventory;
  candidate for the roadmap.
- **회 folded into 돈까스·회·일식** — mirrors Baemin's compound category
  naming; keeps the raw-fish labels (물회, 회덮밥, 초밥류) with the cuisine
  they are ordered from.
- **찜·탕·찌개 split from 한식** — platforms separate them; stew/soup is a
  distinct ordering intent (S2 weekday patterns).
- **샌드위치·베이글 → 카페·디저트, 토스트·핫도그 → 버거·패스트푸드** — by
  dominant store type (cafés vs. toast/fast-food chains).
- **마라탕·마라샹궈 → 중식** — Korean platforms list them under Chinese.
- **Single assignment** — deliberate deviation from platform multi-tagging
  (S1) to obtain a partition for analytics; documented rather than hidden.

## How assignment works

Implemented in [`src/menunorm/taxonomy.py`](../src/menunorm/taxonomy.py) with
a fallback chain that guarantees full coverage:

1. category of the **best-matching canonical label** — used even when the
   label matcher abstains (the coarse decision survives fuzzy evidence; the
   pipeline reports `category_accuracy_on_unmatched` to verify this claim);
2. if the name is empty after normalization → the store's own category when
   it is a known food category (the benchmark makes this column deliberately
   noisy so it cannot be used as a shortcut);
3. otherwise → the batch's majority category.

Every row in `standardized.csv` records which branch fired
(`category_source` ∈ `label` | `store` | `prior`).
