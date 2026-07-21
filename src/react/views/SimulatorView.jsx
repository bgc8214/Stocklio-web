import React, { useEffect, useMemo, useRef, useState } from "react";
import { SIMULATOR_PRESETS, SIMULATOR_SYMBOLS } from "../../app/simulator-presets.js";
import {
  calcMaxDrawdown,
  simulateDCA,
  simulateLumpSum,
  simulateLumpSumVsDCA,
  simulateMultiSymbol,
} from "../../domain/simulator-core.js";
import { SimulatorAnimatedChart } from "../../app/simulator-animated-chart.js";

const COMPARE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
const SPEED_DURATIONS = { 1: 30000, 2: 16000, 3: 10000, 4: 5000, 5: 2500 };
const FX_RATE_CACHE = { rate: null, ts: 0 };
const HISTORY_CACHE = new Map();

const isKrwSymbol = (symbol) => /\.(KS|KQ)$/i.test(symbol);

function formatKrw(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_0000_0000) {
    const uk = Math.floor(abs / 1_0000_0000);
    const man = Math.round((abs % 1_0000_0000) / 10_000);
    return `${sign}${uk.toLocaleString()}억${man > 0 ? ` ${man.toLocaleString()}만` : ""}원`;
  }
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000).toLocaleString()}만원`;
  return `${sign}${Math.round(abs).toLocaleString()}원`;
}
const formatPercent = (rate) => `${(rate * 100).toFixed(1)}%`;

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
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price > 0) { FX_RATE_CACHE.rate = price; FX_RATE_CACHE.ts = now; return price; }
  } catch { /* fall through */ }
  return FX_RATE_CACHE.rate || 1380;
}

const toNativeAmount = (amount, symbol, fxRate) => (isKrwSymbol(symbol) ? amount : amount / (fxRate || 1380));

function scaleResultToKrw(result, symbol, fxRate) {
  if (isKrwSymbol(symbol)) return result;
  const scale = fxRate || 1380;
  return {
    ...result,
    totalPrincipal: result.totalPrincipal * scale,
    finalValue: result.finalValue * scale,
    gain: result.gain * scale,
    points: result.points.map((p) => ({ date: p.date, principal: p.principal * scale, value: p.value * scale })),
  };
}

function checkResult(result) {
  if (!result.ok) throw new Error(result.error || "계산 결과가 없습니다.");
}

function computePartialStats(result, progress) {
  const points = result.points;
  const n = points.length;
  if (!n) return { principal: 0, value: 0, gain: 0, returnRate: 0, maxDrawdown: 0 };
  const idx = Math.max(0, Math.min(n - 1, Math.floor(progress * (n - 1))));
  const slice = points.slice(0, idx + 1);
  const { principal, value } = slice[idx];
  const gain = value - principal;
  return { principal, value, gain, returnRate: principal > 0 ? gain / principal : 0, maxDrawdown: calcMaxDrawdown(slice.map((p) => p.value)) };
}

export function SimulatorView() {
  const [presetId, setPresetId] = useState(SIMULATOR_PRESETS[0].id);
  const preset = SIMULATOR_PRESETS.find((p) => p.id === presetId) || SIMULATOR_PRESETS[0];
  const type = preset.type;

  const [symbol, setSymbol] = useState(preset.symbol || "QQQ");
  const [symbols, setSymbols] = useState(preset.symbols || []);
  const [invest, setInvest] = useState(preset.investAmount ?? 10_000_000);
  const [monthly, setMonthly] = useState(preset.monthlyAmount ?? 500_000);
  const [frequency, setFrequency] = useState(preset.frequency || "monthly");
  const [start, setStart] = useState(preset.start || "");
  const [end, setEnd] = useState(preset.end || "");

  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [chartTitle, setChartTitle] = useState("");
  const [comparisons, setComparisons] = useState(null); // [{label, result}]
  const [liveStats, setLiveStats] = useState(null); // index -> stats during animation
  const [speed, setSpeed] = useState(3);

  const containerRef = useRef(null);
  const chartRef = useRef(null);

  // 시나리오 탭 변경 시 프리셋 값으로 폼 리셋
  const applyPreset = (p) => {
    setPresetId(p.id);
    if (p.symbol) setSymbol(p.symbol);
    if (p.symbols) setSymbols(p.symbols);
    if (p.investAmount != null) setInvest(p.investAmount);
    if (p.monthlyAmount != null) setMonthly(p.monthlyAmount);
    if (p.frequency) setFrequency(p.frequency);
    if (p.start) setStart(p.start);
    if (p.end) setEnd(p.end);
    setComparisons(null);
    setLiveStats(null);
    setChartTitle("");
    setError("");
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
  };

  useEffect(() => () => { if (chartRef.current) chartRef.current.destroy(); }, []);

  const toggleSymbol = (sym) => {
    setSymbols((prev) => {
      if (prev.includes(sym)) return prev.filter((s) => s !== sym);
      if (prev.length >= 4) return prev;
      return [...prev, sym];
    });
  };

  const renderChart = (seriesList, title, actualStart, resultsList, isCompareMode) => {
    if (chartRef.current) chartRef.current.destroy();
    setChartTitle(title);
    const onProgress = (_date, _values, progress) => {
      if (!resultsList?.length) return;
      const next = resultsList.map(({ result }) => computePartialStats(result, progress));
      setLiveStats({ isCompareMode, stats: next });
    };
    const chart = new SimulatorAnimatedChart(containerRef.current, seriesList, { onProgress });
    chart.setDuration(SPEED_DURATIONS[speed] ?? 10000);
    chartRef.current = chart;
    chart.play();
  };

  const runSimulation = async () => {
    setError("");
    setRunning(true);
    try {
      const fxRate = await getFxRate();
      if (type === "multi") {
        if (!symbols.length) throw new Error("비교할 종목을 1개 이상 선택하세요.");
        const items = await Promise.all(symbols.map(async (sym) => ({
          symbol: sym,
          priceRows: await fetchHistory(sym, start, end),
          investAmount: toNativeAmount(invest, sym, fxRate),
        })));
        const rawResults = simulateMultiSymbol({ items, start, end });
        rawResults.forEach(({ result }) => checkResult(result));
        const scaled = rawResults.map(({ symbol: sym, result }) => ({ label: sym, result: scaleResultToKrw(result, sym, fxRate) }));
        setComparisons(scaled);
        const series = scaled.map(({ label, result }) => ({ label, points: result.points.map((p) => ({ date: p.date, value: p.value })) }));
        renderChart(series, `${symbols.join(" vs ")} · ${formatKrw(invest)} 일시 투자`, scaled[0].result.actualStart, scaled, true);
      } else if (type === "lumpsum_vs_dca") {
        const priceRows = await fetchHistory(symbol, start, end);
        const { lumpSum: rawLS, dca: rawDCA } = simulateLumpSumVsDCA({ priceRows, totalAmount: toNativeAmount(invest, symbol, fxRate), start, end, frequency });
        checkResult(rawLS); checkResult(rawDCA);
        const lumpSum = scaleResultToKrw(rawLS, symbol, fxRate);
        const dca = scaleResultToKrw(rawDCA, symbol, fxRate);
        const cmp = [{ label: "몰빵", result: lumpSum }, { label: "적립식", result: dca }];
        setComparisons(cmp);
        renderChart([
          { label: "원금", points: lumpSum.points.map((p) => ({ date: p.date, value: p.principal })), isPrincipal: true },
          { label: "몰빵", points: lumpSum.points.map((p) => ({ date: p.date, value: p.value })) },
          { label: "적립식", points: dca.points.map((p) => ({ date: p.date, value: p.value })) },
        ], `${symbol} · 몰빵 vs 적립식`, lumpSum.actualStart, cmp, true);
      } else if (type === "dca") {
        const priceRows = await fetchHistory(symbol, start, end);
        const raw = simulateDCA({ priceRows, monthlyAmount: toNativeAmount(monthly, symbol, fxRate), start, end, frequency });
        checkResult(raw);
        const result = scaleResultToKrw(raw, symbol, fxRate);
        setComparisons([{ label: symbol, result }]);
        renderChart([
          { label: "원금", points: result.points.map((p) => ({ date: p.date, value: p.principal })), isPrincipal: true },
          { label: symbol, points: result.points.map((p) => ({ date: p.date, value: p.value })) },
        ], `${symbol} · 월 ${formatKrw(monthly)} 적립식`, result.actualStart, [{ label: symbol, result }], false);
      } else {
        const priceRows = await fetchHistory(symbol, start, end);
        const raw = simulateLumpSum({ priceRows, investAmount: toNativeAmount(invest, symbol, fxRate), start, end });
        checkResult(raw);
        const result = scaleResultToKrw(raw, symbol, fxRate);
        setComparisons([{ label: symbol, result }]);
        renderChart([
          { label: "원금", points: result.points.map((p) => ({ date: p.date, value: p.principal })), isPrincipal: true },
          { label: symbol, points: result.points.map((p) => ({ date: p.date, value: p.value })) },
        ], `${symbol} · ${formatKrw(invest)} 일시 투자`, result.actualStart, [{ label: symbol, result }], false);
      }
    } catch (err) {
      setError(err.message || "시뮬레이션 중 오류가 발생했습니다.");
    } finally {
      setRunning(false);
    }
  };

  const changeSpeed = (level) => {
    setSpeed(level);
    chartRef.current?.setDuration(SPEED_DURATIONS[level] ?? 10000);
  };

  // 결과 카드에 표시할 값: 애니메이션 중이면 liveStats, 아니면 최종 result
  const cardStatsFor = (index) => {
    if (liveStats?.stats?.[index]) return liveStats.stats[index];
    const r = comparisons?.[index]?.result;
    return r ? { principal: r.totalPrincipal, value: r.finalValue, gain: r.gain, returnRate: r.returnRate, maxDrawdown: r.maxDrawdown } : null;
  };

  const single = comparisons && comparisons.length === 1;
  const singleStats = single ? cardStatsFor(0) : null;

  return (
    <section className="sim-view-section" data-view="simulator">
      <div className="sim-root">
        <div className="sim-scenario-tabs" role="tablist" aria-label="시나리오">
          {SIMULATOR_PRESETS.map((p) => (
            <button key={p.id} type="button" className={`sim-scenario-tab${p.id === presetId ? " active" : ""}`} onClick={() => applyPreset(p)}>{p.label}</button>
          ))}
        </div>
        <div className="sim-layout">
          <aside className="sim-panel">
            <form className="sim-form" autoComplete="off" onSubmit={(e) => { e.preventDefault(); runSimulation(); }}>
              <div className="sim-field"><span className="sim-label">{preset.label}</span></div>

              {type !== "multi" ? (
                <div className="sim-field">
                  <label className="sim-label" htmlFor="simSymbol">종목</label>
                  <select className="sim-select" id="simSymbol" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                    {SIMULATOR_SYMBOLS.map((s) => <option key={s.symbol} value={s.symbol}>{s.label}</option>)}
                  </select>
                </div>
              ) : (
                <div className="sim-field">
                  <label className="sim-label">비교 종목 (최대 4개)</label>
                  <div className="sim-chip-group">
                    {SIMULATOR_SYMBOLS.map((s) => (
                      <button key={s.symbol} type="button" className={`sim-chip${symbols.includes(s.symbol) ? " selected" : ""}`} onClick={() => toggleSymbol(s.symbol)}>{s.symbol}</button>
                    ))}
                  </div>
                </div>
              )}

              {type !== "dca" ? (
                <div className="sim-field">
                  <label className="sim-label" htmlFor="simInvest">투자금 (원)</label>
                  <input className="sim-input" type="text" inputMode="numeric" id="simInvest" autoComplete="off"
                    value={invest ? Number(invest).toLocaleString() : ""}
                    onChange={(e) => setInvest(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
                </div>
              ) : null}

              {type === "dca" ? (
                <div className="sim-field">
                  <label className="sim-label" htmlFor="simMonthly">월 적립금 (원)</label>
                  <input className="sim-input" type="text" inputMode="numeric" id="simMonthly" autoComplete="off"
                    value={monthly ? Number(monthly).toLocaleString() : ""}
                    onChange={(e) => setMonthly(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
                </div>
              ) : null}

              {["dca", "lumpsum_vs_dca"].includes(type) ? (
                <div className="sim-field">
                  <label className="sim-label" htmlFor="simFrequency">적립 주기</label>
                  <select className="sim-select" id="simFrequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                    <option value="monthly">매월</option>
                    <option value="weekly">매주</option>
                  </select>
                </div>
              ) : null}

              <div className="sim-field">
                <label className="sim-label" htmlFor="simStart">시작일</label>
                <input className="sim-input" type="date" id="simStart" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="sim-field">
                <label className="sim-label" htmlFor="simEnd">종료일</label>
                <input className="sim-input" type="date" id="simEnd" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>

              <button className="sim-run-btn" type="submit" disabled={running}>{running ? "데이터 불러오는 중..." : "시뮬레이션 실행"}</button>
            </form>
          </aside>

          <div className="sim-main">
            <div className="sim-result-area" hidden={!comparisons}>
              {single ? (
                <div className="sim-result-single">
                  <div className="sim-result-cards">
                    <Stat label="총 투자금" value={singleStats ? formatKrw(singleStats.principal) : "—"} />
                    <Stat label="최종 평가금액" value={singleStats ? formatKrw(singleStats.value) : "—"} />
                    <Stat label="수익" value={singleStats ? formatKrw(singleStats.gain) : "—"} tone={singleStats && singleStats.gain >= 0 ? "positive" : "negative"} />
                    <Stat label="수익률" value={singleStats ? formatPercent(singleStats.returnRate) : "—"} tone={singleStats && singleStats.returnRate >= 0 ? "positive" : "negative"} />
                    <Stat label="최대 낙폭" value={singleStats ? formatPercent(-singleStats.maxDrawdown) : "—"} tone="negative" />
                  </div>
                </div>
              ) : comparisons ? (
                <div className="sim-result-compare">
                  {comparisons.map(({ label }, i) => {
                    const st = cardStatsFor(i);
                    const color = COMPARE_COLORS[i % COMPARE_COLORS.length];
                    return (
                      <div className="sim-compare-row" key={label}>
                        <div className="sim-compare-label"><span className="sim-compare-dot" style={{ background: color }} /><strong>{label}</strong></div>
                        <div className="sim-result-cards">
                          <Stat label="총 투자금" value={st ? formatKrw(st.principal) : "—"} />
                          <Stat label="최종 평가금액" value={st ? formatKrw(st.value) : "—"} />
                          <Stat label="수익" value={st ? formatKrw(st.gain) : "—"} tone={st && st.gain >= 0 ? "positive" : "negative"} />
                          <Stat label="수익률" value={st ? formatPercent(st.returnRate) : "—"} tone={st && st.returnRate >= 0 ? "positive" : "negative"} />
                          <Stat label="최대 낙폭" value={st ? formatPercent(-st.maxDrawdown) : "—"} tone="negative" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="sim-chart-wrap">
              <div className="sim-chart-title">{chartTitle}</div>
              {/* 차트 컨테이너는 SimulatorAnimatedChart 가 imperative 하게 DOM 을 주입한다.
                  React 는 이 요소의 자식을 절대 렌더하지 않으며(항상 빈 채로 마운트 유지),
                  animation 중 onProgress→setState 재렌더가 일어나도 subtree 를 건드리지 않아 removeChild 충돌이 없다.
                  플레이스홀더는 컨테이너 밖 별도 형제로만 렌더한다. */}
              {!comparisons ? <div className="sim-placeholder"><span>시나리오를 설정하고 실행하세요</span></div> : null}
              <div className="sim-chart-container" ref={containerRef} />
              <div className="sim-chart-controls" hidden={!comparisons}>
                <div className="sim-speed-control">
                  <label className="sim-speed-label">🐢</label>
                  <input className="sim-speed-slider" type="range" min="1" max="5" value={speed} step="1" onChange={(e) => changeSpeed(Number(e.target.value))} />
                  <label className="sim-speed-label">🐇</label>
                </div>
                <button className="sim-ctrl-btn" type="button" onClick={() => chartRef.current?.replay()}>다시 재생</button>
              </div>
            </div>

            <div className="sim-disclaimer">
              조정종가 기준 · 배당과 분할은 가격 데이터에 반영된 범위 내에서 계산 · 세금·수수료 제외<br />
              과거 성과는 미래 수익을 보장하지 않습니다
            </div>

            {error ? <div className="sim-error">{error}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="sim-stat">
      <span className="sim-stat-label">{label}</span>
      <span className={`sim-stat-value${tone ? ` sim-stat-value--${tone}` : ""}`}>{value}</span>
    </div>
  );
}
