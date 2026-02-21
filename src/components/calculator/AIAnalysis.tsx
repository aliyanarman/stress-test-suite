import { useState, useCallback } from 'react';

interface Props {
  calculatorType: string;
  inputs: Record<string, string | number>;
  results: Record<string, string | number>;
  industry: string;
  country: string;
}

export default function AIAnalysis({ calculatorType, inputs, results, industry, country }: Props) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getAnalysis = useCallback(async () => {
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
    } catch {
      setError('Failed to connect to AI.');
    }
    setLoading(false);
  }, [calculatorType, inputs, results, industry, country]);

  return (
    <div className="mt-6">
      {!analysis && !loading && (
        <button className="ai-analysis-btn" onClick={getAnalysis} disabled={loading}>
          <span className="ai-icon">✦</span> Get AI Analysis
        </button>
      )}

      {loading && !analysis && (
        <div className="ai-analysis-box">
          <div className="text-[13px] font-semibold text-foreground mb-3 tracking-wide flex items-center gap-2">
            <span className="ai-icon animate-pulse">✦</span> AI ANALYST
          </div>
          <div className="text-sm text-foreground/60 animate-pulse">Analyzing your deal...</div>
        </div>
      )}

      {analysis && (
        <div className="ai-analysis-box">
          <div className="text-[13px] font-semibold text-foreground mb-3 tracking-wide flex items-center gap-2">
            <span className="ai-icon">✦</span> AI ANALYST
          </div>
          <div className="text-sm leading-relaxed text-foreground/85">{analysis}</div>
          <button className="text-xs text-foreground/40 hover:text-foreground/60 mt-3 transition-colors" onClick={getAnalysis}>
            Regenerate
          </button>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive mt-2">{error}</div>
      )}
    </div>
  );
}
