import { useState, useRef } from 'react';
import { calculateQualityScore, getExecutiveDecision } from '@/utils/calculations';
import { getIndustryData } from '@/utils/marketData';
import { formatCurrency, parseNumericInput, generateExportMemo, downloadMemo } from '@/utils/formatters';
import CalculatorInput from './CalculatorInput';
import RadarChart from './RadarChart';
import AIAnalysis from './AIAnalysis';
import CountrySelector from './CountrySelector';

interface Props {
  industry: string;
  country: string;
  onCountryChange: (c: string) => void;
  onSave: (data: Record<string, string>, result: string) => void;
  onCalculate?: () => void;
}

export default function ValuationCalc({ industry, country, onCountryChange, onSave, onCalculate }: Props) {
  const [revenue, setRevenue] = useState('');
  const [ebitda, setEbitda] = useState('');
  const [results, setResults] = useState<any>(null);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const calculate = () => {
    const rev = parseNumericInput(revenue);
    const eb = parseNumericInput(ebitda);
    if (rev <= 0 || eb <= 0) { alert('Please enter valid positive values'); return; }
    if (eb > rev) { alert('EBITDA cannot exceed revenue'); return; }

    const ind = getIndustryData(industry, country);
    const margin = (eb / rev) * 100;

    const valuationLow = eb * (ind.avgMultiple * 0.75);
    const valuationMid = eb * ind.avgMultiple;
    const valuationHigh = eb * (ind.avgMultiple * 1.35);
    const evToRevenue = valuationMid / rev;

    const qualityScore = calculateQualityScore({
      performanceVsBenchmark: margin / ind.avgMargin,
      riskAdjusted: evToRevenue >= 2 ? 0.8 : evToRevenue >= 1 ? 0.5 : 0.3,
      timeEfficiency: margin >= ind.avgMargin ? 0.7 : 0.4,
    });
    const decision = getExecutiveDecision(qualityScore, 'valuation');

    setResults({ valuationLow, valuationMid, valuationHigh, margin, evToRevenue, qualityScore, decision, ind });
  };

  const handleCalculateClick = () => {
    calculate();
    onCalculate?.();
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  const exportMemo = () => {
    if (!results) return;
    downloadMemo(generateExportMemo({
      type: 'Valuation', inputs: { Revenue: revenue, EBITDA: ebitda },
      results: { 'Conservative (25th %ile)': formatCurrency(results.valuationLow, country), 'Market Value (50th %ile)': formatCurrency(results.valuationMid, country), 'Optimistic (75th %ile)': formatCurrency(results.valuationHigh, country), 'EBITDA Margin': results.margin.toFixed(1) + '%', 'EV/Revenue': results.evToRevenue.toFixed(1) + 'x' },
      qualityScore: results.qualityScore, decision: results.decision.label,
      analysis: aiAnalysisText,
      aiAnalysis: aiAnalysisText,
      industry, country, scenario: 'base',
    }));
  };

  return (
    <div className="glass-card">
      <h2 className="text-2xl font-semibold text-foreground mb-8 tracking-tight">What's My Company Worth?</h2>
      <CalculatorInput label="What's your annual revenue?" value={revenue} onChange={setRevenue} prefix="$" formatCommas placeholder="10,000,000" />
      <CalculatorInput label="What's your annual profit (EBITDA)?" value={ebitda} onChange={setEbitda} prefix="$" formatCommas placeholder="2,500,000" />
      <div className="flex justify-center mt-8">
        <button className="glass-btn" onClick={handleCalculateClick}>Calculate Valuation</button>
      </div>

      {results && (
        <div ref={resultsRef} className="mt-12 pt-12 border-t border-foreground/10 animate-[fadeIn_0.3s_ease]">
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

            <div className="badge-row">
              <div className={`executive-decision decision-${results.decision.type}`}>{results.decision.label}</div>
              <div className="quality-score-badge"><span className="text-2xl font-bold text-foreground">{results.qualityScore}</span><span className="text-xs text-muted-foreground uppercase tracking-wider">/ 10</span></div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="liquid-glass-box p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Conservative</div>
                <div className="text-[10px] text-muted-foreground/70 mb-2">(25th %ile)</div>
                <div className="text-xl font-bold text-foreground">{formatCurrency(results.valuationLow, country)}</div>
              </div>
              <div className="liquid-glass-box p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Market Value</div>
                <div className="text-[10px] text-muted-foreground/70 mb-2">(50th %ile)</div>
                <div className="text-xl font-bold text-foreground">{formatCurrency(results.valuationMid, country)}</div>
              </div>
              <div className="liquid-glass-box p-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Optimistic</div>
                <div className="text-[10px] text-muted-foreground/70 mb-2">(75th %ile)</div>
                <div className="text-xl font-bold text-foreground">{formatCurrency(results.valuationHigh, country)}</div>
              </div>
            </div>

            <div className="flex gap-4 items-stretch">
              <div className="market-analysis-box">
                <div className="text-[13px] font-semibold text-foreground mb-3 tracking-wide">VALUATION ANALYSIS</div>
                <AIAnalysis
                  calculatorType="Valuation"
                  inputs={{ revenue, ebitda }}
                  results={{ valuationLow: results.valuationLow, valuationMid: results.valuationMid, valuationHigh: results.valuationHigh, margin: results.margin, evToRevenue: results.evToRevenue, qualityScore: results.qualityScore }}
                  industry={industry} country={country}
                  onAnalysisComplete={setAiAnalysisText}
                />
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
            <button className="export-btn" onClick={exportMemo}>Export Memo</button>
            <button className="export-btn" onClick={() => onSave({ revenue, ebitda }, formatCurrency(results.valuationMid, country))}>Save Deal</button>
          </div>
        </div>
      )}
    </div>
  );
}
