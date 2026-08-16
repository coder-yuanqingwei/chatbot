import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  buildDetectiveInterrogationPrompt,
  buildDetectiveObservationPrompt,
  DETECTIVE_AGENT,
} from "@/lib/detective/agents";
import { getCaseSummary } from "@/lib/detective/case-generator";
import { encodeSSE, streamDetective } from "@/lib/detective/deepseek-stream";
import type {
  CaseData,
  InterrogationExchange,
  Phase,
  Suspect,
} from "@/lib/detective/types";

export const maxDuration = 300;

const interrogateRequestSchema = z.object({
  caseData: z.any(),
  deductions: z.array(z.any()),
  input: z.string().min(1).max(2000),
  interrogationLog: z.array(z.any()),
  previousMessages: z.array(z.any()),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof interrogateRequestSchema>;
  try {
    const json = await request.json();
    body = interrogateRequestSchema.parse(json);
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const { caseData: rawCaseData, input, interrogationLog: rawLog } = body;
  const caseData = rawCaseData as CaseData;
  const interrogationLog = rawLog as InterrogationExchange[];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encodeSSE(event, data));
      };

      try {
        send("phase-start", { phase: "interrogation" as Phase });

        const caseSummary = getCaseSummary(caseData);
        const round = interrogationLog.length + 2;

        const lowerInput = input.toLowerCase();
        const matchedSuspect = caseData.suspects.find(
          (s) =>
            lowerInput.includes(s.name.toLowerCase()) ||
            lowerInput.includes(s.id)
        );

        const conversationHistory: Array<{
          role: "user" | "assistant";
          content: string;
        }> = [{ content: caseSummary, role: "user" }];

        for (const ex of interrogationLog) {
          conversationHistory.push(
            {
              content: `[User asks ${ex.suspectName}]: ${ex.question}`,
              role: "user",
            },
            { content: `[${ex.suspectName}]: ${ex.answer}`, role: "assistant" }
          );
        }

        if (matchedSuspect) {
          const suspect = matchedSuspect as Suspect;
          const previousExchanges = interrogationLog
            .filter((ex) => ex.suspectId === suspect.id)
            .map((ex) => `Q: ${ex.question}\nA: ${ex.answer}`)
            .join("\n\n");

          const interrogationText = await streamDetective(
            suspect.id,
            suspect.name,
            suspect.color,
            suspect.icon,
            "interrogation",
            round,
            buildDetectiveInterrogationPrompt(
              caseSummary,
              suspect.name,
              suspect.background,
              suspect.alibi,
              suspect.personality,
              suspect.initialTestimony,
              previousExchanges,
              input
            ),
            [
              ...conversationHistory,
              {
                content: `[User asks ${suspect.name}]: ${input}`,
                role: "user",
              },
            ],
            send
          );

          const contradictionFound =
            suspect.isCulprit &&
            (interrogationText.toLowerCase().includes("inconsisten") ||
              interrogationText.toLowerCase().includes("contradict") ||
              interrogationText.toLowerCase().includes("矛盾") ||
              interrogationText.toLowerCase().includes("不一致"));

          const exchange: InterrogationExchange = {
            answer:
              interrogationText.split("DETECTIVE:")[0]?.trim() ||
              interrogationText,
            contradictionFound,
            question: input,
            suspectId: suspect.id,
            suspectName: suspect.name,
          };

          send(
            "interrogation-exchange",
            exchange as unknown as Record<string, unknown>
          );
        } else {
          await streamDetective(
            DETECTIVE_AGENT.id,
            DETECTIVE_AGENT.name,
            DETECTIVE_AGENT.color,
            DETECTIVE_AGENT.icon,
            "interrogation",
            round,
            buildDetectiveObservationPrompt(caseSummary, input),
            [
              ...conversationHistory,
              { content: `[User]: ${input}`, role: "user" },
            ],
            send
          );
        }

        send("phase-end", { phase: "interrogation" });
        send("waiting-input", { phase: "interrogation" });

        controller.close();
      } catch (error) {
        send("error", {
          message:
            error instanceof Error ? error.message : "Interrogation failed",
        });
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
