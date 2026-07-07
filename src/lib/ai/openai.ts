const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.4,
      max_tokens: options?.maxTokens ?? 800,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[ai] OpenAI error:", res.status, body);
    throw new Error("AI_REQUEST_FAILED");
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
