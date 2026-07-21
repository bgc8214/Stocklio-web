// React 뷰가 portfolio state 에서 파생값을 계산할 때 쓰는 순수 셀렉터 모음.
// legacy 의 순수 헬퍼(domain/portfolio-core, app/accounts, app/account-types)를 재사용한다.
import {
  getCashValueKrw as calcCashValueKrw,
  getHoldingValues as calcHoldingValues,
  getTotals as calcTotals,
} from "../../domain/portfolio-core.js";
import { accountKeyFor, getKnownAccounts as knownAccountsOf, isAccountInUse as accountInUse } from "../../app/accounts.js";

export function fxOf(state) {
  return Number(state?.fxRate?.rate || 1);
}

export function getTotals(state) {
  return calcTotals({
    holdings: state?.holdings || [],
    cashBalances: state?.cashBalances || [],
    fxRate: fxOf(state),
  });
}

export function holdingValues(state, holding) {
  return calcHoldingValues(holding, fxOf(state));
}

export function cashValueKrw(state, cash) {
  return calcCashValueKrw(cash, fxOf(state));
}

// React 는 makeId 를 crypto.randomUUID 로 직접 넘긴다(순수 파생용 임시 id).
const makeId = () => crypto.randomUUID();

export function getKnownAccounts(state) {
  return knownAccountsOf(state || { accounts: [], holdings: [], cashBalances: [] }, makeId);
}

export function isAccountInUse(state, account) {
  return accountInUse(state || {}, account);
}

import { formatAccountType } from "../../app/account-types.js";

// 자산 비중 집계(dashboard-view.getAllocationItems 이식). 전략/종목/계좌/투자자/계좌유형별.
function aggregateAllocationItems(items, limit = 5) {
  const sorted = [...items].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= limit) return sorted;
  const head = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((sum, item) => sum + item.value, 0);
  return rest > 0 ? [...head, { label: "기타", value: rest }] : head;
}

function groupHoldingsByResolver(state, resolver) {
  const fx = fxOf(state);
  const map = new Map();
  for (const holding of state?.holdings || []) {
    const label = resolver(holding) || "미분류";
    map.set(label, (map.get(label) || 0) + calcHoldingValues(holding, fx).valueKrw);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function addCashToAllocation(state, items, resolver) {
  const fx = fxOf(state);
  const map = new Map(items.map((item) => [item.label, item.value]));
  for (const cash of state?.cashBalances || []) {
    const label = resolver(cash) || "예수금";
    map.set(label, (map.get(label) || 0) + calcCashValueKrw(cash, fx));
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function getAllocationItems(state, dimension = "strategy") {
  if (dimension === "holding") {
    return aggregateAllocationItems(addCashToAllocation(state, groupHoldingsByResolver(state, (h) => h.name || h.ticker), () => "예수금"));
  }
  if (dimension === "account") {
    return aggregateAllocationItems(addCashToAllocation(state, groupHoldingsByResolver(state, (h) => `${h.investor} · ${h.account}`), (cash) => `${cash.investor} · ${cash.account}`));
  }
  if (dimension === "investor") {
    return aggregateAllocationItems(addCashToAllocation(state, groupHoldingsByResolver(state, (h) => h.investor), (cash) => cash.investor));
  }
  if (dimension === "accountType") {
    return aggregateAllocationItems(addCashToAllocation(state, groupHoldingsByResolver(state, (h) => formatAccountType(h.accountType)), () => "직접투자 계좌"));
  }
  return aggregateAllocationItems(addCashToAllocation(state, groupHoldingsByResolver(state, (h) => h.strategy || "기타"), () => "예수금"));
}

// 계좌별 집계(주식평가/예수금/현금흐름/손익/보유수). accounts-view.getAccountStats 이식.
export function getAccountStats(state) {
  const fx = fxOf(state);
  const empty = () => ({ stockValueKrw: 0, cashKrw: 0, flowsKrw: 0, gainKrw: 0, holdingCount: 0 });
  const stats = new Map();
  for (const account of getKnownAccounts(state)) {
    stats.set(account.key, empty());
  }
  for (const holding of state?.holdings || []) {
    const key = accountKeyFor(holding);
    const current = stats.get(key) || empty();
    const values = calcHoldingValues(holding, fx);
    current.stockValueKrw += values.valueKrw;
    current.gainKrw += values.gainKrw;
    current.holdingCount += 1;
    stats.set(key, current);
  }
  for (const cash of state?.cashBalances || []) {
    const key = accountKeyFor(cash);
    const current = stats.get(key) || empty();
    current.cashKrw += calcCashValueKrw(cash, fx);
    stats.set(key, current);
  }
  for (const flow of state?.cashFlows || []) {
    const key = accountKeyFor(flow);
    const current = stats.get(key) || empty();
    current.flowsKrw += Number(flow.amountKrw || 0);
    stats.set(key, current);
  }
  return stats;
}
