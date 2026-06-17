import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/app/stocklio-app.js';
let content = readFileSync(filePath, 'utf8');
let lines = content.split('\n');
console.log('Total lines before:', lines.length);

function findLineWith(pattern, startFrom = 0) {
  for (let i = startFrom; i < lines.length; i++) {
    if (lines[i].trim().match(pattern)) return i;
  }
  return -1;
}

// Collect ranges to remove (0-indexed, inclusive start, exclusive end)
const ranges = [];

function addRange(startPat, endPat, desc) {
  const s = findLineWith(startPat);
  const e = findLineWith(endPat, s + 1);
  if (s !== -1 && e !== -1) {
    ranges.push([s, e]);
    console.log(`Will remove: ${desc} (lines ${s+1}-${e})`);
  } else {
    console.log(`NOT FOUND: ${desc} s=${s+1} e=${e+1}`);
  }
}

// 1. notification funcs (automation-view)
addRange(/^async function loadNotificationState/, /^function normalizeState/, 'loadNotificationState..formatNotificationError');

// 2. renderFilters..accountOption (dashboard-view) — after render() function ends
addRange(/^function renderFilters\(\)/, /^function renderSummary\(\)/, 'renderFilters..accountOption');

// 3. renderSummary..renderDonut (dashboard-view)
addRange(/^function renderSummary\(\)/, /^function renderPerformance\(\)/, 'renderSummary..renderDonut');

// 4. renderPerformance..renderBreakdown (performance-view)
addRange(/^function renderPerformance\(\)/, /^function renderBreakdown\(\)/, 'renderPerformance..renderPriceRefreshImpact (but NOT renderBreakdown)');

// 5. renderBreakdown..renderAccounts (performance-view breakdown helpers)
addRange(/^function renderBreakdown\(\)/, /^function renderAccounts\(\)/, 'renderBreakdown..renderBreakdownFallback..renderPriceRefreshImpact');

// 6. renderSnapshots..renderHoldings (performance-view: snapshots/accounts/strategy)
addRange(/^function renderSnapshots\(\)/, /^function renderHoldings\(\)/, 'renderSnapshots..renderStrategyPerformance..breakdownRow etc');

// 7. renderHoldings..exportVisibleHoldings (holdings-view)
addRange(/^function renderHoldings\(\)/, /^function exportVisibleHoldings\(\)/, 'renderHoldings..TICKER_LOGO_COLORS..renderHoldingsSummaryView');

// 8. exportVisibleHoldings..exportPerformanceCsv
addRange(/^function exportVisibleHoldings\(\)/, /^function exportPerformanceCsv\(\)/, 'exportVisibleHoldings');

// 9. exportPerformanceCsv..copyPerformanceSummary
addRange(/^function exportPerformanceCsv\(\)/, /^function copyPerformanceSummary\(\)/, 'exportPerformanceCsv');

// 10. copyPerformanceSummary..renderHoldingEditRow
addRange(/^function copyPerformanceSummary\(\)/, /^function renderHoldingEditRow\(/, 'copyPerformanceSummary');

// 11. renderHoldingEditRow..holdingAccountTypeOptions..strategyOptions (holdings-view)
addRange(/^function renderHoldingEditRow\(/, /^function saveInlineCashBalanceEdit\(/, 'renderHoldingEditRow..strategyOptions');

// 12. saveInlineCashBalanceEdit..saveInlineCashFlowEdit..saveInlineHoldingEdit (cashflows/holdings)
addRange(/^function saveInlineCashBalanceEdit\(/, /^function renderCashBalances\(/, 'saveInlineCashBalanceEdit..saveInlineCashFlowEdit..saveInlineHoldingEdit');

// 13. renderCashBalances..startEditHolding (cashflows-view)
addRange(/^function renderCashBalances\(/, /^function startEditHolding\(/, 'renderCashBalances..renderCashFlowEditRow');

// 14. startEditHolding..openHoldingDrawer..closeHoldingDrawer (holdings-view)
addRange(/^function startEditHolding\(/, /^function startEditAccount\(/, 'startEditHolding..closeHoldingDrawer');

// 15. startEditCashFlow..startEditCashBalance (cashflows-view)
addRange(/^function startEditCashFlow\(/, /^function cancelEdit\(/, 'startEditCashFlow..startEditCashBalance');

// 16. queueTickerSearch..hideTickerSuggestions (holdings-view)
addRange(/^function queueTickerSearch\(\)/, /^function renderAutomation\(\)/, 'queueTickerSearch..hideTickerSuggestions');

// 17. renderAutomation..filteredHoldings (automation-view) but NOT cancelEdit/updateEditControls
addRange(/^function renderAutomation\(\)/, /^function filteredHoldings\(\)/, 'renderAutomation..renderReconciliation');

// 18. filteredHoldings (holdings-view)
addRange(/^function filteredHoldings\(\)/, /^async function saveTodaySnapshot\(/, 'filteredHoldings');

// 19. saveTodaySnapshot..queueAutomaticPriceRefresh..refreshPrices..addPriceLog..buildPriceRefreshImpact..getRecentPriceRefreshImpact (automation-view)
addRange(/^async function saveTodaySnapshot\(/, /^function groupByValue\(/, 'saveTodaySnapshot..getRecentPriceRefreshImpact');

// 20. groupByValue..getAllocationItems (dashboard-view)
addRange(/^function groupByValue\(/, /^function getDailyMoveRows\(\)/, 'groupByValue..getAllocationItems');

// 21. getDailyMoveRows, getHoldingDailyMove, getCurrentMarketContext (wrappers)
addRange(/^function getDailyMoveRows\(\)/, /^function groupByAccount\(/, 'getDailyMoveRows..getCurrentMarketContext');

// 22. groupByAccount..buildAccountSnapshots..getSnapshotRows..getFilteredSnapshotRows (wrappers)
addRange(/^function groupByAccount\(/, /^function renderTrendChart\(/, 'groupByAccount..getFilteredSnapshotRows');

// 23. renderTrendChart..getStrategyPerformanceRows (performance-view)
addRange(/^function renderTrendChart\(/, /^async function exportBackup\(/, 'renderTrendChart..getStrategyPerformanceRows');

// 24. exportBackup..commitImport (automation-view)
addRange(/^async function exportBackup\(/, /^function getNetInflowKrw\(/, 'exportBackup..commitImport');

// 25. getNetInflowKrw..formatFlowType (wrappers — cashflows/automation uses these)
addRange(/^function getNetInflowKrw\(/, /^function getTotals\(/, 'getNetInflowKrw..formatFlowType');

// Sort ranges descending so we can splice safely
ranges.sort((a, b) => b[0] - a[0]);

// Remove duplicates and overlaps
const cleanRanges = [];
let prev = [-1, -1];
for (const r of ranges) {
  if (r[0] >= prev[0] && r[0] < prev[1]) {
    // overlap — skip
    console.log(`Skipping overlapping range ${r[0]+1}-${r[1]}`);
  } else {
    cleanRanges.push(r);
    prev = r;
  }
}

for (const [s, e] of cleanRanges) {
  lines.splice(s, e - s);
}

writeFileSync(filePath, lines.join('\n'));
console.log('Total lines after:', lines.length);
