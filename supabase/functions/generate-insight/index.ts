import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { postsCount = 0, followersCount = 0, totalLikes = 0 } = await req.json();

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ insight: "Keep creating great content!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: "You are a friendly social media growth analyst. Be concise and encouraging.",
          },
          {
            role: "user",
            content: `A creator has ${postsCount} posts, ${followersCount} followers, and ${totalLikes} total likes. Write ONE short insight (max 140 chars) about their best posting time, top audience, or reach. Plain text only, no quotes.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ insight: "Keep creating great content!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ insight: raw.trim().replace(/^["']|["']$/g, "") }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ insight: "Keep creating great content!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});