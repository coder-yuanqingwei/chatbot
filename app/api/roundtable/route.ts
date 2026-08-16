import { streamText } from "ai";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  buildModeratorSummaryPrompt,
  getTemplateById,
} from "@/lib/roundtable/templates";
import type {
  MeetingConclusion,
  RoundtableAgent,
} from "@/lib/roundtable/types";

export const maxDuration = 300;

const roundtableRequestSchema = z.object({
  rounds: z.number().int().min(1).max(5).default(2),
  templateId: z.string().min(1),
  topic: z.string().min(1).max(2000),
});

function encodeSSE(event: string, data: Record<string, unknown>): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

async function streamAgent(
  agent: RoundtableAgent,
  agentName: string,
  conversationHistory: ConversationMessage[],
  phase: string,
  round: number,
  send: (event: string, data: Record<string, unknown>) => void
): Promise<string> {
  send("agent-start", {
    agentArchetype: agent.archetype,
    agentColor: agent.color,
    agentIcon: agent.icon,
    agentId: agent.id,
    agentName,
    phase,
    round,
  });

  const result = streamText({
    messages: conversationHistory,
    model: getLanguageModel(DEFAULT_CHAT_MODEL),
    system: agent.systemPrompt,
  });

  for await (const delta of result.textStream) {
    send("text-delta", {
      agentId: agent.id,
      round,
      textDelta: delta,
    });
  }

  const finalText = await result.text;

  send("agent-end", {
    agentId: agent.id,
    round,
  });

  return finalText;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof roundtableRequestSchema>;
  try {
    const json = await request.json();
    body = roundtableRequestSchema.parse(json);
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const { topic, templateId } = body;
  const template = getTemplateById(templateId);

  if (!template) {
    return new Response("Template not found", { status: 400 });
  }

  const moderator = template.agents.find((a) => a.archetype === "moderator");
  const analysisAgents = template.agents.filter((a) => a.phase === "analysis");
  const discussionAgents = template.agents.filter(
    (a) => a.phase === "discussion" || a.phase === "analysis"
  );
  const decisionMaker = template.agents.find((a) => a.isDecisionMaker);

  // Agent name lookup for display
  const agentNameMap = new Map<string, string>();
  for (const agent of template.agents) {
    const nameParts = agent.nameKey.split(".");
    agentNameMap.set(agent.id, nameParts.at(-1) ?? agent.id);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encodeSSE(event, data));
      };

      const conversationHistory: ConversationMessage[] = [
        { content: topic, role: "user" },
      ];

      try {
        send("meeting-start", { templateId, topic });

        // ========================================
        // Phase 1: Moderator Opening
        // ========================================
        if (moderator) {
          send("phase-start", { phase: "opening" });

          const openingText = await streamAgent(
            moderator,
            agentNameMap.get(moderator.id) ?? "Moderator",
            conversationHistory,
            "opening",
            0,
            send
          );

          conversationHistory.push({
            content: `[${moderator.id}]: ${openingText}`,
            role: "assistant",
          });

          send("phase-end", { phase: "opening" });
        }

        // ========================================
        // Phase 2: Parallel Analysis
        // ========================================
        if (template.phases.hasParallelAnalysis && analysisAgents.length > 0) {
          send("phase-start", { phase: "analysis" });

          // Run all analysis agents in parallel
          const analysisPromises = analysisAgents.map(async (agent) => {
            const text = await streamAgent(
              agent,
              agentNameMap.get(agent.id) ?? agent.id,
              conversationHistory,
              "analysis",
              0,
              send
            );
            return { agent, text };
          });

          const results = await Promise.all(analysisPromises);

          // Add all results to conversation history (in order)
          for (const { agent, text } of results) {
            conversationHistory.push({
              content: `[${agent.id}]: ${text}`,
              role: "assistant",
            });
          }

          send("phase-end", { phase: "analysis" });
        }

        // ========================================
        // Phase 3: Discussion Rounds
        // ========================================
        const { discussionRounds } = template.phases;
        if (discussionRounds > 0 && discussionAgents.length > 0) {
          send("phase-start", { phase: "discussion" });

          for (let round = 0; round < discussionRounds; round += 1) {
            for (const agent of discussionAgents) {
              const text = await streamAgent(
                agent,
                agentNameMap.get(agent.id) ?? agent.id,
                conversationHistory,
                "discussion",
                round + 1,
                send
              );

              conversationHistory.push({
                content: `[${agent.id}]: ${text}`,
                role: "assistant",
              });
            }
          }

          send("phase-end", { phase: "discussion" });
        }

        // ========================================
        // Phase 4: Decision
        // ========================================
        if (template.phases.hasDecision && decisionMaker) {
          send("phase-start", { phase: "decision" });

          const decisionText = await streamAgent(
            decisionMaker,
            agentNameMap.get(decisionMaker.id) ?? "CEO",
            conversationHistory,
            "decision",
            0,
            send
          );

          conversationHistory.push({
            content: `[${decisionMaker.id}]: ${decisionText}`,
            role: "assistant",
          });

          send("phase-end", { phase: "decision" });
        }

        // ========================================
        // Phase 5: Moderator Summary (structured conclusion)
        // ========================================
        if (template.phases.hasSummary && moderator) {
          send("phase-start", { phase: "summary" });

          // Use a special summary prompt for the moderator
          const summaryAgent: RoundtableAgent = {
            ...moderator,
            systemPrompt: buildModeratorSummaryPrompt(),
          };

          const summaryText = await streamAgent(
            summaryAgent,
            agentNameMap.get(moderator.id) ?? "Moderator",
            conversationHistory,
            "summary",
            0,
            send
          );

          // Try to parse the conclusion as JSON
          let conclusion: MeetingConclusion;
          try {
            // Extract JSON from the response (in case there's extra text)
            const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : summaryText;
            conclusion = JSON.parse(jsonStr) as MeetingConclusion;
          } catch {
            // If parsing fails, create a fallback conclusion
            conclusion = {
              actionItems: [],
              decision: summaryText.slice(0, 500),
              dissentingOpinions: [],
              risks: [],
              summary: summaryText.slice(0, 500),
            };
          }

          send("conclusion", conclusion as unknown as Record<string, unknown>);

          send("phase-end", { phase: "summary" });
        }

        send("meeting-end", {});
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "Meeting failed",
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
