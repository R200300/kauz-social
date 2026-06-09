import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function parseJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.search(/[[{]/);
    if (start === -1) return fallback;
    return JSON.parse(cleaned.slice(start)) as T;
  } catch {
    return fallback;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { recent = [] } = await req.json();
    const recentTags = (recent ?? []).slice(0, 20);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ suggestions: ["#trending", "#photography", "#travel", "#art", "#nature"] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = recentTags.length
      ? `Recent activity / interests: ${recentTags.join(", ")}.`
      : "No recent activity yet.";

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You suggest short search queries for a social media app. Be concise and trendy.",
          },
          {
            role: "user",
            content: `${ctx}\nGive 5 personalized search suggestions (each 2-4 words, no hashtags unless natural). Return ONLY a JSON array of 5 strings.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ suggestions: ["#trending", "#photography", "#travel", "#art", "#nature"] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const suggestions = parseJson<string[]>(raw, []);

    return new Response(JSON.stringify({ suggestions: suggestions.filter((s) => typeof s === "string").slice(0, 5) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ suggestions: ["#trending", "#photography", "#travel", "#art", "#nature"] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});