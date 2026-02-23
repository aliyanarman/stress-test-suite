import { useState, useRef } from 'react';
import { calculateFutureValue, calculateQualityScore, getExecutiveDecision, SCENARIO_MULTIPLIERS, type Scenario } from '@/utils/calculations';
import { getIndustryData } from '@/utils/marketData';
import { formatCurrency, parseNumericInput, generateExportMemo, downloadMemo } from '@/utils/formatters';
import CalculatorInput from './CalculatorInput';
import RadarChart from './RadarChart';
import CountrySelector from './CountrySelector';
import AIAnalysis from './AIAnalysis';

interface Props {
  industry: string;
  country: string;
  onCountryChange: (c: string) => void;
  onSave: (data: Record<string, string>, result: string) => void;
  onCalculate?: () => void;
}

export default function FutureValueCalc({ industry, country, onCountryChange, onSave, onCalculate }: Props) {
  const [currentValue, setCurrentValue] = useState('');
  const [growthRate, setGrowthRate] = useState('');
  const [years, setYears] = useState('');
  const [scenario, setScenario] = useState<Scenario>('base');
  const [baseGrowth, setBaseGrowth] = useState<number | null>(null);
  const [results, setResults] = useState<any>(null);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const calculate = (overrideGrowth?: number) => {
    const cv = parseNumericInput(currentValue);
    const gr = overrideGrowth ?? parseNumericInput(growthRate);
    const yr = parseInt(years) || 0;
    if (cv <= 0 || yr <= 0) { alert('Please enter valid positive values'); return; }
    if (gr <= -100) { alert('Growth rate cannot be -100% or lower'); return; }

    const fv = calculateFutureValue(cv, gr, yr);
    const totalGrowth = fv - cv;
    const percentGrowth = ((fv - cv) / cv * 100);
    const ind = getIndustryData(industry, country);

    const qualityScore = calculateQualityScore({
      performanceVsBenchmark: gr / ind.avgGrowth,
      riskAdjusted: Math.min(1, gr / (ind.excellentGrowth * 1.2)),
      timeEfficiency: yr <= 5 ? 0.8 : yr <= 10 ? 0.5 : 0.3,
    });
    const decision = getExecutiveDecision(qualityScore, 'growth');

    const vsAvg = gr - ind.avgGrowth;
    let analysis = '';
    if (gr >= ind.excellentGrowth) {
      analysis = `Growing at ${gr.toFixed(1)}% per year beats most companies in ${ind.marketName} ${ind.name} (top players do ${ind.excellentGrowth}%). You're doing ${vsAvg.toFixed(1)} percentage points better than average.`;
    } else if (gr >= ind.goodGrowth) {
      analysis = `Your ${gr.toFixed(1)}% growth is above average in ${ind.marketName} ${ind.name} (average is ${ind.avgGrowth}%). The best companies grow at ${ind.excellentGrowth}%.`;
    } else if (gr >= ind.avgGrowth) {
      analysis = `${gr.toFixed(1)}% growth is at the ${ind.marketName} average (${ind.avgGrowth}%). Top companies grow ${ind.excellentGrowth}%. ${ind.context}`;
    } else {
      analysis = `Only growing ${gr.toFixed(1)}% per year? That's ${Math.abs(vsAvg).toFixed(1)} points below average for ${ind.marketName} ${ind.name} (${ind.avgGrowth}%). ${ind.context}`;
    }

    setResults({ fv, totalGrowth, percentGrowth, qualityScore, decision, analysis, ind, gr, yr });
  };

  const handleCalculateClick = () => {
    if (!baseGrowth) setBaseGrowth(null);
    calculate();
    onCalculate?.();
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  const switchScenario = (s: Scenario) => {
    const base = baseGrowth ?? parseNumericInput(growthRate);
    if (baseGrowth === null) setBaseGrowth(base);
    const adjusted = base * SCENARIO_MULTIPLIERS[s].primary;
    setGrowthRate(adjusted.toFixed(1));
    setScenario(s);
    calculate(adjusted);
  };

  const resetToBase = () => {
    if (baseGrowth !== null) { setGrowthRate(baseGrowth.toString()); setBaseGrowth(null); }
    setScenario('base');
    calculate(baseGrowth ?? undefined);
  };

  const exportMemo = () => {
    if (!results) return;
    const memo = generateExportMemo({
      type: 'Future Value',
      inputs: { 'Current Value': formatCurrency(parseNumericInput(currentValue), country), 'Growth Rate': growthRate + '%', 'Years': years },
      results: { 'Future Value': formatCurrency(results.fv, country), 'Total Growth': formatCurrency(results.totalGrowth, country), 'Percent Growth': results.percentGrowth.toFixed(1) + '%' },
      qualityScore: results.qualityScore, decision: results.decision.label, analysis: results.analysis,
      aiAnalysis: aiAnalysisText,
      industry, country, scenario,
    });
    downloadMemo(memo);
  };

  return (
    <div className="glass-card">
      <h2 className="text-2xl font-semibold text-foreground mb-8 tracking-tight">Future Value Calculator</h2>
      <CalculatorInput label="What's the current value?" value={currentValue} onChange={setCurrentValue} prefix="$" formatCommas placeholder="500,000" />
      <CalculatorInput label="What's the yearly growth rate?" value={growthRate} onChange={setGrowthRate} suffix="%" placeholder="5" />
      <CalculatorInput label="How many years from now?" value={years} onChange={setYears} suffix="years" placeholder="10" />
      <div className="flex justify-center mt-8">
        <button className="glass-btn" onClick={handleCalculateClick}>Calculate Future Value</button>
      </div>

      {results && (
        <div ref={resultsRef} className="mt-12 pt-12 border-t border-foreground/10 animate-[fadeIn_0.3s_ease]">
          <div className="flex gap-3 mb-6 flex-wrap items-center">
            {(['base', 'bull', 'bear'] as Scenario[]).map(s => (
              <button key={s} className={`scenario-btn ${scenario === s ? 'active' : ''}`} onClick={() => switchScenario(s)}>
                {SCENARIO_MULTIPLIERS[s].label}
              </button>
            ))}
            <div className="flex-1" />
            <CountrySelector value={country} onChange={(c) => { onCountryChange(c); setTimeout(() => calculate(), 50); }} />
          </div>

          <div className="mb-8">
            <div className="text-[15px] font-medium text-muted-foreground mb-2">Estimated Value in {results.yr} Years</div>
            <div className="text-5xl font-bold text-foreground tracking-tight">{formatCurrency(results.fv, country)}</div>
            <div className="text-lg font-medium text-muted-foreground mt-2">
              Total Growth: {formatCurrency(results.totalGrowth, country)} ({results.percentGrowth.toFixed(1)}%)
            </div>
          </div>

          <div className="comparison-section">
            <h3 className="text-lg font-semibold text-foreground mb-5">Industry Comparison</h3>
            <div className="metrics-ribbon">
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quality Score</div><div className="text-3xl font-bold text-foreground">{results.qualityScore}/10</div></div>
              <div className="liquid-glass-box"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Gain</div><div className="text-3xl font-bold text-foreground">{formatCurrency(results.totalGrowth, country)}</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Annual Growth</div><div className="text-3xl font-bold text-foreground">{results.gr.toFixed(1)}%</div><div className="text-[10px] text-muted-foreground mt-1">(Compound)</div></div>
            </div>

            <div className="flex justify-center items-stretch gap-3 mb-6">
              <div className={`executive-decision decision-${results.decision.type}`}>{results.decision.label}</div>
              <div className="quality-score-badge"><span className="text-2xl font-bold text-foreground">{results.qualityScore}</span><span className="text-xs text-muted-foreground uppercase tracking-wider">/ 10</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Average Growth</div><div className="text-2xl font-bold text-foreground mb-1">{results.ind.avgGrowth.toFixed(1)}%</div><div className="text-[11px] text-muted-foreground">Industry average in {results.ind.marketName}</div></div>
              <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Performers</div><div className="text-2xl font-bold text-foreground mb-1">{results.ind.excellentGrowth.toFixed(1)}%</div><div className="text-[11px] text-muted-foreground">Market leaders in {results.ind.name}</div></div>
            </div>

            <div className="flex gap-4 items-stretch">
              <div className="market-analysis-box">
                <div className="text-[13px] font-semibold text-foreground mb-3 tracking-wide">MARKET POSITIONING</div>
                <div className="text-sm leading-relaxed text-foreground/80">{results.analysis}</div>
              </div>
              <RadarChart qualityScore={results.qualityScore} scores={[
                { label: 'Quality', value: Math.min(100, (results.gr / 15) * 100) },
                { label: 'Growth', value: Math.min(100, (results.gr / 20) * 100) },
                { label: 'Market', value: Math.min(100, (results.gr / 12) * 100) },
                { label: 'Risk', value: results.gr <= 15 && results.gr >= 5 ? 75 : 60 },
              ]} />
            </div>
          </div>

          <AIAnalysis
            calculatorType="Future Value"
            inputs={{ currentValue, growthRate, years }}
            results={{ futureValue: results.fv, totalGrowth: results.totalGrowth, percentGrowth: results.percentGrowth, qualityScore: results.qualityScore, annualGrowth: results.gr }}
            industry={industry} country={country}
            onAnalysisComplete={setAiAnalysisText}
          />

          <div className="flex gap-3 mt-4">
            <button className="export-btn" onClick={exportMemo}>Export Memo</button>
            <button className="export-btn" onClick={resetToBase}>Reset to Base</button>
            <button className="export-btn" onClick={() => onSave({ currentValue, growthRate, years }, formatCurrency(results.fv, country))}>Save Deal</button>
          </div>
        </div>
      )}
    </div>
  );
}
