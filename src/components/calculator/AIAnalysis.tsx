import { useState, useEffect, useRef } from 'react';

interface Props {
  calculatorType: string;
  inputs: Record<string, string | number>;
  results: Record<string, string | number>;
  industry: string;
  country: string;
  onAnalysisComplete?: (text: string) => void;
}

export default function AIAnalysis({ calculatorType, inputs, results, industry, country, onAnalysisComplete }: Props) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const resultsStr = JSON.stringify(results);

  useEffect(() => {
    if (!results || Object.keys(results).length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(() => {
      fetchAnalysis(controller.signal);
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatorType, industry, country, resultsStr]);

  const fetchAnalysis = async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    setAnalysis('');

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-deal-analysis`;

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ calculatorType, inputs, results, industry, country }),
        signal,
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) { setError('Rate limited — try again in a moment.'); setLoading(false); return; }
        if (resp.status === 402) { setError('AI credits exhausted.'); setLoading(false); return; }
        setError('AI analysis unavailable.'); setLoading(false); return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { text += content; setAnalysis(text); }
          } catch { /* partial */ }
        }
      }

      onAnalysisComplete?.(text);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError('Failed to connect to AI.');
    }
    setLoading(false);
  };

  if (loading && !analysis) {
    return (
      <div className="text-sm text-foreground/60 animate-pulse">Analyzing your numbers...</div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (analysis) {
    return (
      <>
        <div className="text-sm leading-relaxed text-foreground/80">{analysis}</div>
        <div className="flex items-center justify-between mt-4">
          <button className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors" onClick={() => fetchAnalysis()}>
            Regenerate
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-foreground/25 uppercase tracking-widest mr-1">Sources</span>
            <a href="https://www.bloomberg.com/markets" target="_blank" rel="noopener noreferrer" className="source-pill">Bloomberg</a>
            <a href="https://pitchbook.com" target="_blank" rel="noopener noreferrer" className="source-pill">PitchBook</a>
            <a href="https://www.spglobal.com/ratings" target="_blank" rel="noopener noreferrer" className="source-pill">S&P</a>
          </div>
        </div>
      </>
    );
  }

  return null;
}
