import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateCaption(imageUrl: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: imageUrl,
            },
          },
          {
            type: "text",
            text: "Write a short, engaging Instagram-style caption for this image. Keep it under 150 characters. Be casual and fun.",
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }

  return "Check out this amazing moment ✨";
}