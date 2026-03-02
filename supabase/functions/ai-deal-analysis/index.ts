import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TAX_CONTEXT: Record<string, string> = {
  US: "US federal capital gains tax is 15-20% (long-term) or up to 37% (short-term). State taxes vary 0-13%. Consider the net after-tax return.",
  PK: "Pakistan taxes capital gains at 15-20% depending on holding period. Property gains taxed at progressive rates. High inflation (11%+) further erodes real returns.",
  UK: "UK Capital Gains Tax is 10-20% (18-28% on property). The annual exempt amount is £6,000. Consider ISA shelters for tax efficiency.",
  AE: "UAE has 0% personal income tax and 0% capital gains tax. This is a major advantage — gross returns equal net returns. Corporate tax is 9% above AED 375,000.",
};

const CALCULATOR_CONTEXTS: Record<string, { inApp: string; memo: string }> = {
  "Future Value": {
    inApp: `You are analyzing a FUTURE VALUE calculation. The user wants to know how much their investment/asset will be worth in the future. Focus on: whether the growth rate is realistic, what inflation does to the real value, and what taxes in the user's country will take from the gains. Tell them the real after-inflation, after-tax picture. Reference the country's inflation rate and tax regime. Be specific to THESE numbers.`,
    memo: `You are writing a detailed Future Value / Growth Analysis memo. Discuss compound growth dynamics, compare the assumed growth rate against historical industry averages in the specific country, mention inflation erosion with the exact inflation rate for that country, and provide 2-3 real comparable investments or assets in the same sector/country with their historical growth rates. IMPORTANT: Include a dedicated section on inflation impact showing how much purchasing power is lost over the time horizon. Include a dedicated section on tax implications in the user's country — what taxes apply to these gains, effective tax rate, and the net after-tax, after-inflation return. Discuss whether the projected returns justify the time horizon and opportunity cost after accounting for inflation and taxes.`,
  },
  "Deal ROI": {
    inApp: `You are analyzing a DEAL ROI / ACQUISITION calculation. The user is evaluating buying a business or asset. Focus on: whether the entry price is fair given the EBITDA, if the IRR and cash return justify the risk, and how taxes and inflation in the user's country affect the real return. Mention the effective tax rate on gains/income. Tell them to proceed, negotiate down, or walk away.`,
    memo: `You are writing a detailed Deal ROI / LBO Analysis memo. Analyze entry multiple vs industry comps, IRR vs hurdle rates, MOIC attractiveness, cash-on-cash dynamics, and exit feasibility at the assumed multiple. Provide 2-3 real comparable transactions in the same industry and country/region. IMPORTANT: Include a section on inflation-adjusted returns — what the real IRR looks like after the country's inflation rate. Include a section on tax implications — capital gains tax, corporate tax, transaction taxes applicable in the user's country, and what the net after-tax return looks like. Discuss key risks: leverage, market cycles, operational execution, and tax/regulatory changes.`,
  },
  "Breakeven": {
    inApp: `You are analyzing a BREAKEVEN calculation. The user wants to know how many units they need to sell to cover their fixed costs. Focus on: whether the profit margin per unit is healthy, how quickly they can realistically reach breakeven volume, and what taxes in their country mean for the actual take-home profit per unit. After tax and inflation, what does each unit really earn? Reference the contribution per unit and breakeven point.`,
    memo: `You are writing a detailed Breakeven Analysis memo. Analyze unit economics depth — contribution margin, fixed cost coverage, and volume sensitivity. Compare margins against industry benchmarks in the specific country. Provide 2-3 comparable businesses or products in the same sector with their typical margins. IMPORTANT: Include a section on inflation impact — how rising costs might shift the breakeven point over time. Include a section on tax implications — what corporate/income tax rate applies, sales tax/VAT considerations, and the effective after-tax profit per unit. Discuss scaling economics — what happens at 2x and 5x the breakeven volume after accounting for taxes.`,
  },
  "Valuation": {
    inApp: `You are analyzing a COMPANY VALUATION. The user wants to know what their business is worth. Focus on: whether the EBITDA margin is strong for the industry, how the implied valuation multiple compares to recent transactions, and what tax implications exist if they sell at this price in their country. Mention capital gains tax on exit proceeds. Tell them if it's a good time to sell, raise capital, or keep growing.`,
    memo: `You are writing a detailed Valuation Analysis memo. Analyze the business using multiple methodologies — EV/EBITDA, EV/Revenue, and margin-based approaches. Compare against 2-3 real comparable companies or recent M&A transactions in the same industry and country. IMPORTANT: Include a section on inflation context — are the revenue/EBITDA figures inflation-adjusted? What does the valuation look like in real terms? Include a section on tax implications of a sale — capital gains tax, transaction costs, earn-out tax treatment, and net proceeds after tax in the user's country. Discuss what drives premium vs discount valuations in this sector.`,
  },
  "Payback": {
    inApp: `You are analyzing an INVESTMENT PAYBACK calculation. The user wants to know how long it takes to recover their investment. Focus on: whether the payback period is acceptable, what the real inflation-adjusted return looks like, and what taxes in their country do to the annual savings/earnings. After inflation and taxes, how long does payback really take? Reference the country's inflation and tax rates.`,
    memo: `You are writing a detailed Payback / Investment Recovery Analysis memo. Analyze payback period against industry norms, discuss inflation impact on real returns with the country's specific inflation rate, and project total value creation. Provide 2-3 comparable investments in the same industry and country with their typical payback periods. IMPORTANT: Include a section on inflation-adjusted analysis — the real (not nominal) payback period and cumulative value after discounting for inflation. Include a section on tax implications — what taxes apply to the annual savings/earnings in the user's country, the effective tax rate, and the after-tax payback period. Discuss opportunity cost and risk-adjusted return profile.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { calculatorType, inputs, results, industry, country, detailedMemo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ctx = CALCULATOR_CONTEXTS[calculatorType] || CALCULATOR_CONTEXTS["Deal ROI"];
    const taxInfo = TAX_CONTEXT[country] || TAX_CONTEXT["US"];

    let systemPrompt: string;
    let userPrompt: string;

    if (detailedMemo) {
      systemPrompt = `${ctx.memo}

Tax context for this country: ${taxInfo}

Rules:
- Write 3-4 paragraphs of substantive analysis.
- Reference specific numbers from the data provided.
- Compare performance against industry benchmarks in the specific country/market.
- Include 2-3 real-world comparable transactions or companies from the same industry and country/region. Include approximate year, deal size, and outcome.
- MUST include inflation-adjusted analysis with exact numbers.
- MUST include tax implications specific to the user's country with effective rates and net returns.
- Discuss risk factors and opportunities specific to this industry and market.
- Use professional Wall Street tone — formal but clear.
- No emojis. No bullet points. Flowing prose only. No markdown formatting (no **, no *, no #, no backticks).
- Write in plain text only. No bold markers. No special formatting characters.
- Currency and numbers should match the user's market context.
- After writing, mentally re-read and remove any speculative claims that cannot be supported by the input data.`;

      userPrompt = `Calculator: ${calculatorType}
Market: ${country}
Industry: ${industry}

Inputs: ${JSON.stringify(inputs)}
Results: ${JSON.stringify(results)}

Write a detailed market analysis with real-world comparables, inflation-adjusted returns, and tax implications for the investment memorandum PDF. Make sure every claim ties back to the actual numbers provided.`;
    } else {
      systemPrompt = `${ctx.inApp}

Tax context: ${taxInfo}

HARD LIMITS — you MUST obey these:
- MAXIMUM 50 words. Do NOT exceed 50 words under any circumstances.
- MAXIMUM 320 characters total.
- 3-4 sentences ONLY.

Rules:
- Tell the user what to DO with this investment based on the calculator results.
- Mention inflation and tax impact on the real return briefly.
- Reference one or two key numbers from the results.
- Say whether it beats or trails the industry average.
- Use simple everyday language. No jargon.
- No emojis. No markdown (no **, no *, no #, no backticks).
- Plain text only. No bullet points. No bold.
- Every word must earn its place. Be ruthlessly concise.
- Each response must be UNIQUE to the specific numbers — never use template phrases.`;

      userPrompt = `Calculator: ${calculatorType}
Market: ${country}
Industry: ${industry}

Inputs: ${JSON.stringify(inputs)}
Results: ${JSON.stringify(results)}

Give a 3-4 sentence actionable verdict mentioning after-inflation and after-tax reality. Max 50 words, 320 characters. Be specific to THESE numbers.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: !detailedMemo,
        ...(detailedMemo ? { max_tokens: 2000 } : { max_tokens: 120 }),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (detailedMemo) {
      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || "";
      text = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/`/g, '').trim();
      return new Response(JSON.stringify({ analysis: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-deal-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
