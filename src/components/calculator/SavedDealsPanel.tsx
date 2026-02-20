export interface SavedDeal {
  id: number;
  name: string;
  type: string;
  industry: string;
  country: string;
  timestamp: string;
  data: Record<string, string>;
  result: string;
}

interface Props {
  deals: SavedDeal[];
  isOpen: boolean;
  onClose: () => void;
  onLoad: (deal: SavedDeal) => void;
  onDelete: (id: number) => void;
}

export default function SavedDealsPanel({ deals, isOpen, onClose, onLoad, onDelete }: Props) {
  return (
    <div className={`saved-deals-panel ${isOpen ? 'open' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Saved Deals</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-foreground/10 transition-colors text-foreground">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-4">📊</div>
          <div className="text-[15px]">No saved deals yet</div>
        </div>
      ) : (
        deals.map(deal => (
          <div key={deal.id}
            onClick={() => onLoad(deal)}
            className="bg-gradient-to-br from-white/[0.08] to-white/[0.04] border border-white/[0.12] rounded-xl p-4 mb-3 cursor-pointer transition-all hover:from-white/[0.12] hover:to-white/[0.08] hover:border-white/20 hover:-translate-x-1 relative"
          >
            <div className="text-[15px] font-semibold text-foreground mb-2">{deal.name}</div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{deal.industry.replace('-', ' ')} • {deal.country}</span>
              <span>{new Date(deal.timestamp).toLocaleDateString()}</span>
            </div>
            <div className="mt-2 text-[13px] font-medium text-foreground">{deal.result}</div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(deal.id); }}
              className="absolute top-3 right-3 bg-red-500/20 border border-red-500/30 rounded-md px-2 py-1 text-red-400 text-[11px] cursor-pointer hover:bg-red-500/30"
            >Delete</button>
          </div>
        ))
      )}
    </div>
  );
}
