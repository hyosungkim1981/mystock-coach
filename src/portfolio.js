(function exposePortfolio(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.StockCoach = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createPortfolioModule() {
  const ACTION_LABELS = Object.freeze({
    STRONG_BUY: '적극매수',
    SPLIT_BUY_STAGE_1: '분할매수 1단계',
    SPLIT_BUY_STAGE_2: '분할매수 2단계',
    HOLD: '보유',
    SPLIT_SELL_STAGE_1: '분할매도 1단계',
    SPLIT_SELL_STAGE_2: '분할매도 2단계',
    STRONG_SELL: '적극매도',
  });

  const ACTION_BANDS = Object.freeze([
    Object.freeze({ min: 85, max: 100, label: ACTION_LABELS.STRONG_BUY, tone: 'buy-strong' }),
    Object.freeze({ min: 72, max: 84, label: ACTION_LABELS.SPLIT_BUY_STAGE_2, tone: 'buy' }),
    Object.freeze({ min: 60, max: 71, label: ACTION_LABELS.SPLIT_BUY_STAGE_1, tone: 'buy-light' }),
    Object.freeze({ min: 45, max: 59, label: ACTION_LABELS.HOLD, tone: 'hold' }),
    Object.freeze({ min: 33, max: 44, label: ACTION_LABELS.SPLIT_SELL_STAGE_1, tone: 'sell-light' }),
    Object.freeze({ min: 20, max: 32, label: ACTION_LABELS.SPLIT_SELL_STAGE_2, tone: 'sell' }),
    Object.freeze({ min: 0, max: 19, label: ACTION_LABELS.STRONG_SELL, tone: 'sell-strong' }),
  ]);

  const SUPPORTED_IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
  const SUPPORTED_IMAGE_EXTENSIONS = Object.freeze(['.jpg', '.jpeg', '.png', '.webp']);
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function round(value, digits) {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value !== 'string') return 0;

    const normalized = value
      .replace(/,/g, '')
      .replace(/원|주|좌|%/g, '')
      .trim();
    const match = normalized.match(/[+-]?\d+(?:\.\d+)?/);

    return match ? Number(match[0]) : 0;
  }

  function normalizePercent(value) {
    return round(parseNumber(value), 2);
  }

  function inferCurrentPrice(avgPrice, profitRate) {
    if (avgPrice <= 0) return 0;
    return Math.round(avgPrice * (1 + profitRate / 100));
  }

  function scoreProfit(profitRate) {
    if (profitRate >= 45) return 48;
    if (profitRate >= 25) return 58;
    if (profitRate >= 8) return 68;
    if (profitRate >= 0) return 56;
    if (profitRate >= -8) return 43;
    if (profitRate >= -18) return 30;
    return 18;
  }

  function scoreWeight(weight) {
    if (weight <= 0) return 50;
    if (weight <= 8) return 74;
    if (weight <= 15) return 65;
    if (weight <= 25) return 48;
    if (weight <= 35) return 34;
    return 22;
  }

  function scoreRisk(profitRate, weight) {
    let score = 62;

    if (profitRate <= -18) score -= 28;
    else if (profitRate <= -8) score -= 18;
    else if (profitRate >= 35) score -= 10;
    else if (profitRate >= 8) score += 6;

    if (weight >= 35) score -= 24;
    else if (weight >= 25) score -= 16;
    else if (weight >= 18) score -= 8;
    else if (weight > 0 && weight <= 10) score += 6;

    return clamp(score, 0, 100);
  }

  function scoreMomentum(profitRate, newsScore) {
    return clamp(50 + profitRate * 1.25 + newsScore * 0.18, 0, 100);
  }

  function normalizeNewsScore(newsScore) {
    return clamp(50 + newsScore * 0.5, 0, 100);
  }

  function normalizeGrowthScore(growthScore) {
    return clamp(50 + growthScore * 0.5, 0, 100);
  }

  function categorizeActionScore(score) {
    const normalized = clamp(Math.round(score), 0, 100);
    const band = ACTION_BANDS.find((item) => normalized >= item.min && normalized <= item.max) || ACTION_BANDS[ACTION_BANDS.length - 1];

    return {
      score: normalized,
      label: band.label,
      tone: band.tone,
      range: `${band.min}-${band.max}`,
    };
  }

  function calculateActionScore(holding) {
    const profitRate = normalizePercent(holding.profitRate);
    const weight = normalizePercent(holding.weight);
    const newsScore = clamp(parseNumber(holding.newsScore), -100, 100);
    const growthScore = clamp(parseNumber(holding.growthScore), -100, 100);

    const signals = {
      profit: scoreProfit(profitRate),
      weight: scoreWeight(weight),
      risk: scoreRisk(profitRate, weight),
      momentum: scoreMomentum(profitRate, newsScore),
      news: normalizeNewsScore(newsScore),
      growth: normalizeGrowthScore(growthScore),
    };

    const score =
      signals.momentum * 0.22 +
      signals.news * 0.14 +
      signals.growth * 0.16 +
      signals.risk * 0.22 +
      signals.weight * 0.14 +
      signals.profit * 0.12;

    return {
      score: clamp(Math.round(score), 0, 100),
      signals,
    };
  }

  function calculateHolding(input) {
    const quantity = Math.max(0, Math.round(parseNumber(input.quantity)));
    const avgPrice = Math.max(0, Math.round(parseNumber(input.avgPrice)));
    const profitRate = normalizePercent(input.profitRate);
    const profitLoss = Math.round(parseNumber(input.profitLoss));
    const currentPrice = Math.max(
      0,
      Math.round(parseNumber(input.currentPrice)) || inferCurrentPrice(avgPrice, profitRate),
    );
    const marketValue = Math.max(
      0,
      Math.round(parseNumber(input.marketValue)) || Math.round(currentPrice * quantity),
    );
    const weight = normalizePercent(input.weight);
    const newsScore = clamp(parseNumber(input.newsScore), -100, 100);
    const growthScore = clamp(parseNumber(input.growthScore), -100, 100);
    const actionResult = calculateActionScore({ profitRate, weight, newsScore, growthScore });

    return {
      id: input.id || createHoldingId(input.name, input.ticker),
      name: String(input.name || '').trim() || '미확인 종목',
      ticker: String(input.ticker || '').trim(),
      quantity,
      avgPrice,
      currentPrice,
      marketValue,
      profitLoss,
      profitRate,
      weight,
      newsScore,
      growthScore,
      action: categorizeActionScore(actionResult.score),
      signals: actionResult.signals,
    };
  }

  function createHoldingId(name, ticker) {
    const source = `${ticker || ''}-${name || ''}-${Date.now()}-${Math.random()}`;
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
    }

    return `holding-${hash.toString(16)}`;
  }

  function cleanLine(line) {
    return line
      .replace(/\s+/g, ' ')
      .replace(/[|]/g, ' ')
      .trim();
  }

  function parseName(line, ticker) {
    const beforeTicker = ticker ? line.split(ticker)[0] : line.split(/[0-9]/)[0];
    return beforeTicker
      .replace(/종목명|보유|잔고|국내주식|평가/g, '')
      .replace(/[^\w가-힣.&() -]/g, '')
      .trim();
  }

  function getNumericTokensWithoutTickerAndPercent(line, ticker) {
    const withoutTicker = ticker ? line.replace(ticker, ' ') : line;
    const withoutPercents = withoutTicker.replace(/[+-]?\d[\d,]*(?:\.\d+)?\s*%/g, ' ');
    return withoutPercents
      .match(/[+-]?\d[\d,]*(?:\.\d+)?/g)
      ?.map(parseNumber)
      .filter((value) => Number.isFinite(value)) || [];
  }

  function parseLine(line) {
    const normalized = cleanLine(line);
    if (!normalized) return null;

    const profitLossLine = parseProfitLossLine(normalized);
    if (profitLossLine) return profitLossLine;

    const ticker = normalized.match(/\b\d{6}\b/)?.[0] || '';
    const percentages = normalized.match(/[+-]?\d+(?:\.\d+)?\s*%/g) || [];
    const explicitQuantity = normalized.match(/(?:수량\s*)?([0-9][\d,]*)\s*(?:주|좌)/)?.[1];
    const tokens = getNumericTokensWithoutTickerAndPercent(normalized, ticker);
    const quantity = explicitQuantity ? parseNumber(explicitQuantity) : tokens[0] || 0;
    const firstPriceIndex = 1;
    const avgPrice = tokens[firstPriceIndex] || 0;
    const currentPrice = tokens[firstPriceIndex + 1] || 0;
    const profitRate = percentages[0] ? normalizePercent(percentages[0]) : 0;
    const weight = percentages[1] ? normalizePercent(percentages[1]) : 0;
    const name = parseName(normalized, ticker);

    if (!name && !ticker) return null;
    if (!quantity && !avgPrice && !currentPrice && !percentages.length) return null;

    return calculateHolding({
      name,
      ticker,
      quantity,
      avgPrice,
      currentPrice,
      profitRate,
      weight,
      newsScore: 0,
      growthScore: 0,
    });
  }

  function parseProfitLossLine(line) {
    const percentMatch = line.match(/[+-]?\d+(?:\.\d+)?\s*%/);
    if (!percentMatch) return null;

    const name = line
      .slice(0, percentMatch.index)
      .replace(/종목명|수익률|평가손익|평가금액/g, '')
      .replace(/[^\w가-힣.&() -]/g, '')
      .trim();
    const values = line
      .slice(percentMatch.index + percentMatch[0].length)
      .match(/[+-]?\d[\d,]*(?:\.\d+)?/g)
      ?.map(parseNumber) || [];

    if (!name || values.length < 2) return null;

    return calculateHolding({
      name,
      ticker: '',
      quantity: 0,
      avgPrice: 0,
      currentPrice: 0,
      marketValue: values[1],
      profitLoss: values[0],
      profitRate: percentMatch[0],
      weight: 0,
      newsScore: 0,
      growthScore: 0,
    });
  }

  function isHeaderLikeLine(line) {
    return /종목명|수익률|평가손익|평가금액|보유|매매손익|체결|손익추이|물타기|이자|국내|해외|메뉴|주문|잔고|지수/.test(line);
  }

  function isStockNameLine(line) {
    const normalized = cleanLine(line);
    if (!normalized || isHeaderLikeLine(normalized)) return false;
    if (/[0-9,%]/.test(normalized)) return false;
    return /[가-힣A-Za-z]/.test(normalized);
  }

  function findHeaderIndex(lines, pattern) {
    return lines.findIndex((line) => pattern.test(line));
  }

  function parseColumnarProfitLossText(lines) {
    const nameIndex = findHeaderIndex(lines, /종목명/);
    const rateIndex = findHeaderIndex(lines, /수익률/);
    const profitLossIndex = findHeaderIndex(lines, /평가손익/);
    const marketValueIndex = findHeaderIndex(lines, /평가금액/);

    if (
      nameIndex < 0 ||
      rateIndex <= nameIndex ||
      profitLossIndex <= rateIndex ||
      marketValueIndex <= profitLossIndex
    ) {
      return [];
    }

    const names = lines.slice(nameIndex + 1, rateIndex).filter(isStockNameLine);
    const rates = lines
      .slice(rateIndex + 1, profitLossIndex)
      .map((line) => line.match(/[+-]?\d+(?:\.\d+)?\s*%/)?.[0])
      .filter(Boolean);
    const profitLosses = lines
      .slice(profitLossIndex + 1, marketValueIndex)
      .map((line) => line.match(/[+-]?\d[\d,]*(?:\.\d+)?/)?.[0])
      .filter(Boolean);
    const marketValues = lines
      .slice(marketValueIndex + 1)
      .map((line) => line.match(/[+-]?\d[\d,]*(?:\.\d+)?/)?.[0])
      .filter(Boolean);
    const count = Math.min(names.length, rates.length, profitLosses.length, marketValues.length);

    return names.slice(0, count).map((name, index) =>
      calculateHolding({
        name,
        ticker: '',
        quantity: 0,
        avgPrice: 0,
        currentPrice: 0,
        marketValue: marketValues[index],
        profitLoss: profitLosses[index],
        profitRate: rates[index],
        weight: 0,
        newsScore: 0,
        growthScore: 0,
      }),
    );
  }

  function deriveMissingWeights(holdings) {
    const totalMarketValue = holdings.reduce((sum, item) => sum + item.marketValue, 0);
    if (totalMarketValue <= 0) return holdings;

    return holdings.map((item) => {
      if (item.weight > 0) return item;

      return calculateHolding({
        ...item,
        weight: round((item.marketValue / totalMarketValue) * 100, 2),
      });
    });
  }

  function parseOcrText(text) {
    if (typeof text !== 'string') return [];

    const lines = text
      .split(/\r?\n/)
      .map(cleanLine)
      .filter(Boolean);
    const columnarHoldings = parseColumnarProfitLossText(lines);
    const lineHoldings = lines
      .map(parseLine)
      .filter(Boolean);

    if (columnarHoldings.length > lineHoldings.length) {
      return deriveMissingWeights(columnarHoldings);
    }

    return deriveMissingWeights(lineHoldings);
  }

  function validateImageFileMeta(file) {
    if (!file || typeof file !== 'object') {
      return { ok: false, message: '이미지 파일을 선택해 주세요.' };
    }

    const name = String(file.name || '').toLowerCase();
    const type = String(file.type || '').toLowerCase();
    const size = Number(file.size || 0);
    const extension = name.match(/\.[^.]+$/)?.[0] || '';

    if (!SUPPORTED_IMAGE_TYPES.includes(type) || !SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) {
      return { ok: false, message: 'PNG, JPG, WEBP 이미지만 사용할 수 있습니다.' };
    }

    if (size <= 0) {
      return { ok: false, message: '비어 있는 이미지 파일은 사용할 수 없습니다.' };
    }

    if (size > MAX_IMAGE_BYTES) {
      return { ok: false, message: '이미지는 8MB 이하로 업로드해 주세요.' };
    }

    return { ok: true, message: '' };
  }

  function validateImageFilesMeta(files) {
    const normalizedFiles = Array.from(files || []);

    if (!normalizedFiles.length) {
      return { ok: false, message: '이미지 파일을 선택해 주세요.', files: 0 };
    }

    const invalidResults = normalizedFiles
      .map((file) => ({
        name: String(file?.name || '이름 없는 파일'),
        validation: validateImageFileMeta(file),
      }))
      .filter((result) => !result.validation.ok);

    if (invalidResults.length) {
      const firstInvalid = invalidResults[0];
      return {
        ok: false,
        message: `${firstInvalid.name}: ${firstInvalid.validation.message}`,
        files: normalizedFiles.length,
      };
    }

    return { ok: true, message: '', files: normalizedFiles.length };
  }

  function describeProfitRate(profitRate) {
    if (profitRate >= 45) return '수익률이 매우 높아 추격매수보다는 차익 관리 관점이 강합니다.';
    if (profitRate >= 8) return '수익률이 플러스라 보유 흐름은 양호하지만 추가매수는 비중과 뉴스 확인이 필요합니다.';
    if (profitRate >= 0) return '수익률이 소폭 플러스라 관찰 중심의 보유 판단에 가깝습니다.';
    if (profitRate >= -8) return '수익률이 소폭 마이너스라 손실 확대 여부를 확인해야 합니다.';
    if (profitRate >= -18) return '수익률 손실폭이 커져 리스크 관리가 필요합니다.';
    return '수익률 손실폭이 매우 커 적극적인 리스크 축소 검토가 필요합니다.';
  }

  function describeWeight(weight) {
    if (weight >= 35) return '포트폴리오 비중이 매우 높아 추가매수 점수를 크게 낮췄습니다.';
    if (weight >= 25) return '비중이 높은 편이라 분할매수보다 비중 관리가 우선입니다.';
    if (weight >= 15) return '비중이 중간 이상이라 강한 매수 신호는 제한했습니다.';
    if (weight > 0 && weight <= 8) return '비중이 낮아 좋은 신호가 나오면 분할매수 여지가 있습니다.';
    return '비중 정보가 없거나 낮아 가격/뉴스 신호를 더 크게 봅니다.';
  }

  function describeNews(newsScore) {
    if (newsScore >= 50) return '뉴스 점수가 강하게 긍정적이라 매수 쪽 점수에 보탬이 됐습니다.';
    if (newsScore >= 15) return '뉴스 점수가 긍정적이라 모멘텀을 일부 높였습니다.';
    if (newsScore <= -50) return '뉴스 점수가 강하게 부정적이라 매도 위험 점수를 높였습니다.';
    if (newsScore <= -15) return '뉴스 점수가 부정적이라 보수적으로 반영했습니다.';
    return '뉴스 점수는 중립으로 반영했습니다.';
  }

  function describeGrowth(growthScore) {
    if (growthScore >= 50) return '성장성 점수가 강하게 긍정적입니다. 실적 성장, 산업 모멘텀, 경쟁력에 대한 기대를 높게 반영한 상태입니다.';
    if (growthScore >= 15) return '성장성 점수가 긍정적입니다. 추가 매수 판단에서는 실적 확인과 가격 눌림을 함께 봅니다.';
    if (growthScore <= -50) return '성장성 점수가 강하게 부정적입니다. 구조적 둔화나 실적 훼손 가능성을 보수적으로 반영합니다.';
    if (growthScore <= -15) return '성장성 점수가 부정적입니다. 반등이 나와도 비중 확대보다 리스크 점검이 우선입니다.';
    return '성장성 점수는 중립입니다. 아직 기업/뉴스 API가 연결되지 않았으므로 사용자가 직접 조정한 성장성 신호만 반영합니다.';
  }

  function formatWon(value) {
    if (!Number.isFinite(value) || value <= 0) return '산출 불가';
    return `${Math.round(value).toLocaleString('ko-KR')}원`;
  }

  function roundReferencePrice(value) {
    if (!Number.isFinite(value) || value <= 0) return 0;
    if (value >= 500000) return Math.round(value / 1000) * 1000;
    if (value >= 100000) return Math.round(value / 500) * 500;
    if (value >= 50000) return Math.round(value / 100) * 100;
    if (value >= 10000) return Math.round(value / 50) * 50;
    return Math.round(value / 10) * 10;
  }

  function buildPricePlan(holding) {
    const currentPrice = parseNumber(holding.currentPrice);

    if (currentPrice <= 0) {
      return {
        hasPrice: false,
        buyPrice: null,
        addBuyPrice: null,
        sellPrice: null,
        trimPrice: null,
        stopLossPrice: null,
        text: '추천 매수가/매도가를 계산하려면 현재가가 필요합니다. 현재 화면에 수량/평단가/현재가가 없다면 해당 컬럼이 보이는 MTS 화면을 추가로 넣어 주세요.',
      };
    }

    const score = holding.action.score;
    const buyMultiplier = score >= 72 ? 0.98 : score >= 60 ? 0.96 : score >= 45 ? 0.94 : 0.9;
    const addBuyMultiplier = score >= 60 ? 0.92 : score >= 45 ? 0.88 : 0.84;
    const sellMultiplier = score <= 32 ? 1.02 : score <= 44 ? 1.04 : score >= 72 ? 1.16 : 1.1;
    const trimMultiplier = holding.profitRate >= 30 || holding.weight >= 25 ? 1.03 : 1.06;
    const stopLossMultiplier = holding.profitRate < -12 ? 0.95 : 0.92;
    const buyPrice = roundReferencePrice(currentPrice * buyMultiplier);
    const addBuyPrice = roundReferencePrice(currentPrice * addBuyMultiplier);
    const sellPrice = roundReferencePrice(currentPrice * sellMultiplier);
    const trimPrice = roundReferencePrice(currentPrice * trimMultiplier);
    const stopLossPrice = roundReferencePrice(currentPrice * stopLossMultiplier);

    return {
      hasPrice: true,
      buyPrice,
      addBuyPrice,
      sellPrice,
      trimPrice,
      stopLossPrice,
      text: `추천 매수가 ${formatWon(buyPrice)}, 2차 매수가 ${formatWon(addBuyPrice)}, 추천 매도가 ${formatWon(sellPrice)}, 일부 매도 기준 ${formatWon(trimPrice)}, 손절 기준 ${formatWon(stopLossPrice)}입니다. 현재가 ${formatWon(currentPrice)} 기준의 기계적 분할 전략 기준가입니다.`,
    };
  }

  function buildBuyStrategy(holding, pricePlan) {
    if (holding.action.score >= 72) {
      return `매수 전략: 성장성/뉴스/가격 신호가 우호적인 편입니다. 단번에 비중을 키우기보다 추천 매수가 ${formatWon(pricePlan.buyPrice)} 부근에서 1차, 2차 매수가 ${formatWon(pricePlan.addBuyPrice)} 부근에서 추가 분할 접근이 좋습니다.`;
    }

    if (holding.action.score >= 60) {
      return `매수 전략: 관심 매수 구간입니다. 추천 매수가 ${formatWon(pricePlan.buyPrice)}까지 기다렸다가 소액으로 시작하고, 뉴스와 실적 확인 후 2차 매수가 ${formatWon(pricePlan.addBuyPrice)}에서 추가 여부를 봅니다.`;
    }

    if (holding.action.score >= 45) {
      return `매수 전략: 지금은 보유 관찰이 우선입니다. 신규 매수는 추천 매수가 ${formatWon(pricePlan.buyPrice)} 아래로 충분히 눌리거나 성장성 점수가 개선될 때만 검토합니다.`;
    }

    return '매수 전략: 현재 점수에서는 신규 매수보다 리스크 확인이 먼저입니다. 가격이 싸 보여도 성장성/뉴스/손실 흐름이 개선되기 전까지는 관망을 우선합니다.';
  }

  function buildSellStrategy(holding, pricePlan) {
    if (holding.action.score <= 32) {
      return `매도 전략: 손실 또는 리스크 신호가 강합니다. 반등 시 추천 매도가 ${formatWon(pricePlan.sellPrice)} 부근에서 비중 축소를 우선 검토하고, 손절 기준 ${formatWon(pricePlan.stopLossPrice)} 이탈 시 방어적으로 대응합니다.`;
    }

    if (holding.weight >= 25 || holding.profitRate >= 45) {
      return `매도 전략: 수익률 또는 비중이 높아 포트폴리오 쏠림 관리가 필요합니다. 일부 매도 기준 ${formatWon(pricePlan.trimPrice)} 부근에서 1차 차익 실현, 추천 매도가 ${formatWon(pricePlan.sellPrice)} 부근에서 추가 매도를 검토합니다.`;
    }

    if (holding.action.score >= 60) {
      return `매도 전략: 매수 신호가 남아 있어 성급한 매도보다 추세 유지가 우선입니다. 다만 추천 매도가 ${formatWon(pricePlan.sellPrice)} 부근에서는 목표 수익 실현을 점검합니다.`;
    }

    return `매도 전략: 보유 구간입니다. 추천 매도가 ${formatWon(pricePlan.sellPrice)}에서는 일부 수익 실현을, 손절 기준 ${formatWon(pricePlan.stopLossPrice)} 이탈 시에는 손실 제한을 검토합니다.`;
  }

  function topicParticle(text) {
    const lastChar = String(text || '').trim().at(-1);
    if (!lastChar) return '는';

    const codePoint = lastChar.charCodeAt(0);
    if (codePoint < 0xac00 || codePoint > 0xd7a3) return '는';

    return (codePoint - 0xac00) % 28 === 0 ? '는' : '은';
  }

  function explainHoldingAction(input) {
    const holding = calculateHolding(input);
    const pricePlan = buildPricePlan(holding);
    const reasons = [
      `수익률 ${round(holding.profitRate, 2)}%: ${describeProfitRate(holding.profitRate)}`,
      `비중 ${round(holding.weight, 2)}%: ${describeWeight(holding.weight)}`,
      `뉴스 점수 ${holding.newsScore}: ${describeNews(holding.newsScore)}`,
      `성장성 점수 ${holding.growthScore}: ${describeGrowth(holding.growthScore)}`,
      `세부 신호는 모멘텀 ${Math.round(holding.signals.momentum)}점, 성장성 ${Math.round(holding.signals.growth)}점, 리스크 ${Math.round(holding.signals.risk)}점, 비중 ${Math.round(holding.signals.weight)}점입니다.`,
    ];

    return {
      summary: `${holding.name}${topicParticle(holding.name)} 현재 ${holding.action.score}점으로 '${holding.action.label}' 단계입니다. 점수 범위는 ${holding.action.range}%입니다.`,
      growth: `성장성 판단: ${describeGrowth(holding.growthScore)}`,
      buyStrategy: buildBuyStrategy(holding, pricePlan),
      sellStrategy: buildSellStrategy(holding, pricePlan),
      pricePlan,
      reasons,
    };
  }

  function summarizePortfolio(holdings) {
    const calculated = holdings.map(calculateHolding);
    const totalMarketValue = calculated.reduce((sum, item) => sum + item.marketValue, 0);
    const weightedProfit = totalMarketValue
      ? calculated.reduce((sum, item) => sum + item.profitRate * item.marketValue, 0) / totalMarketValue
      : 0;
    const topWeight = calculated.reduce((max, item) => Math.max(max, item.weight), 0);
    const averageActionScore = calculated.length
      ? calculated.reduce((sum, item) => sum + item.action.score, 0) / calculated.length
      : 50;
    const actionCounts = ACTION_BANDS.map((band) => ({
      label: band.label,
      tone: band.tone,
      count: calculated.filter((item) => item.action.label === band.label).length,
    }));

    return {
      holdings: calculated,
      totalMarketValue,
      weightedProfit: round(weightedProfit, 2),
      topWeight: round(topWeight, 2),
      averageAction: categorizeActionScore(averageActionScore),
      actionCounts,
    };
  }

  function normalizeShareUrl(pageUrl) {
    if (typeof pageUrl !== 'string' || !pageUrl.trim()) return '';

    try {
      const url = new URL(pageUrl);
      url.search = '';
      url.hash = '';
      return url.href;
    } catch (error) {
      return '';
    }
  }

  function formatSharePercent(value) {
    return `${round(value, 2).toLocaleString('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }

  function buildPortfolioSharePayload(holdings, pageUrl) {
    const summary = summarizePortfolio(holdings || []);
    const url = normalizeShareUrl(pageUrl);
    const hasHoldings = summary.holdings.length > 0;
    const title = '국내주식 코칭 대시보드';
    const description = hasHoldings
      ? `${summary.holdings.length}종목 점검 완료 · 평균 액션 ${summary.averageAction.label} · 가중 수익률 ${formatSharePercent(summary.weightedProfit)}`
      : 'MTS 이미지 업로드로 국내주식 코칭 대시보드를 만들어보세요.';
    const buttonTitle = hasHoldings ? '대시보드 보기' : '대시보드 만들기';
    const text = url
      ? `${description}\n${buttonTitle}: ${url}`
      : description;

    return {
      title,
      description,
      buttonTitle,
      url,
      text,
      kakaoTemplate: {
        objectType: 'text',
        text: description,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
        buttonTitle,
      },
    };
  }

  return {
    ACTION_BANDS,
    ACTION_LABELS,
    MAX_IMAGE_BYTES,
    SUPPORTED_IMAGE_TYPES,
    buildPortfolioSharePayload,
    calculateActionScore,
    calculateHolding,
    categorizeActionScore,
    explainHoldingAction,
    inferCurrentPrice,
    parseNumber,
    parseOcrText,
    summarizePortfolio,
    validateImageFilesMeta,
    validateImageFileMeta,
  };
});
