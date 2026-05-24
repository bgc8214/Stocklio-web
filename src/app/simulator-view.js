import { SIMULATOR_PRESETS, SIMULATOR_SYMBOLS } from "./simulator-presets.js";
import {
  simulateDCA,
  simulateLumpSum,
  simulateLumpSumVsDCA,
  simulateMultiSymbol,
} from "../domain/simulator-core.js";
import { SimulatorAnimatedChart } from "./simulator-animated-chart.js";

const FX_RATE_CACHE = { rate: null, ts: 0 };
const HISTORY_CACHE = new Map();

let chartInstance = null;

export function initSimulatorView() {
  const root = document.querySelector('[data-view="simulator"]');
  if (!root) return;

  root.innerHTML = buildShell();
  bindEvents(root);
  applyPreset(SIMULATOR_PRESETS[0], root);
}

// ─── HTML 구조 ────────────────────────────────────────────────────

function buildShell() {
  const scenarioTabs = SIMULATOR_PRESETS.map(
    (p) => `<button class="sim-scenario-tab${p.id === SIMULATOR_PRESETS[0].id ? " active" : ""}" data-preset-id="${p.id}" data-sim-type="${p.type}" type="button">${p.label}</button>`
  ).join("");

  const symbolOptions = SIMULATOR_SYMBOLS.map(
    (s) => `<option value="${s.symbol}">${s.label}</option>`
  ).join("");

  return `
<div class="sim-root">
  <div class="sim-scenario-tabs" role="tablist" aria-label="시나리오">
    ${scenarioTabs}
  </div>

  <div class="sim-layout">
    <aside class="sim-panel">
      <form class="sim-form" id="simForm" autocomplete="off">
        <input type="hidden" name="simType" id="simTypeHidden" value="lumpsum">
        <div class="sim-field" id="simFieldScenarioLabel">
          <span class="sim-label" id="simScenarioLabel">일시 투자</span>
        </div>

        <div class="sim-field" id="simFieldSymbol">
          <label class="sim-label" for="simSymbol">종목</label>
          <select class="sim-select" id="simSymbol" name="symbol">
            ${symbolOptions}
          </select>
        </div>

        <div class="sim-field" id="simFieldSymbols" hidden>
          <label class="sim-label">비교 종목 (최대 4개)</label>
          <div class="sim-chip-group" id="simSymbolsGroup">
            ${SIMULATOR_SYMBOLS.map((s) => `
              <button type="button" class="sim-chip" data-symbol="${s.symbol}">${s.symbol}</button>
            `).join("")}
          </div>
          <input type="hidden" id="simSymbolsHidden" name="symbolsHidden" value="">
        </div>

        <div class="sim-field" id="simFieldInvest">
          <label class="sim-label" for="simInvestAmount">투자금 (원)</label>
          <input class="sim-input" type="text" inputmode="numeric" id="simInvestAmount"
            name="investAmountText" value="10,000,000" autocomplete="off">
          <input type="hidden" id="simInvestHidden" name="investAmount" value="10000000">
        </div>

        <div class="sim-field" id="simFieldMonthly" hidden>
          <label class="sim-label" for="simMonthlyAmount">월 적립금 (원)</label>
          <input class="sim-input" type="text" inputmode="numeric" id="simMonthlyAmount"
            name="monthlyAmountText" value="500,000" autocomplete="off">
          <input type="hidden" id="simMonthlyHidden" name="monthlyAmount" value="500000">
        </div>

        <div class="sim-field" id="simFieldFrequency" hidden>
          <label class="sim-label" for="simFrequency">적립 주기</label>
          <select class="sim-select" id="simFrequency" name="frequency">
            <option value="monthly" selected>매월</option>
            <option value="weekly">매주</option>
          </select>
        </div>

        <div class="sim-field">
          <label class="sim-label" for="simStart">시작일</label>
          <input class="sim-input" type="date" id="simStart" name="start">
        </div>

        <div class="sim-field">
          <label class="sim-label" for="simEnd">종료일</label>
          <input class="sim-input" type="date" id="simEnd" name="end">
        </div>

        <button class="sim-run-btn" type="submit" id="simRunBtn">시뮬레이션 실행</button>
      </form>
    </aside>

    <div class="sim-main">
      <div class="sim-result-cards" id="simResultCards" hidden>
        <div class="sim-stat" id="simStatPrincipal">
          <span class="sim-stat-label">총 투자금</span>
          <span class="sim-stat-value" id="simValPrincipal">—</span>
        </div>
        <div class="sim-stat" id="simStatFinal">
          <span class="sim-stat-label">최종 평가금액</span>
          <span class="sim-stat-value" id="simValFinal">—</span>
        </div>
        <div class="sim-stat" id="simStatGain">
          <span class="sim-stat-label">수익</span>
          <span class="sim-stat-value" id="simValGain">—</span>
        </div>
        <div class="sim-stat" id="simStatReturn">
          <span class="sim-stat-label">수익률</span>
          <span class="sim-stat-value" id="simValReturn">—</span>
        </div>
        <div class="sim-stat" id="simStatMDD">
          <span class="sim-stat-label">최대 낙폭</span>
          <span class="sim-stat-value" id="simValMDD">—</span>
        </div>
      </div>

      <div class="sim-chart-wrap" id="simChartWrap">
        <div class="sim-chart-title" id="simChartTitle"></div>
        <div class="sim-chart-container" id="simChartContainer">
          <div class="sim-placeholder">
            <span>시나리오를 설정하고 실행하세요</span>
          </div>
        </div>
        <div class="sim-chart-controls" id="simChartControls" hidden>
          <button class="sim-ctrl-btn" id="simReplayBtn" type="button">다시 재생</button>
        </div>
      </div>

      <div class="sim-disclaimer">
        조정종가 기준 · 배당과 분할은 가격 데이터에 반영된 범위 내에서 계산 · 세금·수수료 제외<br>
        과거 성과는 미래 수익을 보장하지 않습니다
      </div>

      <div class="sim-error" id="simError" hidden></div>
    </div>
  </div>
</div>`;
}

// ─── 이벤트 바인딩 ────────────────────────────────────────────────

function bindEvents(root) {
  root.querySelectorAll(".sim-scenario-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = SIMULATOR_PRESETS.find((p) => p.id === btn.dataset.presetId);
      if (preset) applyPreset(preset, root);
    });
  });

  // 종목 칩 토글 (최대 4개)
  root.querySelector("#simSymbolsGroup").addEventListener("click", (e) => {
    const chip = e.target.closest(".sim-chip");
    if (!chip) return;
    const selected = [...root.querySelectorAll(".sim-chip.selected")];
    if (!chip.classList.contains("selected") && selected.length >= 4) return;
    chip.classList.toggle("selected");
    updateSymbolsHidden(root);
  });

  // 금액 입력 콤마 포맷
  bindAmountInput(root, "#simInvestAmount", "#simInvestHidden");
  bindAmountInput(root, "#simMonthlyAmount", "#simMonthlyHidden");

  const form = root.querySelector("#simForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runSimulation(root);
  });

  root.querySelector("#simReplayBtn").addEventListener("click", () => {
    chartInstance?.replay();
  });
}

function updateSymbolsHidden(root) {
  const symbols = [...root.querySelectorAll(".sim-chip.selected")].map((c) => c.dataset.symbol);
  root.querySelector("#simSymbolsHidden").value = symbols.join(",");
}

function bindAmountInput(root, inputSelector, hiddenSelector) {
  const input = root.querySelector(inputSelector);
  const hidden = root.querySelector(hiddenSelector);
  if (!input || !hidden) return;

  input.addEventListener("input", () => {
    const raw = input.value.replace(/[^0-9]/g, "");
    hidden.value = raw;
    const pos = input.selectionStart;
    const prevLen = input.value.length;
    input.value = raw ? Number(raw).toLocaleString() : "";
    // 커서 위치 보정
    const diff = input.value.length - prevLen;
    input.setSelectionRange(pos + diff, pos + diff);
  });

  input.addEventListener("focus", () => {
    input.select();
  });
}

function updateFieldVisibility(root, type) {
  root.querySelector("#simFieldSymbol").hidden = type === "multi";
  root.querySelector("#simFieldSymbols").hidden = type !== "multi";
  root.querySelector("#simFieldInvest").hidden = type === "dca";
  root.querySelector("#simFieldMonthly").hidden = type !== "dca";
  root.querySelector("#simFieldFrequency").hidden = !["dca", "lumpsum_vs_dca"].includes(type);
}

function applyPreset(preset, root) {
  // 시나리오 탭 활성화
  root.querySelectorAll(".sim-scenario-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.presetId === preset.id);
  });

  // hidden input으로 타입 전달
  root.querySelector("#simTypeHidden").value = preset.type;

  // 시나리오 라벨 업데이트
  const labelEl = root.querySelector("#simScenarioLabel");
  if (labelEl) labelEl.textContent = preset.label;

  updateFieldVisibility(root, preset.type);

  if (preset.symbol) root.querySelector("#simSymbol").value = preset.symbol;
  if (preset.frequency) root.querySelector("#simFrequency").value = preset.frequency;
  if (preset.start) root.querySelector("#simStart").value = preset.start;
  if (preset.end) root.querySelector("#simEnd").value = preset.end;

  if (preset.symbols) {
    root.querySelectorAll(".sim-chip").forEach((chip) => {
      chip.classList.toggle("selected", preset.symbols.includes(chip.dataset.symbol));
    });
    updateSymbolsHidden(root);
  }

  // 금액 입력 표시값 동기화
  if (preset.investAmount != null) {
    const inv = root.querySelector("#simInvestAmount");
    const invH = root.querySelector("#simInvestHidden");
    if (inv) inv.value = Number(preset.investAmount).toLocaleString();
    if (invH) invH.value = String(preset.investAmount);
  }
  if (preset.monthlyAmount != null) {
    const mon = root.querySelector("#simMonthlyAmount");
    const monH = root.querySelector("#simMonthlyHidden");
    if (mon) mon.value = Number(preset.monthlyAmount).toLocaleString();
    if (monH) monH.value = String(preset.monthlyAmount);
  }
}

// ─── 시뮬레이션 실행 ──────────────────────────────────────────────

async function runSimulation(root) {
  const btn = root.querySelector("#simRunBtn");
  const errorEl = root.querySelector("#simError");
  errorEl.hidden = true;
  btn.disabled = true;
  btn.textContent = "데이터 불러오는 중...";

  try {
    const params = readForm(root);
    const fxRate = await getFxRate();

    if (params.type === "multi") {
      await runMultiSimulation(params, root, fxRate);
    } else if (params.type === "lumpsum_vs_dca") {
      await runLumpSumVsDCA(params, root, fxRate);
    } else if (params.type === "dca") {
      await runDCA(params, root, fxRate);
    } else {
      await runLumpSum(params, root, fxRate);
    }
  } catch (err) {
    showError(root, err.message || "시뮬레이션 중 오류가 발생했습니다.");
  } finally {
    btn.disabled = false;
    btn.textContent = "시뮬레이션 실행";
  }
}

async function runLumpSum(params, root, fxRate) {
  const priceRows = await fetchHistory(params.symbol, params.start, params.end);
  const nativeAmount = toNativeAmount(params.investAmount, params.symbol, fxRate);
  const raw = simulateLumpSum({ priceRows, investAmount: nativeAmount, start: params.start, end: params.end });
  checkResult(raw);
  const result = scaleResultToKrw(raw, params.symbol, fxRate);

  const title = `${params.symbol} · ${formatKrw(params.investAmount)} 일시 투자`;
  showResultCards(root, result);
  renderChart(root, [
    { label: "원금", points: result.points.map((p) => ({ date: p.date, value: p.principal })), isPrincipal: true },
    { label: params.symbol, points: result.points.map((p) => ({ date: p.date, value: p.value })) },
  ], title, result.actualStart, result);
}

async function runDCA(params, root, fxRate) {
  const priceRows = await fetchHistory(params.symbol, params.start, params.end);
  const nativeMonthly = toNativeAmount(params.monthlyAmount, params.symbol, fxRate);
  const raw = simulateDCA({
    priceRows, monthlyAmount: nativeMonthly,
    start: params.start, end: params.end, frequency: params.frequency,
  });
  checkResult(raw);
  const result = scaleResultToKrw(raw, params.symbol, fxRate);

  const title = `${params.symbol} · 월 ${formatKrw(params.monthlyAmount)} 적립식`;
  showResultCards(root, result);
  renderChart(root, [
    { label: "원금", points: result.points.map((p) => ({ date: p.date, value: p.principal })), isPrincipal: true },
    { label: params.symbol, points: result.points.map((p) => ({ date: p.date, value: p.value })) },
  ], title, result.actualStart, result);
}

async function runLumpSumVsDCA(params, root, fxRate) {
  const priceRows = await fetchHistory(params.symbol, params.start, params.end);
  const nativeTotal = toNativeAmount(params.investAmount, params.symbol, fxRate);
  const { lumpSum: rawLS, dca: rawDCA } = simulateLumpSumVsDCA({
    priceRows, totalAmount: nativeTotal,
    start: params.start, end: params.end, frequency: params.frequency,
  });
  checkResult(rawLS);
  checkResult(rawDCA);
  const lumpSum = scaleResultToKrw(rawLS, params.symbol, fxRate);
  const dca = scaleResultToKrw(rawDCA, params.symbol, fxRate);

  showResultCards(root, lumpSum, null, [
    { label: "몰빵", result: lumpSum },
    { label: "적립식", result: dca },
  ]);

  const title = `${params.symbol} · 몰빵 vs 적립식`;
  renderChart(root, [
    { label: "원금", points: lumpSum.points.map((p) => ({ date: p.date, value: p.principal })), isPrincipal: true },
    { label: "몰빵", points: lumpSum.points.map((p) => ({ date: p.date, value: p.value })) },
    { label: "적립식", points: dca.points.map((p) => ({ date: p.date, value: p.value })) },
  ], title, lumpSum.actualStart, lumpSum);
}

async function runMultiSimulation(params, root, fxRate) {
  const symbols = params.symbols;
  if (!symbols.length) throw new Error("비교할 종목을 1개 이상 선택하세요.");
  const items = await Promise.all(
    symbols.map(async (sym) => ({
      symbol: sym,
      priceRows: await fetchHistory(sym, params.start, params.end),
      investAmount: toNativeAmount(params.investAmount, sym, fxRate),
    }))
  );
  const rawResults = simulateMultiSymbol({ items, start: params.start, end: params.end });
  rawResults.forEach(({ result }) => checkResult(result));

  const scaled = rawResults.map(({ symbol, result }) => ({
    symbol,
    result: scaleResultToKrw(result, symbol, fxRate),
  }));

  const primary = scaled[0].result;
  showResultCards(root, primary, null, scaled.map(({ symbol, result }) => ({ label: symbol, result })));

  const title = symbols.join(" vs ") + ` · ${formatKrw(params.investAmount)} 일시 투자`;
  const series = scaled.map(({ symbol, result }) => ({
    label: symbol,
    points: result.points.map((p) => ({ date: p.date, value: p.value })),
  }));
  renderChart(root, series, title, primary.actualStart, primary);
}

// ─── 결과 카드 ────────────────────────────────────────────────────

function showResultCards(root, primary, _unused = null, comparisons = null) {
  const cards = root.querySelector("#simResultCards");
  cards.hidden = false;

  const display = comparisons
    ? [...comparisons].sort((a, b) => b.result.finalValue - a.result.finalValue)[0].result
    : primary;

  setCard(root, "simValPrincipal", formatKrw(display.totalPrincipal));
  setCard(root, "simValFinal", formatKrw(display.finalValue));
  setCard(root, "simValGain", formatKrw(display.gain), display.gain >= 0 ? "positive" : "negative");
  setCard(root, "simValReturn", formatPercent(display.returnRate), display.returnRate >= 0 ? "positive" : "negative");
  setCard(root, "simValMDD", formatPercent(-display.maxDrawdown), "negative");
}

function setCard(root, id, text, modifier = "") {
  const el = root.querySelector(`#${id}`);
  if (!el) return;
  el.textContent = text;
  el.className = "sim-stat-value" + (modifier ? ` sim-stat-value--${modifier}` : "");
}

// ─── 차트 렌더 ────────────────────────────────────────────────────

function renderChart(root, seriesList, title, actualStart, finalResult) {
  const container = root.querySelector("#simChartContainer");
  const titleEl = root.querySelector("#simChartTitle");
  const controls = root.querySelector("#simChartControls");

  titleEl.textContent = title;
  if (actualStart) {
    titleEl.title = `실제 계산 시작일: ${actualStart}`;
  }
  controls.hidden = false;

  if (chartInstance) chartInstance.destroy();

  const onProgress = (date, seriesValues) => {
    // 애니메이션 진행 중: 현재 시점 평가금액으로 카드 업데이트
    const nonPrincipal = seriesValues.filter((s) => s.label !== "원금");
    if (!nonPrincipal.length || !finalResult) return;

    // 비교 모드: 가장 높은 현재값 기준
    const cur = nonPrincipal.reduce((a, b) => (a.value > b.value ? a : b));
    const principal = seriesValues.find((s) => s.label === "원금")?.value ?? finalResult.totalPrincipal;
    const curGain = cur.value - principal;
    const curReturn = principal > 0 ? curGain / principal : 0;

    setCard(root, "simValFinal", formatKrw(cur.value));
    setCard(root, "simValGain", formatKrw(curGain), curGain >= 0 ? "positive" : "negative");
    setCard(root, "simValReturn", formatPercent(curReturn), curReturn >= 0 ? "positive" : "negative");
  };

  chartInstance = new SimulatorAnimatedChart(container, seriesList, { onProgress });
  chartInstance.play();
}

// ─── API 호출 ─────────────────────────────────────────────────────

async function fetchHistory(symbol, start, end) {
  const key = `${symbol}|${start}|${end}`;
  if (HISTORY_CACHE.has(key)) return HISTORY_CACHE.get(key);

  const url = `/api/yahoo/history?symbol=${encodeURIComponent(symbol)}&start=${start}&end=${end}&interval=1mo`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `${symbol} 데이터를 불러올 수 없습니다.`);

  HISTORY_CACHE.set(key, data.rows || []);
  return data.rows || [];
}

async function getFxRate() {
  const now = Date.now();
  if (FX_RATE_CACHE.rate && now - FX_RATE_CACHE.ts < 3_600_000) return FX_RATE_CACHE.rate;

  try {
    const res = await fetch("/api/yahoo/chart?symbol=USDKRW=X");
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const price = result?.meta?.regularMarketPrice;
    if (price > 0) {
      FX_RATE_CACHE.rate = price;
      FX_RATE_CACHE.ts = now;
      return price;
    }
  } catch (_) {}
  return FX_RATE_CACHE.rate || 1380;
}

// ─── 유틸 ─────────────────────────────────────────────────────────

function readForm(root) {
  const f = root.querySelector("#simForm");
  const data = Object.fromEntries(new FormData(f));
  const symbolsHidden = data.symbolsHidden || "";
  const symbols = symbolsHidden ? symbolsHidden.split(",").filter(Boolean) : [];
  return {
    type: data.simType || "lumpsum",
    symbol: data.symbol || "QQQ",
    symbols,
    investAmount: Number(data.investAmount) || 10_000_000,
    monthlyAmount: Number(data.monthlyAmount) || 500_000,
    frequency: data.frequency || "monthly",
    start: data.start,
    end: data.end,
  };
}

function checkResult(result) {
  if (!result.ok) throw new Error(result.error || "계산 결과가 없습니다.");
}

// 입력 폼은 항상 KRW. USD 종목은 Yahoo 가격(달러)과 비교해야 하므로 달러로 변환한다.
function toNativeAmount(amount, symbol, fxRate) {
  return isKrwSymbol(symbol) ? amount : amount / (fxRate || 1380);
}

// 계산 결과(달러 기준)를 KRW 기준으로 스케일한다. 비율(returnRate, maxDrawdown)은 변환 불필요.
function scaleResultToKrw(result, symbol, fxRate) {
  if (isKrwSymbol(symbol)) return result;
  const scale = fxRate || 1380;
  return {
    ...result,
    totalPrincipal: result.totalPrincipal * scale,
    finalValue: result.finalValue * scale,
    gain: result.gain * scale,
    points: result.points.map((p) => ({
      date: p.date,
      principal: p.principal * scale,
      value: p.value * scale,
    })),
  };
}

function isKrwSymbol(symbol) {
  return /\.(KS|KQ)$/i.test(symbol);
}

function formatKrw(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_0000_0000) {
    const uk = Math.floor(abs / 1_0000_0000);
    const man = Math.round((abs % 1_0000_0000) / 10_000);
    const manStr = man > 0 ? ` ${man.toLocaleString()}만` : "";
    return `${sign}${uk.toLocaleString()}억${manStr}원`;
  }
  if (abs >= 10_000) {
    return `${sign}${Math.round(abs / 10_000).toLocaleString()}만원`;
  }
  return `${sign}${Math.round(abs).toLocaleString()}원`;
}

function formatPercent(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

function showError(root, message) {
  const el = root.querySelector("#simError");
  el.textContent = message;
  el.hidden = false;
}
