import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { calculatorType, inputs, results, industry, country } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a senior financial analyst at Alight. You provide direct, numbers-driven deal analysis.

Rules:
- No emojis. Ever. No dramatic metaphors or hyperbole. No phrases like "defies the laws of" or "rocket ship" or "home run".
- Be conversational but professional — like a senior analyst talking to a fund partner over coffee.
- Use the specific numbers from the data provided. Reference the actual figures.
- Compare against the industry benchmarks given.
- 3-4 sentences maximum. Every word earns its place.
- In the final 1-2 sentences, briefly reference ONE real-world comparable — a specific deal, acquisition, or company outcome that is relevant. Include the approximate year and result (e.g., "Similar to KKR's 2007 First Data buyout at 11x EBITDA which returned 3.2x over 7 years" or "Companies at this margin historically trade at 8-10x, like Salesforce circa 2020"). If no strong comparable exists, cite a relevant market statistic.
- End with a clear one-line action: what to do or not do.
- No bullet points. Flowing prose only.
- Currency and numbers should match the user's market context.
- Match the tone of a straightforward static financial analysis — no AI-sounding language.`;

    const userPrompt = `Calculator: ${calculatorType}
Market: ${country}
Industry: ${industry}

Inputs: ${JSON.stringify(inputs)}
Results: ${JSON.stringify(results)}

Give me your analyst take on this deal/investment.`;

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
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
