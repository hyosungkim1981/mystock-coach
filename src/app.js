(function bootStockCoachApp() {
  const {
    ACTION_BANDS,
    buildPortfolioSharePayload,
    calculateHolding,
    explainHoldingAction,
    parseOcrText,
    summarizePortfolio,
    validateImageFilesMeta,
  } = window.StockCoach;

  const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const sampleText = [
    '삼성전자 005930 10주 71,200 73,400 +3.09% 18.4%',
    'SK하이닉스 000660 3주 182,000 178,500 -1.92% 12.1%',
    '현대차 005380 수량 5 평단가 244,000 현재가 252,000 수익률 3.28% 비중 9.2%',
    'NAVER 035420 4주 186,500 199,800 +7.13% 8.7%',
  ].join('\n');

  const moneyFormatter = new Intl.NumberFormat('ko-KR');
  const percentFormatter = new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let state = {
    holdings: [],
    imageUrls: [],
    selectedFiles: [],
    expandedHoldingId: '',
  };

  const elements = {
    addRowButton: document.getElementById('addRowButton'),
    averageAction: document.getElementById('averageAction'),
    actionBars: document.getElementById('actionBars'),
    dropZone: document.getElementById('dropZone'),
    emptyState: document.getElementById('emptyState'),
    holdingCount: document.getElementById('holdingCount'),
    holdingsTable: document.getElementById('holdingsTable'),
    imageInput: document.getElementById('imageInput'),
    imagePreview: document.getElementById('imagePreview'),
    ocrStatus: document.getElementById('ocrStatus'),
    ocrText: document.getElementById('ocrText'),
    parseTextButton: document.getElementById('parseTextButton'),
    pickImageButton: document.getElementById('pickImageButton'),
    previewGrid: document.getElementById('previewGrid'),
    previewShell: document.getElementById('previewShell'),
    resetButton: document.getElementById('resetButton'),
    runOcrButton: document.getElementById('runOcrButton'),
    sampleButton: document.getElementById('sampleButton'),
    copyEntryLinkButton: document.getElementById('copyEntryLinkButton'),
    shareMessage: document.getElementById('shareMessage'),
    sharePreview: document.getElementById('sharePreview'),
    shareResultButton: document.getElementById('shareResultButton'),
    topWeight: document.getElementById('topWeight'),
    totalValue: document.getElementById('totalValue'),
    uploadMessage: document.getElementById('uploadMessage'),
    weightedProfit: document.getElementById('weightedProfit'),
  };

  function formatMoney(value) {
    return `${moneyFormatter.format(Math.round(value || 0))}원`;
  }

  function formatPercent(value) {
    return `${percentFormatter.format(value || 0)}%`;
  }

  function setMessage(message, isError) {
    elements.uploadMessage.textContent = message;
    elements.uploadMessage.classList.toggle('error', Boolean(isError));
  }

  function setStatus(message) {
    elements.ocrStatus.textContent = message;
  }

  function setShareMessage(message, isError) {
    elements.shareMessage.textContent = message;
    elements.shareMessage.classList.toggle('error', Boolean(isError));
  }

  function replaceState(nextState) {
    state = {
      ...state,
      ...nextState,
    };
    render();
  }

  function replaceHoldings(nextHoldings) {
    replaceState({
      holdings: nextHoldings.map(calculateHolding),
    });
  }

  function createInput(holding, field, type) {
    const input = document.createElement('input');
    input.type = type;
    input.value = holding[field];
    input.dataset.id = holding.id;
    input.dataset.field = field;
    input.setAttribute('aria-label', `${holding.name} ${field}`);

    if (type === 'number') {
      input.step = field === 'profitRate' || field === 'weight' ? '0.01' : '1';
    }

    return input;
  }

  function createTextCell(holding, field) {
    const cell = document.createElement('td');
    cell.appendChild(createInput(holding, field, 'text'));
    return cell;
  }

  function createNumberCell(holding, field) {
    const cell = document.createElement('td');
    cell.className = 'number-cell';
    cell.appendChild(createInput(holding, field, 'number'));
    return cell;
  }

  function createScoreSliderCell(holding, field, label) {
    const cell = document.createElement('td');
    const wrapper = document.createElement('div');
    const range = document.createElement('input');
    const value = document.createElement('output');

    wrapper.className = 'score-control';
    range.type = 'range';
    range.min = '-100';
    range.max = '100';
    range.step = '5';
    range.value = holding[field];
    range.dataset.id = holding.id;
    range.dataset.field = field;
    range.setAttribute('aria-label', `${holding.name} ${label} 점수`);
    value.textContent = holding[field];

    wrapper.append(range, value);
    cell.appendChild(wrapper);
    return cell;
  }

  function createBadgeCell(className, text) {
    const cell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = className;
    badge.textContent = text;
    cell.appendChild(badge);
    return cell;
  }

  function createDetailsCell(holding) {
    const cell = document.createElement('td');
    const button = document.createElement('button');
    button.className = 'details-button';
    button.type = 'button';
    button.textContent = '내용';
    button.dataset.detailsId = holding.id;
    button.setAttribute('aria-expanded', String(state.expandedHoldingId === holding.id));
    button.setAttribute('aria-label', `${holding.name} 점수 근거 보기`);
    cell.appendChild(button);
    return cell;
  }

  function createExplanationRow(holding) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const explanation = explainHoldingAction(holding);
    const wrapper = document.createElement('div');
    const summary = document.createElement('strong');
    const strategyGrid = document.createElement('div');
    const growth = document.createElement('p');
    const buyStrategy = document.createElement('p');
    const sellStrategy = document.createElement('p');
    const pricePlan = document.createElement('p');
    const list = document.createElement('ul');

    row.className = 'explanation-row';
    cell.colSpan = 14;
    wrapper.className = 'explanation-box';
    strategyGrid.className = 'strategy-grid';
    summary.textContent = explanation.summary;
    growth.textContent = explanation.growth;
    buyStrategy.textContent = explanation.buyStrategy;
    sellStrategy.textContent = explanation.sellStrategy;
    pricePlan.className = explanation.pricePlan.hasPrice ? 'price-plan' : 'price-plan muted-plan';
    pricePlan.textContent = explanation.pricePlan.text;

    explanation.reasons.forEach((reason) => {
      const item = document.createElement('li');
      item.textContent = reason;
      list.appendChild(item);
    });

    strategyGrid.append(growth, buyStrategy, sellStrategy, pricePlan);
    wrapper.append(summary, strategyGrid, list);
    cell.appendChild(wrapper);
    row.appendChild(cell);
    return row;
  }

  function createRemoveCell(holding) {
    const cell = document.createElement('td');
    const button = document.createElement('button');
    button.className = 'remove-button';
    button.type = 'button';
    button.textContent = '×';
    button.dataset.removeId = holding.id;
    button.setAttribute('aria-label', `${holding.name} 삭제`);
    cell.appendChild(button);
    return cell;
  }

  function renderHoldingsTable(holdings) {
    elements.holdingsTable.replaceChildren();
    elements.emptyState.classList.toggle('hidden', holdings.length > 0);

    holdings.forEach((holding) => {
      const row = document.createElement('tr');

      row.append(
        createTextCell(holding, 'name'),
        createBadgeCell('score-pill', `${holding.action.score}%`),
        createBadgeCell(`action-pill ${holding.action.tone}`, holding.action.label),
        createDetailsCell(holding),
        createTextCell(holding, 'ticker'),
        createNumberCell(holding, 'quantity'),
        createNumberCell(holding, 'avgPrice'),
        createNumberCell(holding, 'currentPrice'),
        createNumberCell(holding, 'profitRate'),
        createNumberCell(holding, 'weight'),
        createNumberCell(holding, 'marketValue'),
        createScoreSliderCell(holding, 'newsScore', '뉴스'),
        createScoreSliderCell(holding, 'growthScore', '성장성'),
        createRemoveCell(holding),
      );

      elements.holdingsTable.appendChild(row);
      if (state.expandedHoldingId === holding.id) {
        elements.holdingsTable.appendChild(createExplanationRow(holding));
      }
    });
  }

  function renderActionBars(summary) {
    const total = Math.max(summary.holdings.length, 1);
    elements.actionBars.replaceChildren();

    ACTION_BANDS.forEach((band) => {
      const count = summary.actionCounts.find((item) => item.label === band.label)?.count || 0;
      const row = document.createElement('div');
      const label = document.createElement('span');
      const track = document.createElement('div');
      const fill = document.createElement('div');
      const countNode = document.createElement('span');

      row.className = 'action-row';
      label.textContent = band.label;
      track.className = 'bar-track';
      fill.className = `bar-fill ${band.tone}`;
      fill.style.width = `${(count / total) * 100}%`;
      countNode.textContent = `${count}`;

      track.appendChild(fill);
      row.append(label, track, countNode);
      elements.actionBars.appendChild(row);
    });
  }

  function renderSharePanel(summary) {
    const payload = buildPortfolioSharePayload(summary.holdings, location.href);

    elements.sharePreview.textContent = payload.description;
    elements.shareResultButton.disabled = summary.holdings.length === 0;
  }

  function render() {
    const summary = summarizePortfolio(state.holdings);

    elements.totalValue.textContent = formatMoney(summary.totalMarketValue);
    elements.weightedProfit.textContent = formatPercent(summary.weightedProfit);
    elements.averageAction.textContent = summary.averageAction.label;
    elements.topWeight.textContent = formatPercent(summary.topWeight);
    elements.holdingCount.textContent = `${summary.holdings.length}종목`;

    renderActionBars(summary);
    renderHoldingsTable(summary.holdings);
    renderSharePanel(summary);
  }

  function updateHolding(id, field, value) {
    const numericFields = new Set([
      'quantity',
      'avgPrice',
      'currentPrice',
      'profitRate',
      'weight',
      'marketValue',
      'newsScore',
      'growthScore',
    ]);
    const nextHoldings = state.holdings.map((holding) => {
      if (holding.id !== id) return holding;

      return calculateHolding({
        ...holding,
        [field]: numericFields.has(field) ? Number(value) : value,
      });
    });

    replaceHoldings(nextHoldings);
  }

  function removeHolding(id) {
    replaceState({
      expandedHoldingId: state.expandedHoldingId === id ? '' : state.expandedHoldingId,
      holdings: state.holdings.filter((holding) => holding.id !== id).map(calculateHolding),
    });
  }

  function addEmptyHolding() {
    replaceHoldings([
      ...state.holdings,
      calculateHolding({
        name: '새 종목',
        ticker: '',
        quantity: 0,
        avgPrice: 0,
        currentPrice: 0,
        profitRate: 0,
        weight: 0,
        newsScore: 0,
        growthScore: 0,
      }),
    ]);
  }

  function parseTextToHoldings() {
    const holdings = parseOcrText(elements.ocrText.value);

    if (!holdings.length) {
      setMessage('인식된 종목이 없습니다. 텍스트를 보정하거나 행을 직접 추가해 주세요.', true);
      return;
    }

    replaceHoldings(holdings);
    const marketOnlyCount = holdings.filter(
      (holding) => holding.marketValue > 0 && holding.quantity === 0 && holding.avgPrice === 0,
    ).length;
    const suffix = marketOnlyCount
      ? ' 이 화면에는 수량/평단가가 없어 평가금액 기준으로 비중을 계산했습니다.'
      : '';

    setMessage(`${holdings.length}개 종목을 표로 변환했습니다.${suffix}`, false);
  }

  function loadSample() {
    elements.ocrText.value = sampleText;
    parseTextToHoldings();
  }

  function resetApp() {
    state.imageUrls.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));

    elements.imageInput.value = '';
    elements.ocrText.value = '';
    elements.previewGrid.replaceChildren();
    elements.previewShell.classList.remove('has-image');
    elements.runOcrButton.disabled = true;

    replaceState({
      holdings: [],
      imageUrls: [],
      selectedFiles: [],
      expandedHoldingId: '',
    });
    setStatus('대기');
    setMessage('', false);
    setShareMessage('', false);
  }

  function renderImagePreviews(files, imageUrls) {
    elements.previewGrid.replaceChildren();

    imageUrls.forEach((imageUrl, index) => {
      const figure = document.createElement('figure');
      const image = document.createElement('img');
      const caption = document.createElement('figcaption');

      figure.className = 'preview-item';
      image.src = imageUrl;
      image.alt = `${files[index].name} 미리보기`;
      caption.textContent = files[index].name;

      figure.append(image, caption);
      elements.previewGrid.appendChild(figure);
    });
  }

  function handleImageFiles(files) {
    const selectedFiles = Array.from(files || []);
    const validation = validateImageFilesMeta(selectedFiles);

    if (!validation.ok) {
      setMessage(validation.message, true);
      return;
    }

    state.imageUrls.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));

    const imageUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    renderImagePreviews(selectedFiles, imageUrls);
    elements.previewShell.classList.add('has-image');
    elements.runOcrButton.disabled = false;

    replaceState({
      imageUrls,
      selectedFiles,
    });
    setStatus('이미지 준비');
    setMessage(`${selectedFiles.length}개 이미지를 불러왔습니다.`, false);
  }

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);

    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${TESSERACT_CDN}"]`);

      if (existing) {
        existing.addEventListener('load', () => resolve(window.Tesseract), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = TESSERACT_CDN;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.addEventListener('load', () => resolve(window.Tesseract), { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  }

  async function runOcr() {
    if (!state.selectedFiles.length) {
      setMessage('먼저 이미지를 선택해 주세요.', true);
      return;
    }

    try {
      elements.runOcrButton.disabled = true;
      setStatus('OCR 준비');
      setMessage('OCR 엔진을 불러오는 중입니다.', false);

      const Tesseract = await loadTesseract();
      setStatus('OCR 실행 중');

      const texts = [];

      for (let index = 0; index < state.selectedFiles.length; index += 1) {
        const file = state.selectedFiles[index];
        const result = await Tesseract.recognize(file, 'kor+eng', {
          logger(event) {
            if (event.status === 'recognizing text') {
              const progress = Math.round(event.progress * 100);
              setStatus(`${index + 1}/${state.selectedFiles.length} ${progress}%`);
            }
          },
        });

        texts.push(`[${file.name}]\n${result.data.text.trim()}`);
      }

      elements.ocrText.value = texts.join('\n\n');
      setStatus('OCR 완료');
      setMessage(`${state.selectedFiles.length}개 이미지 OCR 결과를 합쳤습니다.`, false);

      if (elements.ocrText.value) {
        parseTextToHoldings();
      }
    } catch (error) {
      setStatus('OCR 실패');
      setMessage('OCR 엔진을 불러오지 못했습니다. 텍스트를 직접 붙여넣어 주세요.', true);
    } finally {
      elements.runOcrButton.disabled = false;
    }
  }

  function isLocalShareUrl(url) {
    return /^file:|^http:\/\/(127\.0\.0\.1|localhost)/.test(url);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  function getKakaoJavaScriptKey() {
    const config = window.StockCoachKakao || window.MYSTOCK_SHARE_CONFIG || {};
    return String(config.kakaoJavaScriptKey || '').trim();
  }

  function tryKakaoShare(payload) {
    const key = getKakaoJavaScriptKey();
    const Kakao = window.Kakao;

    if (!key || !Kakao?.Share?.sendDefault) return false;
    if (!Kakao.isInitialized?.()) Kakao.init(key);

    Kakao.Share.sendDefault(payload.kakaoTemplate);
    return true;
  }

  async function copyEntryLink() {
    const payload = buildPortfolioSharePayload([], location.href);

    try {
      await copyText(payload.text);
      setShareMessage(
        isLocalShareUrl(location.href)
          ? '방 공지 링크를 복사했습니다. 현재는 내 컴퓨터 주소라 배포 후 오픈채팅방에 고정하면 됩니다.'
          : '방 공지 링크를 복사했습니다.',
        false,
      );
    } catch (error) {
      setShareMessage('링크 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.', true);
    }
  }

  async function shareResult() {
    if (!state.holdings.length) {
      setShareMessage('종목을 먼저 표로 변환해 주세요.', true);
      return;
    }

    const payload = buildPortfolioSharePayload(state.holdings, location.href);

    try {
      if (tryKakaoShare(payload)) {
        setShareMessage('카카오톡 공유창을 열었습니다.', false);
        return;
      }

      if (navigator.share && payload.url) {
        await navigator.share({
          title: payload.title,
          text: payload.description,
          url: payload.url,
        });
        setShareMessage('공유창을 열었습니다.', false);
        return;
      }

      await copyText(payload.text);
      setShareMessage(
        isLocalShareUrl(location.href)
          ? '결과 요약을 복사했습니다. 현재 로컬 주소라 배포 후 카톡 공유용 링크로 사용할 수 있습니다.'
          : '결과 요약을 복사했습니다.',
        false,
      );
    } catch (error) {
      if (error?.name === 'AbortError') {
        setShareMessage('공유를 취소했습니다.', false);
        return;
      }

      setShareMessage('공유 준비 중 문제가 생겼습니다. 다시 시도해 주세요.', true);
    }
  }

  function bindEvents() {
    elements.pickImageButton.addEventListener('click', () => elements.imageInput.click());
    elements.imageInput.addEventListener('change', (event) => {
      if (event.target.files?.length) handleImageFiles(event.target.files);
    });
    elements.runOcrButton.addEventListener('click', runOcr);
    elements.parseTextButton.addEventListener('click', parseTextToHoldings);
    elements.sampleButton.addEventListener('click', loadSample);
    elements.addRowButton.addEventListener('click', addEmptyHolding);
    elements.resetButton.addEventListener('click', resetApp);
    elements.copyEntryLinkButton.addEventListener('click', copyEntryLink);
    elements.shareResultButton.addEventListener('click', shareResult);

    elements.dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      elements.dropZone.classList.add('dragging');
    });
    elements.dropZone.addEventListener('dragleave', () => {
      elements.dropZone.classList.remove('dragging');
    });
    elements.dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      elements.dropZone.classList.remove('dragging');
      if (event.dataTransfer.files?.length) handleImageFiles(event.dataTransfer.files);
    });

    elements.holdingsTable.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== 'range') return;
      updateHolding(target.dataset.id, target.dataset.field, target.value);
    });
    elements.holdingsTable.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      updateHolding(target.dataset.id, target.dataset.field, target.value);
    });
    elements.holdingsTable.addEventListener('click', (event) => {
      const detailsButton = event.target.closest('[data-details-id]');
      if (detailsButton) {
        replaceState({
          expandedHoldingId:
            state.expandedHoldingId === detailsButton.dataset.detailsId
              ? ''
              : detailsButton.dataset.detailsId,
        });
        return;
      }

      const button = event.target.closest('[data-remove-id]');
      if (!button) return;
      removeHolding(button.dataset.removeId);
    });
  }

  bindEvents();
  render();

  if (location.protocol === 'file:') {
    setMessage('이미지 OCR은 파일로 연 화면에서 제한될 수 있습니다. 인식이 안 되면 로컬 서버 주소로 열어 주세요.', false);
  }
})();
