import { useState } from 'react';
import { calculateQualityScore, getExecutiveDecision } from '@/utils/calculations';
import { getIndustryData } from '@/utils/marketData';
import { formatCurrency, parseNumericInput, generateExportMemo, downloadMemo } from '@/utils/formatters';
import CalculatorInput from './CalculatorInput';
import RadarChart from './RadarChart';
import CountrySelector from './CountrySelector';

interface Props {
  industry: string;
  country: string;
  onCountryChange: (c: string) => void;
  onSave: (data: Record<string, string>, result: string) => void;
}

export default function ValuationCalc({ industry, country, onCountryChange, onSave }: Props) {
  const [revenue, setRevenue] = useState('');
  const [ebitda, setEbitda] = useState('');
  const [results, setResults] = useState<any>(null);

  const calculate = () => {
    const rev = parseNumericInput(revenue);
    const eb = parseNumericInput(ebitda);
    if (rev <= 0 || eb <= 0) { alert('Please enter valid positive values'); return; }
    if (eb > rev) { alert('EBITDA cannot exceed revenue'); return; }

    const ind = getIndustryData(industry, country);
    const margin = (eb / rev) * 100;

    // FIXED: Percentile-based valuation ranges instead of arbitrary -2/+3
    const valuationLow = eb * (ind.avgMultiple * 0.75);  // 25th percentile
    const valuationMid = eb * ind.avgMultiple;             // 50th percentile
    const valuationHigh = eb * (ind.avgMultiple * 1.35);   // 75th percentile
    const evToRevenue = valuationMid / rev;

    const qualityScore = calculateQualityScore({
      performanceVsBenchmark: margin / ind.avgMargin,
      riskAdjusted: evToRevenue >= 2 ? 0.8 : evToRevenue >= 1 ? 0.5 : 0.3,
      timeEfficiency: margin >= ind.avgMargin ? 0.7 : 0.4,
    });
    const decision = getExecutiveDecision(qualityScore, 'valuation');
    const vsAvg = margin - ind.avgMargin;

    let analysis = '';
    if (margin >= ind.avgMargin + 5) {
      analysis = `Your ${margin.toFixed(1)}% profit margin is well above average for ${ind.marketName} ${ind.name} (${ind.avgMargin}%). Buyers will pay a premium — around ${formatCurrency(valuationMid, country)} or more. You're running a tight ship.`;
    } else if (margin >= ind.avgMargin) {
      analysis = `${margin.toFixed(1)}% profit margin is about average for ${ind.marketName} ${ind.name} (${ind.avgMargin}%). Worth around ${formatCurrency(valuationMid, country)}. ${vsAvg > 0 ? 'Slightly better than average' : 'Right at average'} — improve margins and you'll get more when you sell.`;
    } else {
      analysis = `Your ${margin.toFixed(1)}% profit margin is below average for ${ind.marketName} ${ind.name} (they do ${ind.avgMargin}%). Worth about ${formatCurrency(valuationMid, country)}, but buyers will want a discount. Fix your margins before selling.`;
    }

    setResults({ valuationLow, valuationMid, valuationHigh, margin, evToRevenue, qualityScore, decision, analysis, ind });
  };

  return (
    <div className="glass-card">
      <h2 className="text-2xl font-semibold text-foreground mb-8 tracking-tight">What's My Company Worth?</h2>
      <CalculatorInput label="What's your annual revenue?" value={revenue} onChange={setRevenue} prefix="$" formatCommas placeholder="10,000,000" />
      <CalculatorInput label="What's your annual profit (EBITDA)?" value={ebitda} onChange={setEbitda} prefix="$" formatCommas placeholder="2,500,000" />
      <div className="flex justify-center mt-8">
        <button className="glass-btn" onClick={calculate}>Calculate Valuation</button>
      </div>

      {results && (
        <div className="mt-12 pt-12 border-t border-foreground/10 animate-[fadeIn_0.3s_ease]">
          <div className="flex gap-3 mb-6 justify-end">
            <CountrySelector value={country} onChange={(c) => { onCountryChange(c); setTimeout(() => calculate(), 50); }} />
          </div>

          <div className="mb-8">
            <div className="text-[15px] font-medium text-muted-foreground mb-2">Estimated Company Value</div>
            <div className="text-5xl font-bold text-foreground tracking-tight">{formatCurrency(results.valuationMid, country)}</div>
            <div className="text-lg font-medium text-muted-foreground mt-2">Based on {results.ind.name} industry multiples in {results.ind.marketName}</div>
          </div>

          <div className="comparison-section">
            <h3 className="text-lg font-semibold text-foreground mb-5">Valuation Analysis</h3>
            <div className="metrics-ribbon">
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quality Score</div><div className="text-3xl font-bold text-foreground">{results.qualityScore}/10</div></div>
              <div className="liquid-glass-box"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">EBITDA Margin</div><div className="text-3xl font-bold text-foreground">{results.margin.toFixed(1)}%</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">EV/Revenue</div><div className="text-3xl font-bold text-foreground">{results.evToRevenue.toFixed(1)}x</div></div>
            </div>

            <div className="flex justify-center items-stretch gap-4 mb-8">
              <div className={`executive-decision decision-${results.decision.type}`}>{results.decision.label}</div>
              <div className="quality-score-badge"><span className="text-2xl font-bold text-foreground">{results.qualityScore}</span><span className="text-xs text-muted-foreground uppercase tracking-wider">/ 10</span></div>
            </div>

            {/* FIXED: Valuation range with percentile-based methodology */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conservative (25th %ile)</div><div className="text-xl font-bold text-foreground">{formatCurrency(results.valuationLow, country)}</div></div>
              <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Market Value (50th)</div><div className="text-xl font-bold text-foreground">{formatCurrency(results.valuationMid, country)}</div></div>
              <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Optimistic (75th %ile)</div><div className="text-xl font-bold text-foreground">{formatCurrency(results.valuationHigh, country)}</div></div>
            </div>

            <div className="flex gap-5">
              <div className="market-analysis-box">
                <div className="text-[13px] font-semibold text-foreground mb-3 tracking-wide">VALUATION ANALYSIS</div>
                <div className="text-sm leading-relaxed text-foreground/80">{results.analysis}</div>
              </div>
              <RadarChart qualityScore={results.qualityScore} scores={[
                { label: 'Quality', value: Math.min(100, (results.margin / 35) * 100) },
                { label: 'Growth', value: Math.min(100, (results.margin / 30) * 100) },
                { label: 'Market', value: Math.min(100, (results.margin / 25) * 100) },
                { label: 'Risk', value: results.margin >= 20 ? 80 : 60 },
              ]} />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button className="export-btn" onClick={() => downloadMemo(generateExportMemo({
              type: 'Valuation', inputs: { Revenue: revenue, EBITDA: ebitda },
              results: { 'Conservative': formatCurrency(results.valuationLow, country), 'Market Value': formatCurrency(results.valuationMid, country), 'Optimistic': formatCurrency(results.valuationHigh, country), 'EBITDA Margin': results.margin.toFixed(1) + '%' },
              qualityScore: results.qualityScore, decision: results.decision.label, analysis: results.analysis, industry, country, scenario: 'base',
            }))}>Export Memo</button>
            <button className="export-btn" onClick={() => onSave({ revenue, ebitda }, formatCurrency(results.valuationMid, country))}>Save Deal</button>
          </div>
        </div>
      )}
    </div>
  );
}
