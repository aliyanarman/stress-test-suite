import { useState, useRef } from 'react';
import { calculatePaybackAnalysis, calculateQualityScore, getExecutiveDecision } from '@/utils/calculations';
import { getIndustryData } from '@/utils/marketData';
import { formatCurrency, parseNumericInput, generateExportMemo, downloadMemo } from '@/utils/formatters';
import CalculatorInput from './CalculatorInput';
import CountrySelector from './CountrySelector';
import AIAnalysis from './AIAnalysis';

interface Props {
  industry: string;
  country: string;
  onCountryChange: (c: string) => void;
  onCalculate?: () => void;
}

export default function PaybackCalc({ industry, country, onCountryChange, onCalculate }: Props) {
  const [investmentCost, setInvestmentCost] = useState('');
  const [annualSavings, setAnnualSavings] = useState('');
  const [results, setResults] = useState<any>(null);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const calculate = () => {
    const cost = parseNumericInput(investmentCost);
    const savings = parseNumericInput(annualSavings);
    if (cost <= 0 || savings <= 0) { alert('Please enter valid positive values'); return; }

    const ind = getIndustryData(industry, country);
    const r = calculatePaybackAnalysis(cost, savings, ind.avgInflation);

    const year3 = (savings * 3) - cost;
    const year5 = (savings * 5) - cost;

    const qualityScore = calculateQualityScore({
      performanceVsBenchmark: r.roi / 25,
      riskAdjusted: r.paybackYears <= 3 ? 0.9 : r.paybackYears <= 5 ? 0.5 : 0.2,
      timeEfficiency: r.paybackYears <= 2 ? 0.9 : r.paybackYears <= 4 ? 0.6 : 0.2,
    });
    const decision = getExecutiveDecision(qualityScore, 'payback');

    let recommendation: { cls: string; text: string; tooltip: string };
    if (r.paybackYears <= 2) {
      recommendation = { cls: 'status-excellent', text: 'Quick payback - Strong investment', tooltip: 'Rapid return on capital - low risk' };
    } else if (r.paybackYears <= 4) {
      recommendation = { cls: 'status-average', text: 'Moderate payback - Consider carefully', tooltip: 'Average payback period - standard risk' };
    } else {
      recommendation = { cls: 'status-poor', text: 'Long payback - High risk', tooltip: 'Extended recovery period - higher risk' };
    }

    setResults({ ...r, year3, year5, qualityScore, decision, recommendation, ind });
  };

  const handleCalculateClick = () => {
    calculate();
    onCalculate?.();
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  const exportMemo = () => {
    if (!results) return;
    downloadMemo(generateExportMemo({
      type: 'Payback Analysis',
      inputs: { 'Investment Cost': formatCurrency(parseNumericInput(investmentCost), country), 'Annual Savings/Earnings': formatCurrency(parseNumericInput(annualSavings), country) },
      results: { 'Payback Period': results.paybackYears < 1 ? `${(results.paybackYears * 12).toFixed(1)} months` : `${results.paybackYears.toFixed(1)} years`, 'Annual ROI': results.roi.toFixed(1) + '%', '3-Year Profit': formatCurrency(results.year3, country), '5-Year Profit': formatCurrency(results.year5, country), 'Real Value (Inflation-Adj)': formatCurrency(results.realCumulativeSavings, country) },
      qualityScore: results.qualityScore, decision: results.decision.label,
      analysis: `Investment of ${formatCurrency(parseNumericInput(investmentCost), country)} with ${formatCurrency(parseNumericInput(annualSavings), country)} annual returns. Payback in ${results.paybackYears.toFixed(1)} years. After inflation (${results.ind.avgInflation}%), real purchasing power retained: ${results.purchasingPowerRetained.toFixed(0)}%.`,
      aiAnalysis: aiAnalysisText,
      industry, country, scenario: 'base',
    }));
  };

  return (
    <div className="glass-card">
      <h2 className="text-2xl font-semibold text-foreground mb-8 tracking-tight">Investment Payback Calculator</h2>
      <CalculatorInput label="How much does this investment cost?" value={investmentCost} onChange={setInvestmentCost} prefix="$" formatCommas placeholder="2,000,000" />
      <CalculatorInput label="How much will you save/earn per year?" value={annualSavings} onChange={setAnnualSavings} prefix="$" formatCommas placeholder="600,000" />
      <div className="flex justify-center mt-8">
        <button className="glass-btn" onClick={handleCalculateClick}>Calculate Payback</button>
      </div>

      {results && (
        <div ref={resultsRef} className="mt-12 pt-12 border-t border-foreground/10 animate-[fadeIn_0.3s_ease]">
          <div className="flex gap-3 mb-6 justify-end">
            <CountrySelector value={country} onChange={(c) => { onCountryChange(c); setTimeout(() => calculate(), 50); }} />
          </div>

          <div className="mb-8">
            <div className="text-[15px] font-medium text-muted-foreground mb-2">Payback Period</div>
            <div className="text-5xl font-bold text-foreground tracking-tight">
              {results.paybackYears < 1 ? `${(results.paybackYears * 12).toFixed(1)} months` : `${results.paybackYears.toFixed(1)} years`}
            </div>
            <div className="text-lg font-medium text-muted-foreground mt-2">Annual ROI: {results.roi.toFixed(1)}%</div>
          </div>

          <div className="comparison-section">
            <h3 className="text-lg font-semibold text-foreground mb-5">5-Year Projection</h3>
            <div className="metrics-ribbon">
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">3-Year Profit</div><div className="text-3xl font-bold text-foreground">{formatCurrency(results.year3, country)}</div></div>
              <div className="liquid-glass-box"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">5-Year Profit</div><div className="text-3xl font-bold text-foreground">{formatCurrency(results.year5, country)}</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Annual Return</div><div className="text-3xl font-bold text-foreground">{results.roi.toFixed(1)}%</div></div>
            </div>
            <div className="mt-5 text-center">
              <span className={`inline-block px-4 py-2 rounded-lg text-xs font-semibold ${results.recommendation.cls}`}>{results.recommendation.text}</span>
              <div className="mt-2 text-[13px] text-muted-foreground">{results.recommendation.tooltip}</div>
            </div>
          </div>

          <div className="comparison-section">
            <h3 className="text-lg font-semibold text-foreground mb-5">Inflation-Adjusted Analysis</h3>
            <div className="metrics-ribbon">
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Inflation Rate</div><div className="text-3xl font-bold text-foreground">{results.ind.avgInflation.toFixed(1)}%</div></div>
              <div className="liquid-glass-box"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Real Value of Savings</div><div className="text-3xl font-bold text-foreground">{formatCurrency(results.realCumulativeSavings, country)}</div></div>
              <div className="text-center"><div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Purchasing Power</div><div className="text-3xl font-bold text-foreground">{results.purchasingPowerRetained.toFixed(0)}%</div></div>
            </div>

            <div className="market-analysis-box mt-6">
              <div className="text-[13px] font-semibold text-foreground mb-3 tracking-wide">VALUE ANALYSIS</div>
              <div className="text-sm leading-relaxed text-foreground/80">
                You invest {formatCurrency(parseNumericInput(investmentCost), country)}. Over {results.paybackYears.toFixed(1)} years, you earn back {formatCurrency(results.nominalTotal, country)} in nominal terms.
                <br /><br />
                But {results.ind.marketName} has {results.ind.avgInflation}% annual inflation. In today's purchasing power, those earnings are only worth {formatCurrency(results.realCumulativeSavings, country)} — you lose {formatCurrency(results.inflationLoss, country)} ({(100 - results.purchasingPowerRetained).toFixed(1)}%) to inflation eroding your returns.
                <br /><br />
                {results.ind.context}
              </div>
            </div>
          </div>

          <AIAnalysis
            calculatorType="Payback"
            inputs={{ investmentCost, annualSavings }}
            results={{ paybackYears: results.paybackYears, roi: results.roi, year3Profit: results.year3, year5Profit: results.year5, realCumulativeSavings: results.realCumulativeSavings, purchasingPowerRetained: results.purchasingPowerRetained, qualityScore: results.qualityScore }}
            industry={industry} country={country}
            onAnalysisComplete={setAiAnalysisText}
          />

          <div className="flex gap-3 mt-4">
            <button className="export-btn" onClick={exportMemo}>Export Memo</button>
          </div>
        </div>
      )}
    </div>
  );
}
