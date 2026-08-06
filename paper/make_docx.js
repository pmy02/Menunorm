// Build menunorm.docx (EN) and menunorm_ko.docx (KO) — two-column paper layout.
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, SectionType, LevelFormat,
  convertInchesToTwip,
} = require("docx");

const FIG = __dirname + "/figures/";
const OUT = __dirname + "/";

const BODY_FONT = { ascii: "Times New Roman", hAnsi: "Times New Roman", eastAsia: "Batang", cs: "Times New Roman" };
const HEAD_FONT = { ascii: "Arial", hAnsi: "Arial", eastAsia: "Malgun Gothic", cs: "Arial" };
const MONO_FONT = { ascii: "Consolas", hAnsi: "Consolas", eastAsia: "Malgun Gothic", cs: "Consolas" };

// ---------- tiny builder DSL ----------
const R = (t, o = {}) =>
  new TextRun({ text: t, font: o.mono ? MONO_FONT : BODY_FONT, bold: !!o.b, italics: !!o.i, size: o.size || 20 });

function P(segs, opts = {}) {
  const children = (Array.isArray(segs) ? segs : [segs]).map((s) =>
    typeof s === "string" ? R(s, opts.runOpts || {}) : R(s.t, s)
  );
  return new Paragraph({
    children,
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 80, line: 252, ...(opts.spacing || {}) },
    indent: opts.indent,
    numbering: opts.numbering,
  });
}

const H1 = (num, text) =>
  new Paragraph({
    children: [new TextRun({ text: `${num}. ${text}`, font: HEAD_FONT, bold: true, size: 24 })],
    spacing: { before: 200, after: 100 },
    keepNext: true,
  });

const CAP = (text) =>
  new Paragraph({
    children: [new TextRun({ text, font: BODY_FONT, size: 18, bold: false })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 160 },
  });

function figure(file, w, h, caption) {
  const scale = 300 / w;
  return [
    new Paragraph({
      children: [new ImageRun({ type: "png", data: fs.readFileSync(FIG + file), transformation: { width: 300, height: Math.round(h * scale) } })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 20 },
    }),
    CAP(caption),
  ];
}

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = (sz) => ({ style: BorderStyle.SINGLE, size: sz, color: "000000" });

function paperTable(header, rows, widths, caption, boldRow = -1) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (t, bold, w, first) =>
    new TableCell({
      width: { size: w, type: WidthType.DXA },
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: [new Paragraph({
        children: [new TextRun({ text: t, font: BODY_FONT, size: 18, bold })],
        alignment: first ? AlignmentType.LEFT : AlignmentType.CENTER,
        spacing: { after: 0 },
      })],
    });
  const table = new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    alignment: AlignmentType.CENTER,
    borders: { top: line(8), bottom: line(8), left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
    rows: [
      new TableRow({
        tableHeader: true,
        children: header.map((t, i) => {
          const c = cell(t, true, widths[i], i === 0);
          return c;
        }),
      }),
      ...rows.map((r, ri) =>
        new TableRow({ children: r.map((t, i) => cell(t, ri === boldRow, widths[i], i === 0)) })
      ),
    ],
  });
  return [CAP(caption), table, new Paragraph({ children: [], spacing: { after: 120 } })];
}

// header-row bottom rule: wrap by adding a thin table? Simpler: rely on top/bottom rules only (booktabs-lite).

const numbering = {
  config: [{
    reference: "clist",
    levels: [{
      level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 340, hanging: 240 } } },
    }],
  }],
};

const refIndent = { indent: { left: 340, hanging: 340 }, after: 40 };

// ---------------- shared reference list ----------------
const REFS = [
  "[1] W. B. Cavnar and J. M. Trenkle. N-gram-based text categorization. In Proc. SDAIR, pages 161–175, 1994.",
  "[2] A. Cevahir and K. Murakami. Large-scale multi-class and hierarchical product categorization for an e-commerce giant. In Proc. COLING, pages 525–535, 2016.",
  "[3] C. K. Chow. On optimum recognition error and reject tradeoff. IEEE Trans. Information Theory, 16(1):41–46, 1970.",
  "[4] P. Christen. Probabilistic data generation for deduplication and data linkage. In Proc. IDEAL, pages 109–116, 2005.",
  "[5] P. Christen. Data Matching. Springer, 2012.",
  "[6] W. W. Cohen, P. Ravikumar, and S. E. Fienberg. A comparison of string distance metrics for name-matching tasks. In Proc. IIWeb, pages 73–78, 2003.",
  "[7] R. El-Yaniv and Y. Wiener. On the foundations of noise-free selective classification. JMLR, 11:1605–1641, 2010.",
  "[8] R. Geirhos et al. Shortcut learning in deep neural networks. Nature Machine Intelligence, 2:665–673, 2020.",
  "[9] 하나금융경영연구소. 배달 앱 이용 현황과 메뉴 유형별 수요 특성. 카드 결제 데이터 분석 보고서, 2022.",
  "[10] T. Kudo, K. Yamamoto, and Y. Matsumoto. Applying conditional random fields to Japanese morphological analysis. In Proc. EMNLP, pages 230–237, 2004.",
  "[11] S. P. Lloyd. Least squares quantization in PCM. IEEE Trans. Information Theory, 28(2):129–137, 1982.",
  "[12] P. McNamee and J. Mayfield. Character n-gram tokenization for European language text retrieval. Information Retrieval, 7(1–2):73–97, 2004.",
  "[13] E. L. Park and S. Cho. KoNLPy: Korean natural language processing in Python. In Proc. HCLT, 2014.",
  "[14] F. Pedregosa et al. Scikit-learn: Machine learning in Python. JMLR, 12:2825–2830, 2011.",
  "[15] 요기요 파트너 문서. 요기요 카테고리 소개. https://partner.yogiyo.co.kr, accessed 2026.",
  "[16] G. K. Zipf. Human Behavior and the Principle of Least Effort. Addison-Wesley, 1949.",
];

// ---------------- content builders ----------------
function buildDoc(lang) {
  const ko = lang === "ko";
  const T = ko
    ? {
        title1: "이중 분할 융합과 카테고리 전량 배정을 갖춘",
        title2: "한국어 상품명 2단계 표준화: MenuNorm",
        sub: "Two-Level Standardization of Noisy Korean Product Names with Dual-Segmentation Fusion and Guaranteed Category Coverage",
        author: "박민영 (Minyoung Park)",
        affil: "경상국립대학교 컴퓨터과학과 · Dream2Real  |  github.com/pmy02/Menunorm",
        absLabel: "요약. ",
        kwLabel: "키워드: ",
        kw: "텍스트 정규화, 개체 매칭, 한국어 자연어처리, 상품 카테고리 분류, 선택적 예측, 합성 벤치마크",
        tbl1cap: "표 1. 주요 결과(20,000행, 시드 42). Level-2는 보류 가능한 표준 레이블, Level-1은 커버리지가 보장된 카테고리(%).",
        tbl2cap: "표 2. 분할 방식 ablation, hard 트랙(%).",
        fig1cap: "그림 1. 보류 임계값에 따른 커버리지/정밀도 트레이드오프(hard 트랙). 운영점 τ=0.45는 이 스윕에서 선택.",
        fig2cap: "그림 2. hard 트랙의 행 정규화 카테고리 혼동 행렬.",
        fig3cap: "그림 3. 롱테일 붕괴: 7,981개 고유 원시 문자열이 136개 표준 레이블로 사상(hard 트랙).",
        refs: "참고문헌",
        t1h: ["트랙", "커버리지", "매칭", "전체", "카테고리"],
        t2h: ["경로", "커버리지", "매칭", "전체"],
        t2r: [["형태소 단독", "93.14", "99.30", "92.48"], ["표면 단독", "98.58", "99.76", "98.34"], ["융합 (max score)", "98.75", "99.68", "98.44"]],
      }
    : {
        title1: "MenuNorm: Two-Level Standardization of Noisy Korean Product Names",
        title2: "with Dual-Segmentation Fusion and Guaranteed Category Coverage",
        sub: null,
        author: "Minyoung Park",
        affil: "Department of Computer Science, Gyeongsang National University · Dream2Real  |  github.com/pmy02/Menunorm",
        absLabel: "Abstract. ",
        kwLabel: "Keywords: ",
        kw: "text normalization, entity matching, Korean NLP, product categorization, selective prediction, synthetic benchmarks",
        tbl1cap: "Table 1. Main results (20k rows, seed 42). Level-2 = canonical label with abstention; Level-1 = category with guaranteed coverage (%).",
        tbl2cap: "Table 2. Segmentation ablation, hard track (%).",
        fig1cap: "Figure 1. Coverage/precision trade-off across the abstention threshold (hard track); operating point τ = 0.45.",
        fig2cap: "Figure 2. Row-normalized category confusion on the hard track.",
        fig3cap: "Figure 3. Long-tail collapse: 7,981 unique raw strings map onto 136 canonical labels (hard track).",
        refs: "References",
        t1h: ["Track", "Cov.", "Match.", "Overall", "Cat. acc."],
        t2h: ["Path", "Coverage", "Matched", "Overall"],
        t2r: [["Morphological only", "93.14", "99.30", "92.48"], ["Surface only", "98.58", "99.76", "98.34"], ["Fused (max score)", "98.75", "99.68", "98.44"]],
      };

  const bodyFile = ko ? "body_ko.json" : "body_en.json";
  const body = JSON.parse(fs.readFileSync(OUT + bodyFile, "utf-8"));

  const titleChildren = [
    new Paragraph({
      children: [new TextRun({ text: T.title1, font: HEAD_FONT, bold: true, size: 32 })],
      alignment: AlignmentType.CENTER, spacing: { before: 200, after: 20 },
    }),
    new Paragraph({
      children: [new TextRun({ text: T.title2, font: HEAD_FONT, bold: true, size: 32 })],
      alignment: AlignmentType.CENTER, spacing: { after: T.sub ? 60 : 160 },
    }),
  ];
  if (T.sub)
    titleChildren.push(new Paragraph({
      children: [new TextRun({ text: T.sub, font: BODY_FONT, italics: true, size: 22 })],
      alignment: AlignmentType.CENTER, spacing: { after: 160 },
    }));
  titleChildren.push(
    new Paragraph({ children: [new TextRun({ text: T.author, font: BODY_FONT, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: T.affil, font: BODY_FONT, size: 18 })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
    P([{ t: T.absLabel, b: true, size: 18 }, { t: body.abstract, size: 18 }], { after: 120, indent: { left: 570, right: 570 } }),
    P([{ t: T.kwLabel, b: true, size: 18 }, { t: T.kw, size: 18 }], { after: 240, indent: { left: 570, right: 570 } }),
  );

  const bodyChildren = [];
  for (const block of body.blocks) {
    if (block.h) bodyChildren.push(H1(block.h[0], block.h[1]));
    else if (block.li) bodyChildren.push(P(block.li, { numbering: { reference: "clist", level: 0 }, after: 60 }));
    else if (block.table === 1)
      bodyChildren.push(...paperTable(T.t1h, [["standard", "100.0", "100.0", "100.0", "100.0"], ["hard", "98.75", "99.68", "98.44", "99.72"]], [1180, 860, 860, 860, 840], T.tbl1cap));
    else if (block.table === 2)
      bodyChildren.push(...paperTable(T.t2h, T.t2r, [1900, 900, 900, 900], T.tbl2cap, 2));
    else if (block.fig === 1) bodyChildren.push(...figure("threshold_sweep.png", 1050, 630, T.fig1cap));
    else if (block.fig === 2) bodyChildren.push(...figure("confusion_matrix.png", 1110, 960, T.fig2cap));
    else if (block.fig === 3) bodyChildren.push(...figure("long_tail.png", 1050, 630, T.fig3cap));
    else if (block.refs) {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: T.refs, font: HEAD_FONT, bold: true, size: 24 })],
        spacing: { before: 200, after: 100 },
      }));
      for (const r of REFS) bodyChildren.push(P([{ t: r, size: 16 }], refIndent));
    } else bodyChildren.push(P(block.p, { after: 80 }));
  }

  const doc = new Document({
    numbering,
    styles: { default: { document: { run: { font: BODY_FONT, size: 20 } } } },
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1247, left: 1077, right: 1077 } } },
        children: titleChildren,
      },
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: { margin: { top: 1134, bottom: 1247, left: 1077, right: 1077 } },
          column: { count: 2, space: 425 },
        },
        children: bodyChildren,
      },
    ],
  });
  return doc;
}

(async () => {
  for (const lang of ["en", "ko"]) {
    const doc = buildDoc(lang);
    const buf = await Packer.toBuffer(doc);
    const name = lang === "ko" ? "menunorm_ko.docx" : "menunorm.docx";
    fs.writeFileSync(OUT + name, buf);
    console.log("wrote", name, buf.length, "bytes");
  }
})();
