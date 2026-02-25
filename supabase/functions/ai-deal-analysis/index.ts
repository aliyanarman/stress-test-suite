import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { calculatorType, inputs, results, industry, country, detailedMemo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userPrompt: string;

    if (detailedMemo) {
      systemPrompt = `You are a senior investment analyst at a top-tier advisory firm. Write a detailed investment analysis section for a professional PDF memorandum.

Rules:
- Write 2-3 paragraphs of substantive analysis.
- Reference specific numbers from the data provided.
- Compare performance against industry benchmarks in the specific country/market.
- Include 2-3 real-world comparable transactions or companies from the same industry and country/region. Include approximate year, deal size, and outcome.
- Discuss risk factors and opportunities specific to this industry and market.
- Use professional Wall Street tone — formal but clear.
- No emojis. No bullet points. Flowing prose only. No markdown formatting (no **, no *, no #, no backticks).
- Write in plain text only. No bold markers. No special formatting characters.
- Currency and numbers should match the user's market context.`;

      userPrompt = `Calculator: ${calculatorType}
Market: ${country}
Industry: ${industry}

Inputs: ${JSON.stringify(inputs)}
Results: ${JSON.stringify(results)}

Write a detailed market analysis with real-world comparables for the investment memorandum PDF.`;
    } else {
      systemPrompt = `You are a concise financial advisor. Give an actionable verdict on the numbers.

HARD LIMITS — you MUST obey these:
- MAXIMUM 50 words. Do NOT exceed 50 words under any circumstances.
- MAXIMUM 320 characters total.
- 3-4 sentences ONLY.

Rules:
- Tell the user what to DO with this deal/investment (proceed, hold, avoid, etc).
- Mention the country and industry context briefly.
- Reference one or two key numbers.
- Say whether it beats or trails the industry average.
- Use simple everyday language. No jargon.
- No emojis. No markdown (no **, no *, no #, no backticks).
- Plain text only. No bullet points. No bold.
- Every word must earn its place. Be ruthlessly concise.`;

      userPrompt = `Calculator: ${calculatorType}
Market: ${country}
Industry: ${industry}

Inputs: ${JSON.stringify(inputs)}
Results: ${JSON.stringify(results)}

Give a 3-4 sentence actionable verdict. Max 50 words, 320 characters.`;
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
        ...(detailedMemo ? { max_tokens: 1500 } : { max_tokens: 120 }),
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
      const text = data.choices?.[0]?.message?.content || "";
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
