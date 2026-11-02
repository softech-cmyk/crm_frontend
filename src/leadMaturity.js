export const MATURITY_MONTHS = [3, 6, 9, 12];

// Maturity percentage implied by the expected closing timeframe.
export const MATURITY_PERCENT = { 3: 75, 6: 50, 9: 25, 12: 10 };

export function maturityLabel(months) {
  const pct = MATURITY_PERCENT[months];
  return pct == null ? "-" : `${months} months (${pct}%)`;
}
