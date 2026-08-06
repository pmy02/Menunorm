# Working paper

*MenuNorm: Two-Level Standardization of Noisy Korean Product Names with
Dual-Segmentation Fusion and Guaranteed Category Coverage.*

| File | Language | Format |
|---|---|---|
| `menunorm.pdf` / `menunorm.tex` | English | LaTeX (6 pp., two-column A4) |
| `menunorm_ko.pdf` / `menunorm_ko.tex` | Korean (국문 요약 + 영문 초록) | LaTeX (5 pp., two-column A4) |
| `menunorm.docx` | English | Word (two-column, editable) |
| `menunorm_ko.docx` | Korean | Word (two-column, editable) |

**Rebuild.** LaTeX: `xelatex menunorm.tex` (run twice; requires `xeCJK` +
Noto CJK KR fonts). Word: `node make_docx.js` (requires the `docx` npm
package; content lives in `body_en.json` / `body_ko.json`).

Figures under `figures/` are the actual pipeline outputs (hard track,
seed 42). Anonymize the author block before double-blind submission; adapt
margins/fonts to the target venue's template (HCLT, KCC, etc.).
