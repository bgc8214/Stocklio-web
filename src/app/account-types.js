export const accountTypeLabels = {
  direct_investment: "직접투자 계좌",
  pension: "연금 계좌",
};

export function normalizeAccountType(value) {
  return ["pension", "irp", "retirement_pension"].includes(String(value || "")) ? "pension" : "direct_investment";
}

export function formatAccountType(value) {
  return accountTypeLabels[normalizeAccountType(value)] || accountTypeLabels.direct_investment;
}
