import { useState, useEffect, useCallback } from 'react';
import { INDUSTRIES } from '@/utils/marketData';
import FutureValueCalc from '@/components/calculator/FutureValueCalc';
import DealROICalc from '@/components/calculator/DealROICalc';
import BreakevenCalc from '@/components/calculator/BreakevenCalc';
import ValuationCalc from '@/components/calculator/ValuationCalc';
import PaybackCalc from '@/components/calculator/PaybackCalc';
import SavedDealsPanel, { type SavedDeal } from '@/components/calculator/SavedDealsPanel';

const CALC_TABS = [
  { id: 'futureValue', label: 'Future Value' },
  { id: 'dealROI', label: 'Deal ROI' },
  { id: 'breakeven', label: 'Breakeven' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'payback', label: 'Payback' },
];

export default function Index() {
  const [activeCalc, setActiveCalc] = useState('futureValue');
  const [industry, setIndustry] = useState('real-estate');
  // FIXED: Single source of truth for country (was split between auto-detect and per-calc selectors)
  const [country, setCountry] = useState('US');
  const [savedDeals, setSavedDeals] = useState<SavedDeal[]>(() => {
    try { return JSON.parse(localStorage.getItem('alight_saved_deals') || '[]'); } catch { return []; }
  });
  const [showSavedDeals, setShowSavedDeals] = useState(false);

  // Auto-detect country on mount
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const code = data.country_code;
        if (['US', 'PK', 'UK', 'AE'].includes(code)) setCountry(code);
        else if (code === 'GB') setCountry('UK');
      })
      .catch(() => {});
  }, []);

  const showNotification = (msg: string) => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;top:80px;right:20px;background:linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,240,240,0.95));color:#000;padding:16px 24px;border-radius:12px;font-size:14px;font-weight:510;box-shadow:0 8px 32px rgba(0,0,0,0.3);z-index:10000;backdrop-filter:blur(20px);animation:slideInNotif 0.3s ease;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const saveDeal = useCallback((type: string, data: Record<string, string>, result: string) => {
    const name = prompt('Name this deal:', `Deal - ${new Date().toLocaleDateString()}`);
    if (!name) return;
    const deal: SavedDeal = { id: Date.now(), name, type, industry, country, timestamp: new Date().toISOString(), data, result };
    const updated = [deal, ...savedDeals].slice(0, 50);
    setSavedDeals(updated);
    localStorage.setItem('alight_saved_deals', JSON.stringify(updated));
    showNotification(`✓ Saved: ${name}`);
  }, [savedDeals, industry, country]);

  const deleteDeal = (id: number) => {
    if (!confirm('Delete this deal?')) return;
    const updated = savedDeals.filter(d => d.id !== id);
    setSavedDeals(updated);
    localStorage.setItem('alight_saved_deals', JSON.stringify(updated));
    showNotification('Deal deleted');
  };

  const loadDeal = (deal: SavedDeal) => {
    setActiveCalc(deal.type);
    setIndustry(deal.industry);
    setCountry(deal.country);
    setShowSavedDeals(false);
    showNotification(`✓ Loaded: ${deal.name}`);
  };

  // Allow Enter key to trigger calculation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const btn = document.querySelector('.glass-btn') as HTMLButtonElement;
        btn?.click();
      }
    };
    document.addEventListener('keypress', handler);
    return () => document.removeEventListener('keypress', handler);
  }, []);

  return (
    <div className="min-h-screen px-5 pt-10 pb-40">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="mb-16 relative">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-3" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            Alight
          </h1>
          <p className="text-lg text-foreground/90">Calculate your deal on feet</p>

          {/* FIXED: Industry selector hidden for breakeven (kept behavior), visible for all others */}
          <div className={`absolute top-0 right-0 transition-all duration-300 ${activeCalc === 'breakeven' ? 'opacity-0 pointer-events-none -translate-y-5' : 'opacity-100'}`}>
            <select className="glass-select" value={industry} onChange={e => setIndustry(e.target.value)}>
              {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
        </div>

        {/* Active Calculator */}
        <div key={activeCalc} style={{ animation: 'fadeIn 0.3s ease' }}>
          {activeCalc === 'futureValue' && <FutureValueCalc industry={industry} country={country} onCountryChange={setCountry} onSave={(d, r) => saveDeal('futureValue', d, r)} />}
          {activeCalc === 'dealROI' && <DealROICalc industry={industry} country={country} onCountryChange={setCountry} onSave={(d, r) => saveDeal('dealROI', d, r)} />}
          {activeCalc === 'breakeven' && <BreakevenCalc industry={industry} country={country} />}
          {activeCalc === 'valuation' && <ValuationCalc industry={industry} country={country} onCountryChange={setCountry} onSave={(d, r) => saveDeal('valuation', d, r)} />}
          {activeCalc === 'payback' && <PaybackCalc industry={industry} country={country} onCountryChange={setCountry} />}
        </div>
      </div>

      {/* Bottom Navigation — FIXED: Single panel, no duplicates */}
      <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center gap-4 pb-8 z-50">
        <div className="bottom-nav">
          {CALC_TABS.map(tab => (
            <button key={tab.id} className={`nav-btn ${activeCalc === tab.id ? 'active' : ''}`} onClick={() => setActiveCalc(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4 items-center">
          <p className="text-[15px] text-foreground">Confidential Preview - Not for distribution</p>
          <button onClick={() => setShowSavedDeals(true)} className="text-xs text-foreground/60 hover:text-foreground transition-colors cursor-pointer underline">
            Saved Deals ({savedDeals.length})
          </button>
        </div>
        <p className="text-xs text-foreground/60">© 2026 Aliyan Arman. All rights reserved.</p>
      </div>

      {/* FIXED: Single saved deals panel (was duplicated) */}
      <SavedDealsPanel deals={savedDeals} isOpen={showSavedDeals} onClose={() => setShowSavedDeals(false)} onLoad={loadDeal} onDelete={deleteDeal} />
    </div>
  );
}
