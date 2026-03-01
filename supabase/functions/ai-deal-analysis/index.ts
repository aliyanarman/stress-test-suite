import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CALCULATOR_CONTEXTS: Record<string, { inApp: string; memo: string }> = {
  "Future Value": {
    inApp: `You are analyzing a FUTURE VALUE calculation. The user wants to know how much their investment/asset will be worth in the future at a given growth rate. Focus on: whether the growth rate is realistic for the industry, how the future value compares to inflation-adjusted returns, and whether this is a good long-term play. Tell them what to DO — hold, invest more, diversify, etc. Reference the country and industry.`,
    memo: `You are writing a detailed Future Value / Growth Analysis memo. Discuss compound growth dynamics, compare the assumed growth rate against historical industry averages in the specific country, mention inflation erosion, and provide 2-3 real comparable investments or assets in the same sector/country with their historical growth rates. Discuss whether the projected returns justify the time horizon and opportunity cost.`,
  },
  "Deal ROI": {
    inApp: `You are analyzing a DEAL ROI / ACQUISITION calculation. The user is evaluating buying a business or asset. Focus on: whether the entry price is fair given the EBITDA, if the IRR and cash return justify the risk, and how the deal compares to typical deals in this industry/country. Tell them to proceed, negotiate down, or walk away. Reference specific numbers.`,
    memo: `You are writing a detailed Deal ROI / LBO Analysis memo. Analyze entry multiple vs industry comps, IRR vs hurdle rates, MOIC attractiveness, cash-on-cash dynamics, and exit feasibility at the assumed multiple. Provide 2-3 real comparable transactions in the same industry and country/region with approximate deal sizes and outcomes. Discuss key risks: leverage, market cycles, operational execution.`,
  },
  "Breakeven": {
    inApp: `You are analyzing a BREAKEVEN calculation. The user wants to know how many units they need to sell to cover their fixed costs. Focus on: whether the profit margin per unit is healthy, how quickly they can realistically reach breakeven volume, and what the unit economics tell us about business viability. Guide them on pricing strategy or cost reduction. Reference the contribution per unit and breakeven point.`,
    memo: `You are writing a detailed Breakeven Analysis memo. Analyze unit economics depth — contribution margin, fixed cost coverage, and volume sensitivity. Compare margins against industry benchmarks in the specific country. Provide 2-3 comparable businesses or products in the same sector with their typical margins and breakeven dynamics. Discuss scaling economics — what happens at 2x and 5x the breakeven volume.`,
  },
  "Valuation": {
    inApp: `You are analyzing a COMPANY VALUATION. The user wants to know what their business is worth based on revenue and EBITDA. Focus on: whether the EBITDA margin is strong for the industry, how the implied valuation multiple compares to recent transactions, and whether the business is undervalued or overvalued. Tell them if it's a good time to sell, raise capital, or keep growing.`,
    memo: `You are writing a detailed Valuation Analysis memo. Analyze the business using multiple methodologies — EV/EBITDA, EV/Revenue, and margin-based approaches. Compare against 2-3 real comparable companies or recent M&A transactions in the same industry and country. Discuss what drives premium vs discount valuations in this sector. Address key value drivers and risks.`,
  },
  "Payback": {
    inApp: `You are analyzing an INVESTMENT PAYBACK calculation. The user wants to know how long it takes to recover their investment through annual savings or earnings. Focus on: whether the payback period is acceptable for this type of investment, what the real (inflation-adjusted) return looks like, and the total value created over the projection period. Tell them if this investment is worth making.`,
    memo: `You are writing a detailed Payback / Investment Recovery Analysis memo. Analyze payback period against industry norms, discuss inflation impact on real returns, and project total value creation over the investment horizon. Provide 2-3 comparable investments in the same industry and country with their typical payback periods. Discuss opportunity cost — what else could this capital achieve, and the risk-adjusted return profile.`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { calculatorType, inputs, results, industry, country, detailedMemo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ctx = CALCULATOR_CONTEXTS[calculatorType] || CALCULATOR_CONTEXTS["Deal ROI"];

    let systemPrompt: string;
    let userPrompt: string;

    if (detailedMemo) {
      systemPrompt = `${ctx.memo}

Rules:
- Write 3-4 paragraphs of substantive analysis.
- Reference specific numbers from the data provided.
- Compare performance against industry benchmarks in the specific country/market.
- Include 2-3 real-world comparable transactions or companies from the same industry and country/region. Include approximate year, deal size, and outcome.
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

Write a detailed market analysis with real-world comparables for the investment memorandum PDF. Make sure every claim ties back to the actual numbers provided.`;
    } else {
      systemPrompt = `${ctx.inApp}

HARD LIMITS — you MUST obey these:
- MAXIMUM 50 words. Do NOT exceed 50 words under any circumstances.
- MAXIMUM 320 characters total.
- 3-4 sentences ONLY.

Rules:
- Tell the user what to DO with this investment based on the calculator results.
- Mention the country and industry context briefly.
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

Give a 3-4 sentence actionable verdict. Max 50 words, 320 characters. Be specific to THESE numbers.`;
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
      // Strip any markdown artifacts
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
