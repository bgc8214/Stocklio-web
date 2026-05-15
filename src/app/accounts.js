import { normalizeAccountType } from "./account-types.js";

export function isUnclassifiedCash(cash) {
  return cash.currency === "KRW" && String(cash.account || "").includes("미분류");
}

export function normalizeAccounts(input, makeId) {
  const explicit = Array.isArray(input.accounts) ? input.accounts : [];
  const sourceState = {
    holdings: Array.isArray(input.holdings) ? input.holdings : [],
    cashBalances: Array.isArray(input.cashBalances) ? input.cashBalances : [],
  };
  const map = new Map();
  for (const account of [...deriveAccounts(sourceState, makeId), ...explicit]) {
    const key = `${account.investor}|||${account.account}`;
    map.set(key, {
      id: account.id || makeId(),
      investor: account.investor,
      account: account.account,
      provider: account.provider || inferProvider(account.account),
      accountType: normalizeAccountType(account.accountType),
      baseCurrency: account.baseCurrency || "KRW",
    });
  }
  return [...map.values()].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
}

export function deriveAccounts(sourceState, makeId) {
  const map = new Map();
  for (const holding of sourceState.holdings || []) {
    const key = `${holding.investor}|||${holding.account}`;
    map.set(key, {
      id: makeId(),
      investor: holding.investor,
      account: holding.account,
      provider: inferProvider(holding.account),
      accountType: normalizeAccountType(holding.accountType),
      baseCurrency: holding.currency || "KRW",
    });
  }
  for (const cash of sourceState.cashBalances || []) {
    if (isUnclassifiedCash(cash)) {
      continue;
    }
    const key = `${cash.investor}|||${cash.account}`;
    if (!map.has(key)) {
      map.set(key, {
        id: makeId(),
        investor: cash.investor,
        account: cash.account,
        provider: inferProvider(cash.account),
        accountType: "direct_investment",
        baseCurrency: cash.currency || "KRW",
      });
    }
  }
  return [...map.values()];
}

export function getKnownAccounts(state, makeId) {
  const map = new Map();
  for (const account of state.accounts || []) {
    const key = accountKeyFor(account);
    map.set(key, { ...account, key, accountType: normalizeAccountType(account.accountType) });
  }
  for (const holding of state.holdings || []) {
    const key = accountKeyFor(holding);
    if (!map.has(key)) {
      map.set(key, {
        key,
        id: makeId(),
        investor: holding.investor,
        account: holding.account,
        provider: inferProvider(holding.account),
        accountType: normalizeAccountType(holding.accountType),
        baseCurrency: holding.currency || "KRW",
      });
    }
  }
  for (const cash of state.cashBalances || []) {
    if (isUnclassifiedCash(cash)) {
      continue;
    }
    const key = accountKeyFor(cash);
    if (!map.has(key)) {
      map.set(key, { key, investor: cash.investor, account: cash.account, accountType: "direct_investment" });
    }
  }
  return [...map.values()].sort((a, b) => `${a.investor}${a.account}`.localeCompare(`${b.investor}${b.account}`));
}

export function parseAccountKey(value) {
  const [investor, account] = String(value || "").split("|||");
  return { investor: investor || "", account: account || "" };
}

export function accountKeyFor(item) {
  return `${item.investor}|||${item.account}`;
}

export function isAccountInUse(state, account) {
  return (state.holdings || []).some((holding) => isSameAccount(holding, account)) ||
    (state.cashBalances || []).some((cash) => isSameAccount(cash, account)) ||
    (state.cashFlows || []).some((flow) => isSameAccount(flow, account));
}

export function renameAccountReferences(state, previous, nextAccount) {
  const replace = (item) =>
    isSameAccount(item, previous)
      ? { ...item, investor: nextAccount.investor, account: nextAccount.account, accountType: item.accountType || nextAccount.accountType }
      : item;
  return {
    ...state,
    holdings: (state.holdings || []).map(replace),
    cashBalances: (state.cashBalances || []).map(replace),
    cashFlows: (state.cashFlows || []).map(replace),
  };
}

export function inferProvider(accountName = "") {
  return String(accountName).split(" ")[0] || "";
}

function isSameAccount(item, account) {
  return item.investor === account.investor && item.account === account.account;
}
