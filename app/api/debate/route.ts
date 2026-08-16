import { streamText } from "ai";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { DEBATE_AGENTS, MAX_ROUNDS } from "@/lib/debate/agents";
import type { AgentId } from "@/lib/debate/types";

export const maxDuration = 300;

const debateRequestSchema = z.object({
  rounds: z.number().int().min(1).max(MAX_ROUNDS).default(2),
  topic: z.string().min(1).max(2000),
});

function encodeSSE(event: string, data: Record<string, unknown>): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof debateRequestSchema>;
  try {
    const json = await request.json();
    body = debateRequestSchema.parse(json);
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const { topic, rounds } = body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encodeSSE(event, data));
      };

      const conversationHistory: Array<{
        role: "user" | "assistant";
        content: string;
      }> = [{ content: topic, role: "user" }];

      let prevAgentId: AgentId | null = null;

      try {
        for (let round = 0; round < rounds; round += 1) {
          send("round-start", {
            round: round + 1,
            totalRounds: rounds,
          });

          for (const agent of DEBATE_AGENTS) {
            send("handoff", {
              from: prevAgentId,
              round: round + 1,
              to: agent.id,
            });

            send("agent-start", {
              agentId: agent.id,
              round: round + 1,
            });

            const result = streamText({
              messages: conversationHistory,
              model: getLanguageModel(DEFAULT_CHAT_MODEL),
              system: agent.systemPrompt,
            });

            for await (const delta of result.textStream) {
              send("text-delta", {
                agentId: agent.id,
                textDelta: delta,
              });
            }

            const finalText = await result.text;
            conversationHistory.push({
              content: `[${agent.id}]: ${finalText}`,
              role: "assistant",
            });

            send("agent-end", {
              agentId: agent.id,
              round: round + 1,
            });

            prevAgentId = agent.id;
          }
        }

        send("debate-end", {});
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "Debate failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}
