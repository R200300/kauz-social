// =========================================================
// AI Gateway helpers (client-side wrappers for Supabase Edge Functions)
// For a SPA deployment, AI functions run as Supabase Edge Functions
// to protect the LOVABLE_API_KEY. These wrappers call those functions.
// =========================================================

import { supabase } from "@/integrations/supabase/client";

type CaptionResult = { captions: string[] };
type ModerationResult = { flagged: boolean; severe: boolean; reason: string };
type SuggestionsResult = { suggestions: string[] };
type InsightResult = { insight: string };

/** Generate Instagram-style captions for an image via Edge Function. */
export async function generateCaptions(input: { data: { imageDataUrl: string } }): Promise<CaptionResult> {
  const { data, error } = await supabase.functions.invoke<CaptionResult>("ai-caption", {
    body: { imageDataUrl: input.data.imageDataUrl },
  });
  if (error) throw new Error(error.message || "AI caption failed");
  return data ?? { captions: [] };
}

/** Moderate an image for unsafe content via Edge Function. */
export async function moderateImage(input: { data: { imageDataUrl: string } }): Promise<ModerationResult> {
  const { data, error } = await supabase.functions.invoke<ModerationResult>("ai-moderate", {
    body: { imageDataUrl: input.data.imageDataUrl },
  });
  if (error) throw new Error(error.message || "Moderation failed");
  return data ?? { flagged: false, severe: false, reason: "" };
}

/** Get personalized search suggestions via Edge Function. */
export async function smartSearchSuggestions(input: { data: { recent?: string[] } }): Promise<SuggestionsResult> {
  const { data, error } = await supabase.functions.invoke<SuggestionsResult>("ai-search-suggestions", {
    body: { recent: input.data.recent ?? [] },
  });
  if (error) throw new Error(error.message || "Suggestions failed");
  return data ?? { suggestions: [] };
}

/** Generate an AI insight about user activity via Edge Function. */
export async function generateInsight(input: { data: { postsCount: number; followersCount: number; totalLikes: number } }): Promise<InsightResult> {
  const { data, error } = await supabase.functions.invoke<InsightResult>("ai-insight", {
    body: {
      postsCount: input.data.postsCount,
      followersCount: input.data.followersCount,
      totalLikes: input.data.totalLikes,
    },
  });
  if (error) throw new Error(error.message || "Insight generation failed");
  return data ?? { insight: "" };
}