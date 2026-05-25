/**
 * SVG 실시간 드로잉 차트
 *
 * 사용법:
 *   const chart = new SimulatorAnimatedChart(container, seriesList, { onProgress });
 *   chart.play();
 *
 * seriesList: [{ label, points: [{ date, value }], isPrincipal? }]
 *
 * onProgress(date, seriesValues):
 *   애니메이션 프레임마다 호출. seriesValues = [{ label, value }]
 */
export class SimulatorAnimatedChart {
  #container;
  #series;
  #onProgress;
  #svg = null;
  #raf = null;
  #startTs = null;
  #duration = 10000;
  #progress = 0;
  #playing = false;
  #unionDates = [];
  #paths = [];
  #dots = [];
  #labelEls = [];
  #dateLabel = null;
  #valueLabels = [];

  // 스케일 함수 — 호버에서도 재사용
  #xScale = null;
  #yScale = null;
  #PAD = null;
  #w = 0;
  #h = 0;
  #innerW = 0;

  // 호버 오버레이 요소들
  #crosshair = null;
  #hoverDots = [];
  #tooltip = null;
  #hoverActive = false;

  static COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
  static PRINCIPAL_COLOR = "rgba(156,163,175,0.6)";
  static PAD = { top: 52, right: 80, bottom: 40, left: 72 };

  constructor(container, series, { onProgress } = {}) {
    this.#container = container;
    this.#series = series;
    this.#onProgress = onProgress || null;
    this.#unionDates = buildUnionDates(series);
    this.#build();
  }

  play() {
    if (this.#playing) return;
    this.#hoverActive = false;
    this.#hideHover();
    this.#playing = true;
    this.#startTs = null;
    this.#progress = 0;
    // 끝점 라벨 숨기기
    this.#labelEls.forEach(({ el }) => el.setAttribute("opacity", "0"));
    this.#tick();
  }

  replay() {
    this.#playing = false;
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.play();
  }

  setDuration(ms) {
    this.#duration = ms;
  }

  destroy() {
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#container.innerHTML = "";
  }

  // ─── 빌드 ────────────────────────────────────────────────────────

  #build() {
    this.#container.innerHTML = "";
    const w = this.#container.clientWidth || 640;
    const h = Math.max(this.#container.clientHeight || 320, 280);
    const PAD = SimulatorAnimatedChart.PAD;
    const innerW = w - PAD.left - PAD.right;
    const innerH = h - PAD.top - PAD.bottom;

    this.#w = w;
    this.#h = h;
    this.#PAD = PAD;
    this.#innerW = innerW;

    const svg = createSVG(w, h);
    this.#svg = svg;

    const allValues = this.#series.flatMap((s) => s.points.map((p) => p.value));
    const minVal = Math.min(...allValues) * 0.95;
    const maxVal = Math.max(...allValues) * 1.05;

    const xScale = (date) => {
      const idx = this.#unionDates.indexOf(date);
      const n = this.#unionDates.length - 1 || 1;
      return PAD.left + (idx / n) * innerW;
    };
    const yScale = (val) => {
      const ratio = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal);
      return PAD.top + innerH - ratio * innerH;
    };

    this.#xScale = xScale;
    this.#yScale = yScale;

    // 그리드 및 Y축 라벨
    drawGrid(svg, w, h, PAD, minVal, maxVal, innerH);
    // X축 날짜 라벨
    drawXAxis(svg, this.#unionDates, xScale, h, PAD);

    // 각 시리즈 path 생성
    this.#paths = [];
    this.#dots = [];
    this.#labelEls = [];
    this.#valueLabels = [];

    this.#series.forEach((series, i) => {
      const color = series.isPrincipal
        ? SimulatorAnimatedChart.PRINCIPAL_COLOR
        : SimulatorAnimatedChart.COLORS[i % SimulatorAnimatedChart.COLORS.length];

      const pts = series.points.map((p) => ({
        x: xScale(p.date), y: yScale(p.value), date: p.date, value: p.value,
      }));
      const d = pts.map((p, j) => `${j === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", series.isPrincipal ? "1.5" : "2.5");
      if (series.isPrincipal) {
        path.setAttribute("stroke-dasharray", "4 3");
      } else {
        path.setAttribute("stroke-dasharray", "1");
        path.setAttribute("stroke-dashoffset", "1");
      }
      svg.appendChild(path);

      path._pts = pts;
      path._color = color;
      this.#paths.push(path);

      if (!series.isPrincipal) {
        // 진행 점
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("r", "5");
        dot.setAttribute("fill", color);
        dot.setAttribute("stroke", "#fff");
        dot.setAttribute("stroke-width", "2");
        svg.appendChild(dot);
        this.#dots.push({ dot, pts, color });

        // 끝점 라벨
        const endLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        endLabel.setAttribute("font-size", "11");
        endLabel.setAttribute("fill", color);
        endLabel.setAttribute("font-weight", "bold");
        endLabel.setAttribute("opacity", "0");
        svg.appendChild(endLabel);
        this.#labelEls.push({ el: endLabel, pts, series });

        // 상단 진행 중 값 라벨
        const valLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valLabel.setAttribute("font-size", "13");
        valLabel.setAttribute("fill", color);
        valLabel.setAttribute("font-weight", "700");
        valLabel.setAttribute("text-anchor", "start");
        svg.appendChild(valLabel);
        this.#valueLabels.push({ el: valLabel, pts, series, color });
      }
    });

    // 진행 날짜 라벨 (상단 우측, 값 라벨 아래 줄)
    const dateLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    dateLabel.setAttribute("x", String(w - PAD.right));
    dateLabel.setAttribute("y", String(PAD.top - 14));
    dateLabel.setAttribute("text-anchor", "end");
    dateLabel.setAttribute("font-size", "12");
    dateLabel.setAttribute("fill", "#6b7280");
    svg.appendChild(dateLabel);
    this.#dateLabel = dateLabel;

    // 호버 요소들 생성 (초기에는 숨김)
    this.#buildHoverElements(svg, w, h, PAD);

    // svg를 DOM에 먼저 붙여야 getTotalLength()가 정확한 값을 반환한다.
    this.#container.appendChild(svg);

    // path 길이를 DOM 반영 후 재계산
    this.#paths.forEach((path, i) => {
      if (this.#series[i].isPrincipal) return;
      const len = path.getTotalLength ? path.getTotalLength() : 1000;
      if (len > 0) {
        path._totalLen = len;
        path.setAttribute("stroke-dasharray", String(len));
        path.setAttribute("stroke-dashoffset", String(len));
      }
    });

    // 마우스 이벤트 등록
    this.#bindHover(svg);
  }

  // ─── 호버 요소 생성 ───────────────────────────────────────────────

  #buildHoverElements(svg, w, h, PAD) {
    // 수직 crosshair
    const crosshair = document.createElementNS("http://www.w3.org/2000/svg", "line");
    crosshair.setAttribute("y1", String(PAD.top));
    crosshair.setAttribute("y2", String(h - PAD.bottom));
    crosshair.setAttribute("stroke", "#9ca3af");
    crosshair.setAttribute("stroke-width", "1");
    crosshair.setAttribute("stroke-dasharray", "3 2");
    crosshair.setAttribute("opacity", "0");
    svg.appendChild(crosshair);
    this.#crosshair = crosshair;

    // 시리즈별 호버 점
    this.#hoverDots = [];
    this.#series.forEach((s, i) => {
      if (s.isPrincipal) return;
      const color = SimulatorAnimatedChart.COLORS[i % SimulatorAnimatedChart.COLORS.length];
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("r", "5");
      dot.setAttribute("fill", color);
      dot.setAttribute("stroke", "#fff");
      dot.setAttribute("stroke-width", "2");
      dot.setAttribute("opacity", "0");
      svg.appendChild(dot);
      this.#hoverDots.push({ dot, series: s, seriesIdx: i });
    });

    // 툴팁 그룹
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("opacity", "0");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("rx", "6");
    bg.setAttribute("fill", "rgba(17,26,21,0.88)");
    g.appendChild(bg);
    svg.appendChild(g);
    this.#tooltip = { g, bg, lines: [] };

    // 투명 오버레이 (마우스 이벤트 캡처용)
    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    overlay.setAttribute("x", String(PAD.left));
    overlay.setAttribute("y", String(PAD.top));
    overlay.setAttribute("width", String(w - PAD.left - PAD.right));
    overlay.setAttribute("height", String(h - PAD.top - PAD.bottom));
    overlay.setAttribute("fill", "transparent");
    overlay.style.cursor = "crosshair";
    svg.appendChild(overlay);
    this._overlay = overlay;
  }

  #bindHover(svg) {
    const overlay = this._overlay;
    overlay.addEventListener("mousemove", (e) => {
      if (this.#playing) return;
      this.#hoverActive = true;
      const rect = svg.getBoundingClientRect();
      const svgX = (e.clientX - rect.left) * (this.#w / rect.width);
      this.#showHoverAt(svgX);
    });

    overlay.addEventListener("mouseleave", () => {
      this.#hideHover();
      this.#hoverActive = false;
    });
  }

  #showHoverAt(svgX) {
    const n = this.#unionDates.length;
    const PAD = this.#PAD;
    const innerW = this.#innerW;
    const ratio = Math.max(0, Math.min(1, (svgX - PAD.left) / innerW));
    const idx = Math.round(ratio * (n - 1));
    const date = this.#unionDates[idx];

    const x = PAD.left + (idx / (n - 1)) * innerW;

    // crosshair
    this.#crosshair.setAttribute("x1", String(x));
    this.#crosshair.setAttribute("x2", String(x));
    this.#crosshair.setAttribute("opacity", "1");

    // 시리즈별 호버 점
    const tooltipLines = [];
    this.#hoverDots.forEach(({ dot, series, seriesIdx }) => {
      const pts = this.#paths[seriesIdx]._pts;
      if (!pts) return;
      const pt = pts[Math.min(idx, pts.length - 1)];
      if (!pt) return;
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(pt.y));
      dot.setAttribute("opacity", "1");
      const color = SimulatorAnimatedChart.COLORS[seriesIdx % SimulatorAnimatedChart.COLORS.length];
      tooltipLines.push({ label: series.label, value: pt.value, color });
    });

    // 원금선 값도 포함
    const principalIdx = this.#series.findIndex((s) => s.isPrincipal);
    if (principalIdx >= 0) {
      const pts = this.#paths[principalIdx]?._pts;
      if (pts) {
        const pt = pts[Math.min(idx, pts.length - 1)];
        if (pt) tooltipLines.unshift({ label: "원금", value: pt.value, color: "#9ca3af" });
      }
    }

    this.#renderTooltip(x, date, tooltipLines);
  }

  #renderTooltip(anchorX, date, lines) {
    const { g, bg } = this.#tooltip;
    const PAD = this.#PAD;
    const w = this.#w;
    const LINE_H = 18;
    const PADDING = 10;
    const tooltipW = 140;
    const tooltipH = PADDING * 2 + LINE_H + lines.length * LINE_H;

    // 기존 텍스트 노드 제거
    [...g.querySelectorAll("text")].forEach((el) => el.remove());

    // 날짜 헤더
    const dateText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    dateText.setAttribute("font-size", "11");
    dateText.setAttribute("fill", "#d1fae5");
    dateText.setAttribute("font-weight", "700");
    g.appendChild(dateText);
    dateText.textContent = formatDateLabel(date);

    // 값 라인들
    lines.forEach(({ label, value, color }) => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("font-size", "11");
      t.setAttribute("fill", color === "#9ca3af" ? "#9ca3af" : "#fff");
      t.textContent = `${label}: ${formatValueShort(value)}`;
      g.appendChild(t);
    });

    // 툴팁 위치 계산 (오른쪽으로 붙이되 화면 밖이면 왼쪽)
    const flip = anchorX + tooltipW + 12 > w - PAD.right;
    const tx = flip ? anchorX - tooltipW - 8 : anchorX + 8;
    const ty = PAD.top + 8;

    bg.setAttribute("x", String(tx));
    bg.setAttribute("y", String(ty));
    bg.setAttribute("width", String(tooltipW));
    bg.setAttribute("height", String(tooltipH));

    dateText.setAttribute("x", String(tx + PADDING));
    dateText.setAttribute("y", String(ty + PADDING + 10));

    const textEls = [...g.querySelectorAll("text")].slice(1);
    textEls.forEach((el, i) => {
      el.setAttribute("x", String(tx + PADDING));
      el.setAttribute("y", String(ty + PADDING + 10 + LINE_H * (i + 1)));
    });

    g.setAttribute("opacity", "1");
  }

  #hideHover() {
    if (this.#crosshair) this.#crosshair.setAttribute("opacity", "0");
    this.#hoverDots.forEach(({ dot }) => dot.setAttribute("opacity", "0"));
    if (this.#tooltip) this.#tooltip.g.setAttribute("opacity", "0");
  }

  // ─── 애니메이션 루프 ──────────────────────────────────────────────

  #tick() {
    this.#raf = requestAnimationFrame((ts) => {
      if (!this.#startTs) this.#startTs = ts;
      const elapsed = ts - this.#startTs;

      // 마지막 10% 구간에서 속도 감소 (ease out)
      const rawProgress = Math.min(elapsed / this.#duration, 1);
      const progress = rawProgress < 0.9
        ? rawProgress / 0.9 * 0.9
        : 0.9 + easeOut((rawProgress - 0.9) / 0.1) * 0.1;

      this.#progress = Math.min(progress, 1);
      this.#render(this.#progress);

      if (this.#progress < 1) {
        this.#tick();
      } else {
        this.#playing = false;
        this.#onComplete();
      }
    });
  }

  #render(progress) {
    const n = this.#unionDates.length;
    const curIdx = Math.max(0, Math.min(n - 1, Math.floor(progress * (n - 1))));
    const curDate = this.#unionDates[curIdx];

    if (this.#dateLabel) this.#dateLabel.textContent = formatDateLabel(curDate);

    // path reveal
    this.#paths.forEach((path, i) => {
      if (this.#series[i].isPrincipal) return;
      const totalLen = path._totalLen || 1000;
      path.setAttribute("stroke-dashoffset", String(totalLen * (1 - progress)));
    });

    // 진행 점
    this.#dots.forEach(({ dot, pts }) => {
      const ptIdx = Math.max(0, Math.min(pts.length - 1, Math.floor(progress * (pts.length - 1))));
      const pt = pts[ptIdx];
      dot.setAttribute("cx", String(pt.x));
      dot.setAttribute("cy", String(pt.y));
    });

    // 상단 값 라벨 — 날짜 라벨(우측 ~90px)과 겹치지 않도록 가용 너비를 나눔
    const nonPrincipalCount = this.#valueLabels.length;
    const dateLabelReserve = 90;
    const availW = this.#w - this.#PAD.left - dateLabelReserve;
    const labelSlot = nonPrincipalCount > 1 ? Math.floor(availW / nonPrincipalCount) : availW;
    this.#valueLabels.forEach(({ el, pts, series }, i) => {
      const ptIdx = Math.max(0, Math.min(pts.length - 1, Math.floor(progress * (pts.length - 1))));
      const pt = pts[ptIdx];
      const x = this.#PAD.left + i * labelSlot;
      el.setAttribute("x", String(x));
      el.setAttribute("y", String(this.#PAD.top - 30));
      el.textContent = `${series.label}: ${formatValueShort(pt.value)}`;
    });

    // 외부 콜백 (결과 카드 카운트업용)
    if (this.#onProgress) {
      const seriesValues = this.#series
        .filter((s) => !s.isPrincipal)
        .map((s) => {
          const ptIdx = Math.max(0, Math.min(s.points.length - 1, Math.floor(progress * (s.points.length - 1))));
          return { label: s.label, value: s.points[ptIdx]?.value ?? 0 };
        });
      this.#onProgress(curDate, seriesValues);
    }
  }

  #onComplete() {
    // 진행 점 숨기기
    this.#dots.forEach(({ dot }) => {
      dot.setAttribute("r", "0");
    });

    // 끝점 라벨 표시
    this.#labelEls.forEach(({ el, pts }) => {
      const last = pts[pts.length - 1];
      el.setAttribute("x", String(last.x + 6));
      el.setAttribute("y", String(last.y + 4));
      el.setAttribute("opacity", "1");
      el.textContent = formatValueShort(last.value);
    });

    // 날짜 라벨 최종값으로 고정
    if (this.#dateLabel) {
      const lastDate = this.#unionDates[this.#unionDates.length - 1];
      this.#dateLabel.textContent = formatDateLabel(lastDate);
    }

    // 마지막 진행 중 값 라벨도 최종값으로
    this.#valueLabels.forEach(({ el, pts, series }) => {
      const last = pts[pts.length - 1];
      el.textContent = `${series.label}: ${formatValueShort(last.value)}`;
    });
  }
}

// ─── SVG 헬퍼 ─────────────────────────────────────────────────────

function createSVG(w, h) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(h));
  svg.style.overflow = "visible";
  return svg;
}

function drawGrid(svg, w, h, PAD, minVal, maxVal, innerH) {
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const val = minVal + ratio * (maxVal - minVal);
    const y = PAD.top + innerH - ratio * innerH;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(PAD.left));
    line.setAttribute("x2", String(w - PAD.right));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "#e5e7eb");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(PAD.left - 6));
    label.setAttribute("y", String(y + 4));
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", "#9ca3af");
    label.textContent = formatValueShort(val);
    svg.appendChild(label);
  }
}

function drawXAxis(svg, unionDates, xScale, h, PAD) {
  const n = unionDates.length;
  const maxLabels = 6;
  const step = Math.max(1, Math.floor(n / maxLabels));
  for (let i = 0; i < n; i += step) {
    const date = unionDates[i];
    const x = xScale(date);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(h - PAD.bottom + 14));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", "#9ca3af");
    label.textContent = date.slice(0, 7);
    svg.appendChild(label);
  }
}

// ─── 유틸 ─────────────────────────────────────────────────────────

function buildUnionDates(series) {
  const set = new Set();
  for (const s of series) {
    for (const p of s.points) set.add(p.date);
  }
  return [...set].sort();
}

function easeOut(t) {
  return 1 - (1 - t) * (1 - t);
}

function formatValueShort(val) {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1_0000_0000) {
    const uk = Math.floor(abs / 1_0000_0000);
    const man = Math.round((abs % 1_0000_0000) / 10_000);
    const manStr = man > 0 ? ` ${man.toLocaleString()}만` : "";
    return `${sign}${uk.toLocaleString()}억${manStr}`;
  }
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000).toLocaleString()}만`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

function formatDateLabel(date) {
  if (!date) return "";
  return date.slice(0, 7).replace("-", "년 ") + "월";
}
