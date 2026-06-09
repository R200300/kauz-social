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
    const { imageDataUrl } = await req.json();
    if (!imageDataUrl?.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "Invalid image." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ flagged: false, severe: false, reason: "" }), {
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
            role: "user",
            content: [
              {
                type: "text",
                text: 'Moderate this image for a social app. Respond ONLY with JSON: {"flagged": boolean, "severe": boolean, "reason": string}. flagged=true for nudity, violence, hate, or other unsafe content. severe=true only for content that must be blocked entirely (e.g. explicit sexual content, graphic violence, CSAM). Keep reason short.',
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ flagged: false, severe: false, reason: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "";

    const result = parseJson<{ flagged: boolean; severe: boolean; reason: string }>(raw, {
      flagged: false,
      severe: false,
      reason: "",
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ flagged: false, severe: false, reason: "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});