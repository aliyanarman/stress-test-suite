/**
 * Fixed financial calculations for Alight Investment Calculator.
 * Key fixes:
 * 1. IRR: True IRR using bisection method (was mislabeled CAGR)
 * 2. MOIC: Includes interim cash flows (was only exit value)
 * 3. Payback: No double-counting of principal
 * 4. Quality Score: Standardized methodology across all calculators
 * 5. Scenarios: Consistent multipliers
 */

// ═══════════════ IRR (True Internal Rate of Return) ═══════════════
// Uses bisection method - robust convergence for standard deal cash flows
// Cash flows: [-investment, +EBITDA, +EBITDA, ..., +EBITDA + exitValue]
export function calculateIRR(cashFlows: number[]): number {
  const npv = (rate: number): number =>
    cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);

  let low = -0.5;
  let high = 10.0; // 1000% max

  if (npv(low) < 0) return -50;
  if (npv(high) > 0) return high * 100;

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const val = npv(mid);
    if (Math.abs(val) < 0.01) return mid * 100;
    if (val > 0) low = mid;
    else high = mid;
  }
  return ((low + high) / 2) * 100;
}

// Build cash flow array for a leveraged deal
export function buildDealCashFlows(
  purchasePrice: number,
  annualEBITDA: number,
  exitYears: number,
  exitMultiple: number
): number[] {
  const flows: number[] = [-purchasePrice];
  for (let y = 1; y <= exitYears; y++) {
    const exitValue = y === exitYears ? annualEBITDA * exitMultiple : 0;
    flows.push(annualEBITDA + exitValue);
  }
  return flows;
}

// CAGR - what was previously mislabeled as IRR (kept for reference)
export function calculateCAGR(initial: number, final: number, years: number): number {
  if (initial <= 0 || years <= 0) return 0;
  return (Math.pow(final / initial, 1 / years) - 1) * 100;
}

// ═══════════════ MOIC (Multiple on Invested Capital) ═══════════════
// FIXED: Includes ALL distributions, not just exit value
export function calculateMOIC(
  purchasePrice: number,
  annualCashFlow: number,
  exitYears: number,
  exitValue: number
): number {
  const totalDistributions = annualCashFlow * exitYears + exitValue;
  return totalDistributions / purchasePrice;
}

// ═══════════════ Future Value ═══════════════
export function calculateFutureValue(
  currentValue: number,
  growthRate: number,
  years: number
): number {
  return currentValue * Math.pow(1 + growthRate / 100, years);
}

// ═══════════════ Breakeven ═══════════════
export interface BreakevenResult {
  breakevenUnits: number;
  breakevenRevenue: number;
  profitMargin: number;
  contribution: number;
}

export function calculateBreakeven(
  fixedCosts: number,
  pricePerUnit: number,
  costPerUnit: number
): BreakevenResult {
  const contribution = pricePerUnit - costPerUnit;
  if (contribution <= 0) {
    return { breakevenUnits: Infinity, breakevenRevenue: Infinity, profitMargin: 0, contribution };
  }
  const breakevenUnits = Math.ceil(fixedCosts / contribution);
  const breakevenRevenue = breakevenUnits * pricePerUnit;
  const profitMargin = (contribution / pricePerUnit) * 100;
  return { breakevenUnits, breakevenRevenue, profitMargin, contribution };
}

// ═══════════════ Payback Analysis (FIXED: no double-counting) ═══════════════
export interface PaybackResult {
  paybackYears: number;
  roi: number;
  realCumulativeSavings: number;
  nominalTotal: number;
  inflationLoss: number;
  purchasingPowerRetained: number;
}

export function calculatePaybackAnalysis(
  investmentCost: number,
  annualSavings: number,
  inflationRate: number
): PaybackResult {
  const paybackYears = investmentCost / annualSavings;
  const roi = (annualSavings / investmentCost) * 100;

  // Calculate real (inflation-adjusted) value of cumulative savings
  // Each year's savings is discounted by inflation to get present purchasing power
  let realCumulativeSavings = 0;
  const fullYears = Math.floor(paybackYears);
  const fraction = paybackYears - fullYears;

  for (let y = 1; y <= fullYears; y++) {
    realCumulativeSavings += annualSavings / Math.pow(1 + inflationRate / 100, y);
  }
  if (fraction > 0) {
    realCumulativeSavings += (annualSavings * fraction) / Math.pow(1 + inflationRate / 100, fullYears + 1);
  }

  const nominalTotal = annualSavings * paybackYears; // equals investmentCost
  const inflationLoss = nominalTotal - realCumulativeSavings;
  const purchasingPowerRetained = (realCumulativeSavings / nominalTotal) * 100;

  return { paybackYears, roi, realCumulativeSavings, nominalTotal, inflationLoss, purchasingPowerRetained };
}

// ═══════════════ Quality Score (STANDARDIZED) ═══════════════
// Same methodology across ALL calculators: performance, risk, time
export function calculateQualityScore(metrics: {
  performanceVsBenchmark: number; // ratio: actual/benchmark (>1 = outperforming)
  riskAdjusted: number;           // 0-1 scale
  timeEfficiency: number;         // 0-1 scale
}): number {
  let score = 5;

  // Performance vs benchmark (±3 points)
  const perf = metrics.performanceVsBenchmark;
  if (perf >= 1.5) score += 3;
  else if (perf >= 1.2) score += 2;
  else if (perf >= 1.0) score += 1;
  else if (perf >= 0.8) score -= 1;
  else score -= 2;

  // Risk-adjusted return (±1 point)
  if (metrics.riskAdjusted >= 0.7) score += 1;
  else if (metrics.riskAdjusted < 0.3) score -= 1;

  // Time efficiency (±1 point)
  if (metrics.timeEfficiency >= 0.7) score += 1;
  else if (metrics.timeEfficiency < 0.3) score -= 1;

  return Math.max(1, Math.min(10, score));
}

// ═══════════════ Executive Decision ═══════════════
export type DecisionType = 'go' | 'caution' | 'pass';

export interface Decision {
  label: string;
  type: DecisionType;
  description: string;
}

export function getExecutiveDecision(
  qualityScore: number,
  context: 'deal' | 'growth' | 'valuation' | 'payback' = 'deal'
): Decision {
  const labels: Record<string, Record<DecisionType, string>> = {
    deal: { go: 'GO', caution: 'CAUTION', pass: 'PASS' },
    growth: { go: 'OUTPERFORMER', caution: 'ON PACE', pass: 'LAGGING' },
    valuation: { go: 'PREMIUM', caution: 'FAIR VALUE', pass: 'UNDERPERFORMER' },
    payback: { go: 'QUICK WIN', caution: 'MODERATE', pass: 'SLOW BURN' },
  };

  const type: DecisionType = qualityScore >= 7 ? 'go' : qualityScore >= 4 ? 'caution' : 'pass';
  return {
    label: labels[context]?.[type] ?? labels.deal[type],
    type,
    description: type === 'go' ? 'Strong fundamentals' : type === 'caution' ? 'Review carefully' : 'Below threshold',
  };
}

// ═══════════════ Scenario Multipliers (CONSISTENT) ═══════════════
// Same ±30% for primary metric, ±15% for secondary across ALL calculators
export const SCENARIO_MULTIPLIERS = {
  base: { primary: 1.0, secondary: 1.0, label: 'Base' },
  bull: { primary: 1.30, secondary: 1.15, label: 'Bull +30%' },
  bear: { primary: 0.75, secondary: 0.85, label: 'Bear -25%' },
} as const;

export type Scenario = keyof typeof SCENARIO_MULTIPLIERS;
