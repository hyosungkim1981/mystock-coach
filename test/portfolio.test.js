const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  ACTION_LABELS,
  categorizeActionScore,
  calculateHolding,
  buildPortfolioSharePayload,
  explainHoldingAction,
  generateAgentAnalysisResults,
  parseOcrText,
  summarizePortfolio,
  validateImageFilesMeta,
  validateImageFileMeta,
} = require('../src/portfolio');

test('categorizeActionScore maps scores to the seven coaching stages', () => {
  assert.equal(categorizeActionScore(93).label, ACTION_LABELS.STRONG_BUY);
  assert.equal(categorizeActionScore(78).label, ACTION_LABELS.SPLIT_BUY_STAGE_2);
  assert.equal(categorizeActionScore(64).label, ACTION_LABELS.SPLIT_BUY_STAGE_1);
  assert.equal(categorizeActionScore(52).label, ACTION_LABELS.HOLD);
  assert.equal(categorizeActionScore(39).label, ACTION_LABELS.SPLIT_SELL_STAGE_1);
  assert.equal(categorizeActionScore(24).label, ACTION_LABELS.SPLIT_SELL_STAGE_2);
  assert.equal(categorizeActionScore(12).label, ACTION_LABELS.STRONG_SELL);
});

test('calculateHolding derives current price, market value, and action score immutably', () => {
  const source = {
    name: '삼성전자',
    ticker: '005930',
    quantity: 10,
    avgPrice: 71200,
    profitRate: 3.09,
    weight: 18.4,
    newsScore: 20,
  };

  const holding = calculateHolding(source);

  assert.notEqual(holding, source);
  assert.equal(holding.currentPrice, 73400);
  assert.equal(holding.marketValue, 734000);
  assert.equal(holding.profitRate, 3.09);
  assert.equal(holding.action.label, ACTION_LABELS.HOLD);
  assert.equal(source.currentPrice, undefined);
});

test('parseOcrText extracts Korean stock rows from common MTS text', () => {
  const text = [
    '삼성전자 005930 10주 71,200 73,400 +3.09% 18.4%',
    'SK하이닉스 000660 3주 182,000 178,500 -1.92% 12.1%',
    '현대차 005380 수량 5 평단가 244,000 현재가 252,000 수익률 3.28% 비중 9.2%',
  ].join('\n');

  const holdings = parseOcrText(text);

  assert.equal(holdings.length, 3);
  assert.deepEqual(
    holdings.map((item) => item.name),
    ['삼성전자', 'SK하이닉스', '현대차'],
  );
  assert.equal(holdings[0].ticker, '005930');
  assert.equal(holdings[0].avgPrice, 71200);
  assert.equal(holdings[0].currentPrice, 73400);
  assert.equal(holdings[1].quantity, 3);
  assert.equal(holdings[2].avgPrice, 244000);
  assert.equal(holdings[2].currentPrice, 252000);
  assert.equal(holdings[2].weight, 9.2);
});

test('parseOcrText extracts Korean MTS profit-loss rows and derives portfolio weights', () => {
  const text = [
    '종목명 수익률 평가손익 평가금액',
    '삼성전자 276.79% 38,656,500 52,622,500',
    '삼성전자우 273.80% 11,305,871 15,435,000',
    'SK하이닉스 194.01% 12,347,000 18,711,000',
    'DL이앤씨 31.56% 430,375 1,794,000',
    '현대차 22.84% 1,340,500 7,207,500',
    '월덱스 5.72% 109,127 2,016,500',
    'NAVER -6.69% -281,897 3,928,000',
    '노바렉스 -13.93% -1,489,870 9,198,800',
    'HD현대 -16.22% -1,156,800 5,973,700',
    'CJ제일제당 -17.38% -1,046,200 4,970,000',
    'GS건설 -29.70% -2,638,120 6,244,400',
    '엘오티베큠 -32.78% -838,360 1,718,640',
  ].join('\n');

  const holdings = parseOcrText(text);

  assert.equal(holdings.length, 12);
  assert.equal(holdings[0].name, '삼성전자');
  assert.equal(holdings[0].profitRate, 276.79);
  assert.equal(holdings[0].profitLoss, 38656500);
  assert.equal(holdings[0].marketValue, 52622500);
  assert.equal(holdings[0].weight, 40.53);
  assert.equal(holdings[6].name, 'NAVER');
  assert.equal(holdings[6].profitRate, -6.69);
  assert.equal(holdings[6].profitLoss, -281897);
});

test('parseOcrText extracts column-major OCR from the MTS profit-loss table', () => {
  const text = [
    '종목명',
    '삼성전자',
    '삼성전자우',
    'SK하이닉스',
    '수익률',
    '276.79%',
    '273.80%',
    '194.01%',
    '평가손익',
    '38,656,500',
    '11,305,871',
    '12,347,000',
    '평가금액',
    '52,622,500',
    '15,435,000',
    '18,711,000',
  ].join('\n');

  const holdings = parseOcrText(text);

  assert.equal(holdings.length, 3);
  assert.deepEqual(
    holdings.map((item) => item.name),
    ['삼성전자', '삼성전자우', 'SK하이닉스'],
  );
  assert.equal(holdings[2].marketValue, 18711000);
});

test('validateImageFileMeta accepts only supported image files under the size limit', () => {
  assert.deepEqual(
    validateImageFileMeta({
      name: 'mts.png',
      type: 'image/png',
      size: 1024 * 1024,
    }),
    { ok: true, message: '' },
  );

  assert.equal(
    validateImageFileMeta({
      name: 'large.jpg',
      type: 'image/jpeg',
      size: 9 * 1024 * 1024,
    }).ok,
    false,
  );

  assert.equal(
    validateImageFileMeta({
      name: 'memo.txt',
      type: 'text/plain',
      size: 10,
    }).ok,
    false,
  );

  assert.equal(validateImageFileMeta(null).ok, false);
  assert.equal(
    validateImageFileMeta({
      name: 'empty.webp',
      type: 'image/webp',
      size: 0,
    }).ok,
    false,
  );
});

test('validateImageFilesMeta accepts multiple supported images and reports invalid entries', () => {
  assert.deepEqual(
    validateImageFilesMeta([
      { name: 'first.png', type: 'image/png', size: 1024 },
      { name: 'second.jpg', type: 'image/jpeg', size: 2048 },
    ]),
    { ok: true, message: '', files: 2 },
  );

  const invalid = validateImageFilesMeta([
    { name: 'first.png', type: 'image/png', size: 1024 },
    { name: 'memo.txt', type: 'text/plain', size: 100 },
  ]);

  assert.equal(invalid.ok, false);
  assert.equal(invalid.files, 2);
  assert.match(invalid.message, /memo\.txt/);
  assert.deepEqual(
    validateImageFilesMeta([]),
    { ok: false, message: '이미지 파일을 선택해 주세요.', files: 0 },
  );
});

test('explainHoldingAction returns text reasons for the score and action', () => {
  const holding = calculateHolding({
    name: '삼성전자',
    quantity: 0,
    avgPrice: 0,
    currentPrice: 0,
    profitRate: 276.79,
    weight: 40.53,
    marketValue: 52622500,
    newsScore: 0,
    growthScore: 35,
  });

  const explanation = explainHoldingAction(holding);

  assert.match(explanation.summary, /삼성전자/);
  assert.match(explanation.summary, /보유/);
  assert.match(explanation.summary, /점수/);
  assert.match(explanation.growth, /성장성/);
  assert.match(explanation.buyStrategy, /매수/);
  assert.match(explanation.sellStrategy, /매도/);
  assert.ok(explanation.reasons.some((reason) => reason.includes('비중')));
  assert.ok(explanation.reasons.some((reason) => reason.includes('수익률')));
  assert.ok(explanation.reasons.some((reason) => reason.includes('뉴스')));
});

test('explainHoldingAction covers loss, low-weight, and negative-news reasons', () => {
  const explanation = explainHoldingAction({
    name: 'NAVER',
    profitRate: -21.5,
    weight: 5.2,
    newsScore: -60,
  });

  assert.match(explanation.summary, /NAVER는/);
  assert.ok(explanation.reasons.some((reason) => reason.includes('손실폭이 매우 커')));
  assert.ok(explanation.reasons.some((reason) => reason.includes('비중이 낮아')));
  assert.ok(explanation.reasons.some((reason) => reason.includes('강하게 부정적')));
});

test('explainHoldingAction includes buy and sell reference prices when current price exists', () => {
  const explanation = explainHoldingAction({
    name: '현대차',
    avgPrice: 244000,
    currentPrice: 252000,
    profitRate: 3.28,
    weight: 9.2,
    newsScore: 25,
    growthScore: 45,
  });

  assert.equal(explanation.pricePlan.hasPrice, true);
  assert.equal(typeof explanation.pricePlan.buyPrice, 'number');
  assert.equal(typeof explanation.pricePlan.sellPrice, 'number');
  assert.ok(explanation.pricePlan.buyPrice < 252000);
  assert.ok(explanation.pricePlan.sellPrice > 252000);
  assert.match(explanation.pricePlan.text, /추천 매수가/);
  assert.match(explanation.pricePlan.text, /추천 매도가/);
});

test('explainHoldingAction explains missing price inputs when price cannot be calculated', () => {
  const explanation = explainHoldingAction({
    name: '삼성전자',
    marketValue: 52622500,
    profitRate: 276.79,
    weight: 40.53,
  });

  assert.equal(explanation.pricePlan.hasPrice, false);
  assert.match(explanation.pricePlan.text, /현재가/);
});

test('summarizePortfolio uses a neutral action when there are no holdings', () => {
  const summary = summarizePortfolio([]);

  assert.equal(summary.holdings.length, 0);
  assert.equal(summary.averageAction.label, ACTION_LABELS.HOLD);
});

test('buildPortfolioSharePayload creates a privacy-safe Kakao share summary', () => {
  const holdings = [
    calculateHolding({
      name: '삼성전자',
      ticker: '005930',
      quantity: 10,
      avgPrice: 71200,
      currentPrice: 73400,
      profitRate: 3.09,
      weight: 18.4,
      marketValue: 734000,
    }),
    calculateHolding({
      name: 'NAVER',
      ticker: '035420',
      quantity: 4,
      avgPrice: 186500,
      currentPrice: 199800,
      profitRate: 7.13,
      weight: 8.7,
      marketValue: 799200,
    }),
  ];

  const payload = buildPortfolioSharePayload(
    holdings,
    'https://stock.example.com/index.html?ocr=raw-secret#expanded-holding',
  );

  assert.equal(payload.url, 'https://stock.example.com/index.html');
  assert.match(payload.description, /2종목/);
  assert.match(payload.description, /평균 액션/);
  assert.match(payload.text, /가중 수익률/);
  assert.equal(payload.kakaoTemplate.objectType, 'text');
  assert.doesNotMatch(payload.text, /삼성전자|NAVER|005930|035420|734000|799200|raw-secret/);
});

test('buildPortfolioSharePayload returns an upload invitation when no holdings exist', () => {
  const payload = buildPortfolioSharePayload([], 'https://stock.example.com/index.html');

  assert.match(payload.description, /이미지 업로드/);
  assert.match(payload.text, /대시보드 만들기/);
  assert.equal(payload.buttonTitle, '대시보드 만들기');
});

test('generateAgentAnalysisResults creates dashboard-ready agent results for multiple holdings', () => {
  const input = {
    runDate: '2026-07-23',
    riskProfile: '중립형',
    maxSingleStockWeight: 25,
    targetCashWeight: 10,
    portfolio: [
      {
        name: '삼성전자',
        ticker: '005930',
        market: 'KOSPI',
        avgPrice: 67696,
        currentPrice: 255000,
        marketValue: 52622500,
        profitLoss: 38656500,
        profitRate: 276.79,
        portfolioWeight: 40.53,
        newsScore: 25,
        growthScore: 45,
      },
      {
        name: 'NAVER',
        ticker: '035420',
        market: 'KOSPI',
        avgPrice: 177000,
        currentPrice: 165000,
        marketValue: 3928000,
        profitLoss: -281897,
        profitRate: -6.69,
        portfolioWeight: 3.03,
        newsScore: -20,
        growthScore: 10,
      },
    ],
  };

  const output = generateAgentAnalysisResults(input);
  const samsung = output.results[0];
  const naver = output.results[1];

  assert.equal(output.schemaVersion, 'agent-analysis-result.v1');
  assert.equal(output.runDate, '2026-07-23');
  assert.equal(output.results.length, 2);
  assert.equal(output.portfolioSummary.holdingCount, 2);
  assert.equal(samsung.holding.name, '삼성전자');
  assert.equal(samsung.appScore.action, ACTION_LABELS.HOLD);
  assert.equal(samsung.dashboardResult.displayAction, ACTION_LABELS.SPLIT_SELL_STAGE_1);
  assert.equal(samsung.agentAnalysis.portfolioOperationResult.rebalanceAction, '일부축소');
  assert.equal(samsung.agentAnalysis.portfolioOperationResult.targetWeight, 24);
  assert.equal(samsung.agentAnalysis.validationResult.validationStatus, 'WARN');
  assert.equal(samsung.agentAnalysis.validationResult.usableForDashboard, true);
  assert.match(samsung.dashboardResult.detailText, /비중/);
  assert.match(samsung.dashboardResult.buyReferenceText, /매수/);
  assert.match(samsung.dashboardResult.sellReferenceText, /매도|축소/);
  assert.equal(naver.holding.name, 'NAVER');
  assert.ok(naver.agentAnalysis.researchResult.riskFactors.length > 0);
  assert.ok(Array.isArray(output.sources));
});

test('generateAgentAnalysisResults derives missing weights and does not mutate input', () => {
  const input = {
    runDate: '2026-07-23',
    portfolio: [
      { name: '현대차', currentPrice: 252000, marketValue: 7207500, profitRate: 22.84 },
      { name: '월덱스', currentPrice: 20165, marketValue: 2016500, profitRate: 5.72 },
    ],
  };

  const original = JSON.stringify(input);
  const output = generateAgentAnalysisResults(input);

  assert.equal(JSON.stringify(input), original);
  assert.equal(output.results[0].holding.portfolioWeight, 78.14);
  assert.equal(output.results[1].holding.portfolioWeight, 21.86);
  assert.equal(output.results[0].agentAnalysis.validationResult.validationStatus, 'WARN');
  assert.ok(output.results.every((item) => item.dashboardResult.validationBadge));
});

test('generate-agent-analysis script converts portfolio JSON file to result JSON', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mystock-agent-analysis-'));
  const inputPath = path.join(tempDir, 'portfolio.json');
  const outputPath = path.join(tempDir, 'agent-analysis.json');

  fs.writeFileSync(
    inputPath,
    JSON.stringify({
      runDate: '2026-07-23',
      portfolio: [
        {
          name: '삼성전자',
          currentPrice: 255000,
          marketValue: 52622500,
          profitRate: 276.79,
          portfolioWeight: 40.53,
          newsScore: 25,
          growthScore: 45,
        },
      ],
    }),
  );

  execFileSync(process.execPath, ['scripts/generate-agent-analysis.mjs', inputPath, outputPath], {
    cwd: path.join(__dirname, '..'),
  });

  const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));

  assert.equal(output.schemaVersion, 'agent-analysis-result.v1');
  assert.equal(output.results[0].holding.name, '삼성전자');
  assert.equal(output.results[0].dashboardResult.displayAction, ACTION_LABELS.SPLIT_SELL_STAGE_1);
});
