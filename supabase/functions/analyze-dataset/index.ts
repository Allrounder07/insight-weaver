import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stats, columns, numericColumns, categoricalColumns, rows, missingPercent, duplicateRows, correlations, categoricalCounts, validationReport } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a concise summary for the AI
    const topCorrelations = (correlations || [])
      .sort((a: any, b: any) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5)
      .map((c: any) => `${c.col1} ↔ ${c.col2}: ${c.value.toFixed(3)}`);

    const statsSummary = Object.entries(stats || {})
      .slice(0, 8)
      .map(([col, s]: [string, any]) => `${col}: mean=${s.mean.toFixed(2)}, median=${s.median.toFixed(2)}, std=${s.stdDev.toFixed(2)}, range=[${s.min.toFixed(2)}, ${s.max.toFixed(2)}]`);

    const catSummary = Object.entries(categoricalCounts || {})
      .slice(0, 4)
      .map(([col, counts]: [string, any]) => {
        const top3 = Object.entries(counts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3)
          .map(([v, c]) => `${v}(${c})`);
        return `${col}: ${top3.join(", ")}`;
      });

    const validationSummary = validationReport
      ? `Data Quality: ${validationReport.overallScore.toFixed(0)}% overall, ${validationReport.completenessScore.toFixed(0)}% complete, ${validationReport.accuracyScore.toFixed(0)}% accurate. ${validationReport.issues.length} issues found.`
      : "";

    const prompt = `You are a data scientist analyzing a dataset. Provide 4-6 clear, actionable insights in paragraph form. Be specific with numbers.

Dataset: ${rows} rows, ${columns.length} columns
Numeric columns (${numericColumns.length}): ${numericColumns.join(", ")}
Categorical columns (${categoricalColumns.length}): ${categoricalColumns.join(", ")}
Missing data: ${missingPercent.toFixed(2)}%
Duplicate rows: ${duplicateRows}
${validationSummary}

Statistics:
${statsSummary.join("\n")}

Top correlations:
${topCorrelations.join("\n")}

Category distributions:
${catSummary.join("\n")}

Provide insights about:
1. Key patterns and trends in the data
2. Notable correlations and what they might mean
3. Data quality observations
4. Recommendations for further analysis or ML models
5. Any surprising or noteworthy findings`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert data analyst. Provide clear, concise insights using the data provided. Use markdown formatting with **bold** for key findings. Keep each insight to 2-3 sentences." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const insights = result.choices?.[0]?.message?.content || "Unable to generate insights.";

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-dataset error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
