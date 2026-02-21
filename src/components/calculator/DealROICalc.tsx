import { useState } from 'react';
import { calculateIRR, buildDealCashFlows, calculateMOIC, calculateQualityScore, getExecutiveDecision, SCENARIO_MULTIPLIERS, type Scenario } from '@/utils/calculations';
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
}

export default function DealROICalc({ industry, country, onCountryChange, onSave }: Props) {
  const [purchasePrice, setPurchasePrice] = useState('');
  const [ebitda, setEbitda] = useState('');
  const [exitYears, setExitYears] = useState('');
  const [exitMultiple, setExitMultiple] = useState('');
  const [scenario, setScenario] = useState<Scenario>('base');
  const [baseVals, setBaseVals] = useState<{ multiple: number; ebitda: number } | null>(null);
  const [results, setResults] = useState<any>(null);

  const calculate = (overrideMultiple?: number, overrideEbitda?: number) => {
    const pp = parseNumericInput(purchasePrice);
    const eb = overrideEbitda ?? parseNumericInput(ebitda);
    const ey = parseInt(exitYears) || 0;
    const em = overrideMultiple ?? parseNumericInput(exitMultiple);
    if (pp <= 0 || eb <= 0 || ey <= 0 || em <= 0) { alert('Please enter valid positive values'); return; }

    const exitValue = eb * em;
    // FIXED: True IRR with interim cash flows
    const cashFlows = buildDealCashFlows(pp, eb, ey, em);
    const irr = calculateIRR(cashFlows);
    // FIXED: MOIC includes interim EBITDA distributions
    const moic = calculateMOIC(pp, eb, ey, exitValue);
    const cashReturn = ((exitValue + eb * ey - pp) / pp) * 100;
    const paybackPeriod = pp / eb;

    const ind = getIndustryData(industry, country);
    const qualityScore = calculateQualityScore({
      performanceVsBenchmark: irr / ind.peIRR,
      riskAdjusted: moic >= ind.peMOIC ? 0.8 : moic >= ind.peMOIC * 0.8 ? 0.5 : 0.2,
      timeEfficiency: paybackPeriod <= 3 ? 0.9 : paybackPeriod <= 5 ? 0.5 : 0.2,
    });
    const decision = getExecutiveDecision(qualityScore, 'deal');

    let analysis = '';
    if (irr >= ind.peIRR + 5 && moic >= ind.peMOIC + 0.5) {
      analysis = `This is a great deal. Every year you make ${irr.toFixed(1)}% on your money (true IRR including ${formatCurrency(eb, country)}/yr cash flow). Put in ${formatCurrency(100, country)}, walk away with ${formatCurrency(moic * 100, country)} total. Most people in ${ind.marketName} want ${ind.peIRR}%, so you're beating the bar. ${ind.context}`;
    } else if (irr >= ind.peIRR) {
      analysis = `This deal is solid. You make ${irr.toFixed(1)}% per year (IRR), hitting the ${ind.peIRR}% target. Total return of ${moic.toFixed(1)}x your money including annual cash flows. Takes about ${paybackPeriod.toFixed(1)} years to break even on operations alone. ${ind.context}`;
    } else if (irr >= ind.peIRR - 5) {
      analysis = `This deal is weak. You only make ${irr.toFixed(1)}% per year when you should be making at least ${ind.peIRR}%. Total return is ${moic.toFixed(1)}x. Takes ${paybackPeriod.toFixed(1)} years to break even. ${ind.context}`;
    } else {
      analysis = `Skip this deal. You're only making ${irr.toFixed(1)}% per year when ${ind.peIRR}% is the minimum. Total return of just ${moic.toFixed(1)}x doesn't justify the risk. ${ind.context}`;
    }

    setResults({ irr, moic, exitValue, cashReturn, paybackPeriod, qualityScore, decision, analysis, ind, eb, ey });
  };

  const switchScenario = (s: Scenario) => {
    const bm = baseVals?.multiple ?? parseNumericInput(exitMultiple);
    const be = baseVals?.ebitda ?? parseNumericInput(ebitda);
    if (!baseVals) setBaseVals({ multiple: bm, ebitda: be });
    const adjM = bm * SCENARIO_MULTIPLIERS[s].primary;
    const adjE = be * SCENARIO_MULTIPLIERS[s].secondary;
    setExitMultiple(adjM.toFixed(1));
    setEbitda(Math.round(adjE).toLocaleString());
    setScenario(s);
    calculate(adjM, adjE);
  };

  const resetToBase = () => {
    if (baseVals) { setExitMultiple(baseVals.multiple.toString()); setEbitda(baseVals.ebitda.toLocaleString()); setBaseVals(null); }
    setScenario('base');
    calculate(baseVals?.multiple, baseVals?.ebitda);
  };

  const exportMemo = () => {
    if (!results) return;
    downloadMemo(generateExportMemo({
      type: 'Deal ROI', inputs: { 'Purchase Price': purchasePrice, EBITDA: ebitda, 'Exit Years': exitYears, 'Exit Multiple': exitMultiple + 'x' },
      results: { 'IRR (True)': results.irr.toFixed(1) + '%', 'MOIC (incl. cash flows)': results.moic.toFixed(2) + 'x', 'Exit Value': formatCurrency(results.exitValue, country), 'Cash Return': results.cashReturn.toFixed(1) + '%' },
      qualityScore: results.qualityScore, decision: results.decision.label, analysis: results.analysis, industry, country, scenario,
    }));
  };

  return (
    <div className="glass-card">
      <h2 className="text-2xl font-semibold text-foreground mb-8 tracking-tight">Deal ROI Calculator</h2>
      <CalculatorInput label="How much are you buying it for?" value={purchasePrice} onChange={setPurchasePrice} prefix="$" formatCommas placeholder="50,000,000" />
      <CalculatorInput label="What's the annual profit (EBITDA)?" value={ebitda} onChange={setEbitda} prefix="$" formatCommas placeholder="6,250,000" />
      <CalculatorInput label="When do you plan to sell? (years)" value={exitYears} onChange={setExitYears} suffix="years" placeholder="5" />
      <CalculatorInput label="What multiple can you sell at?" value={exitMultiple} onChange={setExitMultiple} suffix="x EBITDA" placeholder="12" />
      <div className="flex justify-center mt-8">
        <button className="glass-btn" onClick={() => calculate()}>Calculate Returns</button>
      </div>

      {results && (
        <div className="mt-12 pt-12 border-t border-foreground/10 animate-[fadeIn_0.3s_ease]">
          <div className="flex gap-3 mb-6 flex-wrap items-center">
            {(['base', 'bull', 'bear'] as Scenario[]).map(s => (
              <button key={s} className={`scenario-btn ${scenario === s ? 'active' : ''}`} onClick={() => switchScenario(s)}>{SCENARIO_MULTIPLIERS[s].label}</button>
            ))}
            <div className="flex-1" />
            <CountrySelector value={country} onChange={(c) => { onCountryChange(c); setTimeout(() => calculate(), 50); }} />
          </div>

          <div className="mb-8">
            <div className="text-[15px] font-medium text-muted-foreground mb-2">Your Return (True IRR)</div>
            <div className="text-5xl font-bold text-foreground tracking-tight">{results.irr.toFixed(1)}%</div>
            <div className="text-lg font-medium text-muted-foreground mt-2">
              Total Return: {results.moic.toFixed(2)}x (incl. cash flows) • Exit Value: {formatCurrency(results.exitValue, country)}
            </div>
          </div>

          <div className="comparison-section">
            <h3 className="text-lg font-semibold text-foreground mb-5">Deal Quality</h3>
            <div className="metrics-ribbon">
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quality Score</div><div className="text-3xl font-bold text-foreground">{results.qualityScore}/10</div></div>
              <div className="liquid-glass-box"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Cash Return</div><div className="text-3xl font-bold text-foreground">{results.cashReturn.toFixed(0)}%</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Payback Period</div><div className="text-3xl font-bold text-foreground">{results.paybackPeriod.toFixed(1)} yrs</div></div>
            </div>

            <div className="flex justify-center items-stretch gap-4 mb-8">
              <div className={`executive-decision decision-${results.decision.type}`}>{results.decision.label}</div>
              <div className="quality-score-badge"><span className="text-2xl font-bold text-foreground">{results.qualityScore}</span><span className="text-xs text-muted-foreground uppercase tracking-wider">/ 10</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">IRR Target</div><div className="text-2xl font-bold text-foreground mb-1">{results.ind.peIRR}%+</div><div className="text-[11px] text-muted-foreground">PE hurdle rate in {results.ind.marketName}</div></div>
              <div className="liquid-glass-box p-4"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">MOIC Target</div><div className="text-2xl font-bold text-foreground mb-1">{results.ind.peMOIC}x+</div><div className="text-[11px] text-muted-foreground">Return multiple for {results.ind.marketName} buyouts</div></div>
            </div>

            <div className="flex gap-5">
              <div className="market-analysis-box">
                <div className="text-[13px] font-semibold text-foreground mb-3 tracking-wide">DEAL ECONOMICS</div>
                <div className="text-sm leading-relaxed text-foreground/80">{results.analysis}</div>
              </div>
              <RadarChart qualityScore={results.qualityScore} scores={[
                { label: 'Quality', value: Math.min(100, (results.irr / 30) * 100) },
                { label: 'Growth', value: Math.min(100, (results.irr / 25) * 100) },
                { label: 'Market', value: results.irr >= 20 ? 90 : results.irr >= 15 ? 70 : 50 },
                { label: 'Risk', value: results.irr >= 20 ? 80 : results.irr >= 15 ? 60 : 40 },
              ]} />
            </div>
          </div>

          <AIAnalysis
            calculatorType="Deal ROI"
            inputs={{ purchasePrice, ebitda, exitYears, exitMultiple }}
            results={{ irr: results.irr, moic: results.moic, exitValue: results.exitValue, cashReturn: results.cashReturn, paybackPeriod: results.paybackPeriod, qualityScore: results.qualityScore }}
            industry={industry} country={country}
          />

          <div className="flex gap-3 mt-4">
            <button className="export-btn" onClick={exportMemo}>Export Memo</button>
            <button className="export-btn" onClick={resetToBase}>Reset to Base</button>
            <button className="export-btn" onClick={() => onSave({ purchasePrice, ebitda, exitYears, exitMultiple }, `IRR: ${results.irr.toFixed(1)}% | MOIC: ${results.moic.toFixed(2)}x`)}>Save Deal</button>
          </div>
        </div>
      )}
    </div>
  );
}
