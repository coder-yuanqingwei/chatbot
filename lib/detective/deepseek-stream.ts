import type { Phase } from "./types";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "";
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1";

function encodeSSE(event: string, data: Record<string, unknown>): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      const delay = (attempt + 1) * 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}

export async function streamDetective(
  agentId: string,
  agentName: string,
  agentColor: string,
  agentIcon: string,
  phase: Phase,
  round: number,
  systemPrompt: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  send: (event: string, data: Record<string, unknown>) => void
): Promise<string> {
  const id = `${agentId}-${phase}-${round}-${Date.now()}`;

  send("agent-start", {
    agentColor,
    agentIcon,
    agentId,
    agentName,
    id,
    phase,
    round,
  });

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { content: systemPrompt, role: "system" },
    ...conversationHistory.map((m) => ({
      content: m.content,
      role: m.role as "user" | "assistant",
    })),
  ];

  const response = await fetchWithRetry(
    `${DEEPSEEK_BASE_URL}/chat/completions`,
    {
      body: JSON.stringify({
        max_tokens: 8192,
        messages,
        model: "deepseek-chat",
        stream: true,
        temperature: 0.7,
      }),
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body from DeepSeek API");
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed?.startsWith("data: ")) {
        continue;
      }

      const data = trimmed.slice(6);
      if (data === "[DONE]") {
        continue;
      }

      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{
            delta?: { content?: string };
          }>;
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          send("text-delta", {
            agentId,
            round,
            textDelta: delta,
          });
        }
      } catch {
        // skip malformed SSE data
      }
    }
  }

  send("agent-end", {
    agentId,
    round,
  });

  return fullText;
}

export { encodeSSE };
