import { useState, useEffect } from 'react';

const funFacts = [
  "Alight processes financial models 10x faster than traditional spreadsheets.",
  "The average investment memo takes 4 hours to write manually — Alight does it in seconds.",
  "Alight's analysis engine covers 50+ industries across 4 global markets.",
  "Professional investment memos typically run 5-15 pages for a single deal.",
  "Top PE firms review over 1,000 deals per year but invest in fewer than 10.",
  "The first leveraged buyout dates back to 1955 when McLean Industries acquired Pan-Atlantic.",
  "Warren Buffett reads 500+ pages of financial documents every single day.",
];

interface Props {
  open: boolean;
  onComplete: () => void;
}

export default function ExportMemoDialog({ open, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [fact] = useState(() => funFacts[Math.floor(Math.random() * funFacts.length)]);

  useEffect(() => {
    if (!open) { setProgress(0); return; }

    const steps = [
      { target: 15, delay: 300 },
      { target: 35, delay: 800 },
      { target: 55, delay: 1500 },
      { target: 75, delay: 2500 },
      { target: 90, delay: 3500 },
      { target: 100, delay: 5000 },
    ];

    const timers = steps.map(s =>
      setTimeout(() => setProgress(s.target), s.delay)
    );

    const done = setTimeout(() => onComplete(), 5500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [open, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-card max-w-md w-full mx-4 text-center" style={{ padding: '40px 32px' }}>
        <div className="text-lg font-semibold text-foreground mb-2">Generating Investment Memo</div>
        <div className="text-sm text-muted-foreground mb-6">
          {progress < 30
            ? 'Compiling financial data...'
            : progress < 60
            ? 'Running detailed market analysis...'
            : progress < 90
            ? 'Formatting professional memorandum...'
            : 'Finalizing document...'}
        </div>

        <div className="w-full h-2 rounded-full bg-foreground/10 mb-6 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent) / 0.6))',
            }}
          />
        </div>

        <div className="text-xs text-foreground/30 italic leading-relaxed px-4">
          {fact}
        </div>

        <div className="text-[10px] text-foreground/20 mt-4">
          Please wait ~5 seconds
        </div>
      </div>
    </div>
  );
}
