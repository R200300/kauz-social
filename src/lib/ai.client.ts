/**
 * Client-side AI functions (stubbed for SPA migration).
 * These originally used Lovable AI gateway via server functions.
 * To re-enable AI features, deploy Supabase Edge Functions and update these calls.
 */

export async function generateCaptions(_imageDataUrl: string): Promise<{ captions: string[] }> {
  // TODO: Deploy Supabase Edge Function for AI caption generation
  // For now, return placeholder captions
  return {
    captions: [
      "Living my best life #vibes",
      "Creating memories that last forever #lifestyle",
      "This moment was everything #blessed",
    ],
  };
}

export async function moderateImage(_imageDataUrl: string): Promise<{ flagged: boolean; severe: boolean; reason: string }> {
  // TODO: Deploy Supabase Edge Function for content moderation
  // For now, allow all content (fail open)
  return { flagged: false, severe: false, reason: "" };
}

export async function smartSearchSuggestions(_recent: string[]): Promise<{ suggestions: string[] }> {
  // TODO: Deploy Supabase Edge Function for smart search
  // For now, return static suggestions
  return {
    suggestions: [
      "Trending creators",
      "Popular hashtags",
      "New accounts",
      "Reels for you",
      "Suggested follows",
    ],
  };
}

export async function generateInsight(_data: {
  postsCount: number;
  followersCount: number;
  totalLikes: number;
}): Promise<{ insight: string }> {
  // TODO: Deploy Supabase Edge Function for AI insights
  // For now, return a generic message
  return {
    insight: "Keep creating great content to grow your audience!",
  };
}
