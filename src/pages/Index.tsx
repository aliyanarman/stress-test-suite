import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [country, setCountry] = useState('US');
  const [savedDeals, setSavedDeals] = useState<SavedDeal[]>(() => {
    try { return JSON.parse(localStorage.getItem('alight_saved_deals') || '[]'); } catch { return []; }
  });
  const [showSavedDeals, setShowSavedDeals] = useState(false);
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

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

  // Footer blur-in on scroll
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setFooterVisible(true);
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  });

  // Reset on calc change
  useEffect(() => {
    setFooterVisible(false);
    setRibbonCollapsed(false);
  }, [activeCalc]);

  const handleCalculate = useCallback(() => {
    setRibbonCollapsed(true);
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
    <div className="min-h-screen px-5 pt-10 pb-24">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="mb-16 relative">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-3" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            Alight
          </h1>
          <p className="text-lg text-foreground/90">Your pocket financial analyst</p>

          <div className={`absolute top-0 right-0 transition-all duration-300 ${activeCalc === 'breakeven' ? 'opacity-0 pointer-events-none -translate-y-5' : 'opacity-100'}`}>
            <select className="glass-select" value={industry} onChange={e => setIndustry(e.target.value)}>
              {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
        </div>

        {/* Active Calculator */}
        <div key={activeCalc} style={{ animation: 'fadeIn 0.3s ease' }}>
          {activeCalc === 'futureValue' && <FutureValueCalc industry={industry} country={country} onCountryChange={setCountry} onSave={(d, r) => saveDeal('futureValue', d, r)} onCalculate={handleCalculate} />}
          {activeCalc === 'dealROI' && <DealROICalc industry={industry} country={country} onCountryChange={setCountry} onSave={(d, r) => saveDeal('dealROI', d, r)} onCalculate={handleCalculate} />}
          {activeCalc === 'breakeven' && <BreakevenCalc industry={industry} country={country} onCountryChange={setCountry} onIndustryChange={setIndustry} onCalculate={handleCalculate} />}
          {activeCalc === 'valuation' && <ValuationCalc industry={industry} country={country} onCountryChange={setCountry} onSave={(d, r) => saveDeal('valuation', d, r)} onCalculate={handleCalculate} />}
          {activeCalc === 'payback' && <PaybackCalc industry={industry} country={country} onCountryChange={setCountry} onCalculate={handleCalculate} />}
        </div>

        {/* Inline footer — blur-in on scroll */}
        <div
          ref={footerRef}
          className={`mt-20 mb-16 text-center transition-all duration-700 ${footerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ filter: footerVisible ? 'blur(0px)' : 'blur(8px)' }}
        >
          <div className="flex gap-4 items-center justify-center mb-3 flex-wrap">
            <p className="text-[15px] text-foreground/50">Confidential Preview - Not for distribution</p>
            <button onClick={() => setShowSavedDeals(true)} className="text-xs text-foreground/60 hover:text-foreground transition-colors cursor-pointer underline">
              Saved Deals ({savedDeals.length})
            </button>
            <a href="https://github.com/aliyanarman/Pocket-Financial-Analyst/blob/main/Alight%20Pitchdeck.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-foreground/60 hover:text-foreground transition-colors cursor-pointer underline">
              Pitch Deck
            </a>
          </div>
          <p className="text-xs text-foreground/40">© 2026 Aliyan Arman. All rights reserved.</p>
        </div>
      </div>

      {/* Fixed bottom — calculator ribbon only */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 z-50">
        {ribbonCollapsed ? (
          <div className="home-indicator" onClick={() => setRibbonCollapsed(false)}>
            <div className="home-indicator-pill" />
          </div>
        ) : (
          <div className="bottom-nav" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {CALC_TABS.map(tab => (
              <button key={tab.id} className={`nav-btn ${activeCalc === tab.id ? 'active' : ''}`} onClick={() => setActiveCalc(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <SavedDealsPanel deals={savedDeals} isOpen={showSavedDeals} onClose={() => setShowSavedDeals(false)} onLoad={loadDeal} onDelete={deleteDeal} />
    </div>
  );
}
