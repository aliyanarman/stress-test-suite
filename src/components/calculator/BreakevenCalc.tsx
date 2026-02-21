import { useState } from 'react';
import { calculateBreakeven, calculateQualityScore, getExecutiveDecision } from '@/utils/calculations';
import { getIndustryData } from '@/utils/marketData';
import { formatCurrency, parseNumericInput } from '@/utils/formatters';
import CalculatorInput from './CalculatorInput';

// FIXED: Breakeven now includes industry context (was missing before)
interface Props { industry: string; country: string; }

export default function BreakevenCalc({ industry, country }: Props) {
  const [fixedCosts, setFixedCosts] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [results, setResults] = useState<any>(null);

  const calculate = () => {
    const fc = parseNumericInput(fixedCosts);
    const ppu = parseNumericInput(pricePerUnit);
    const cpu = parseNumericInput(costPerUnit);
    if (fc <= 0 || ppu <= 0 || cpu < 0) { alert('Please enter valid positive values'); return; }
    if (ppu <= cpu) { alert('Price per unit must be greater than cost per unit'); return; }

    const r = calculateBreakeven(fc, ppu, cpu);
    const ind = getIndustryData(industry, country);

    // FIXED: Standardized quality score for breakeven too
    const qualityScore = calculateQualityScore({
      performanceVsBenchmark: r.profitMargin / ind.avgMargin,
      riskAdjusted: r.profitMargin >= 30 ? 0.8 : r.profitMargin >= 15 ? 0.5 : 0.2,
      timeEfficiency: r.breakevenUnits <= 1000 ? 0.8 : r.breakevenUnits <= 5000 ? 0.5 : 0.2,
    });

    let analysis = '';
    // FIXED: Now includes industry context
    if (r.profitMargin >= 50) {
      analysis = `Your ${r.profitMargin.toFixed(0)}% margin is healthy. Each unit sold contributes ${formatCurrency(r.contribution, country)} toward covering your ${formatCurrency(fc, country)} monthly overhead. At ${r.breakevenUnits.toLocaleString()} units, you break even. Every unit beyond that is ${r.profitMargin.toFixed(0)}% profit. For ${ind.name} in ${ind.marketName}, the average margin is ${ind.avgMargin}% — you're well above that.`;
    } else if (r.profitMargin >= 30) {
      analysis = `With a ${r.profitMargin.toFixed(0)}% margin, you need ${r.breakevenUnits.toLocaleString()} monthly sales to cover ${formatCurrency(fc, country)} in fixed costs. Each unit adds ${formatCurrency(r.contribution, country)} to the bottom line. ${ind.name} in ${ind.marketName} averages ${ind.avgMargin}% margins — ${r.profitMargin >= ind.avgMargin ? 'you\'re above par' : 'you\'re slightly below industry average'}.`;
    } else if (r.profitMargin >= 15) {
      analysis = `Your ${r.profitMargin.toFixed(0)}% margin means tight unit economics. Breaking even at ${r.breakevenUnits.toLocaleString()} units requires consistent volume. The ${formatCurrency(r.contribution, country)} per-unit contribution leaves little room for discounting. Industry average in ${ind.marketName} ${ind.name} is ${ind.avgMargin}%.`;
    } else {
      analysis = `At ${r.profitMargin.toFixed(0)}%, margins are razor-thin. You need ${r.breakevenUnits.toLocaleString()} units just to cover ${formatCurrency(fc, country)} overhead. With only ${formatCurrency(r.contribution, country)} contribution per unit, small cost increases are dangerous. ${ind.name} in ${ind.marketName} typically runs ${ind.avgMargin}% margins. This model needs restructuring.`;
    }

    setResults({ ...r, qualityScore, analysis, ind });
  };

  return (
    <div className="glass-card">
      <h2 className="text-2xl font-semibold text-foreground mb-8 tracking-tight">Breakeven Calculator</h2>
      <CalculatorInput label="What are your fixed costs? (monthly)" value={fixedCosts} onChange={setFixedCosts} prefix="$" formatCommas placeholder="100,000" />
      <CalculatorInput label="What do you sell each unit for?" value={pricePerUnit} onChange={setPricePerUnit} prefix="$" formatCommas placeholder="50" />
      <CalculatorInput label="What does each unit cost you?" value={costPerUnit} onChange={setCostPerUnit} prefix="$" formatCommas placeholder="20" />
      <div className="flex justify-center mt-8">
        <button className="glass-btn" onClick={calculate}>Calculate Breakeven</button>
      </div>

      {results && (
        <div className="mt-12 pt-12 border-t border-foreground/10 animate-[fadeIn_0.3s_ease]">
          <div className="mb-8">
            <div className="text-[15px] font-medium text-muted-foreground mb-2">Units Needed to Breakeven</div>
            <div className="text-5xl font-bold text-foreground tracking-tight">{results.breakevenUnits.toLocaleString()}</div>
            <div className="text-lg font-medium text-muted-foreground mt-2">Revenue needed: {formatCurrency(results.breakevenRevenue, country)} per month</div>
          </div>

          <div className="comparison-section">
            <h3 className="text-lg font-semibold text-foreground mb-5">Business Economics</h3>
            <div className="metrics-ribbon">
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Profit Margin</div><div className="text-3xl font-bold text-foreground">{results.profitMargin.toFixed(1)}%</div></div>
              <div className="liquid-glass-box"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">At Volume</div><div className="text-3xl font-bold text-foreground">{results.breakevenUnits.toLocaleString()}</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Contribution/Unit</div><div className="text-3xl font-bold text-foreground">{formatCurrency(results.contribution, country)}</div></div>
            </div>

              <div className="flex justify-center items-stretch gap-3 mb-6">
                <div className={`executive-decision decision-${results.qualityScore >= 7 ? 'go' : results.qualityScore >= 4 ? 'caution' : 'pass'}`}>
                  {results.profitMargin >= 40 ? 'STRONG' : results.profitMargin >= 20 ? 'VIABLE' : 'WEAK'}
                </div>
                <div className="quality-score-badge"><span className="text-2xl font-bold text-foreground">{results.qualityScore}</span><span className="text-xs text-muted-foreground uppercase tracking-wider">/ 10</span></div>
              </div>

            {/* FIXED: Industry benchmark comparison for breakeven */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Margin</div><div className="text-2xl font-bold text-foreground mb-1">{results.profitMargin.toFixed(1)}%</div></div>
                <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Industry Avg</div><div className="text-2xl font-bold text-foreground mb-1">{results.ind.avgMargin}%</div><div className="text-[11px] text-muted-foreground">{results.ind.name} in {results.ind.marketName}</div></div>
              </div>

            <div className="market-analysis-box mt-6">
              <div className="text-[13px] font-semibold text-foreground mb-3 tracking-wide">ANALYSIS</div>
              <div className="text-sm leading-relaxed text-foreground/80">{results.analysis}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
