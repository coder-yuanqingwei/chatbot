import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  buildDetectiveCaseBriefingPrompt,
  buildDetectiveEvidenceAnalysisPrompt,
  DETECTIVE_AGENT,
} from "@/lib/detective/agents";
import { generateCase, getCaseSummary } from "@/lib/detective/case-generator";
import { encodeSSE, streamDetective } from "@/lib/detective/deepseek-stream";
import type { Phase } from "@/lib/detective/types";

export const maxDuration = 300;

const detectiveRequestSchema = z.object({
  scenario: z.string().min(1).max(10_000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof detectiveRequestSchema>;
  try {
    const text = await request.text();
    const json = JSON.parse(text);
    body = detectiveRequestSchema.parse(json);
  } catch (parseError) {
    const message =
      parseError instanceof Error ? parseError.message : String(parseError);
    console.error("[Detective] Request parse error:", message);
    return new Response(`Invalid request: ${message}`, { status: 400 });
  }

  const { scenario } = body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encodeSSE(event, data));
      };

      try {
        // Phase 0: Generate the case
        send("case-generating", { status: "generating" });

        const caseData = await generateCase(null, scenario);

        send("case-generated", caseData as unknown as Record<string, unknown>);

        const caseSummary = getCaseSummary(caseData);
        const conversationHistory: Array<{
          role: "user" | "assistant";
          content: string;
        }> = [{ content: caseSummary, role: "user" }];

        // Phase 1: Case Briefing
        send("phase-start", { phase: "case-briefing" as Phase });

        const briefingText = await streamDetective(
          DETECTIVE_AGENT.id,
          DETECTIVE_AGENT.name,
          DETECTIVE_AGENT.color,
          DETECTIVE_AGENT.icon,
          "case-briefing",
          0,
          buildDetectiveCaseBriefingPrompt(caseSummary),
          conversationHistory,
          send
        );

        conversationHistory.push({
          content: `[Detective]: ${briefingText}`,
          role: "assistant",
        });

        send("phase-end", { phase: "case-briefing" });

        // Phase 2: Evidence Review
        send("phase-start", { phase: "evidence-review" as Phase });

        const criticalEvidence = caseData.evidence
          .filter(
            (e) => e.significance === "critical" || e.significance === "major"
          )
          .map(
            (e) => `[${e.type}/${e.significance}] ${e.title}: ${e.description}`
          )
          .join("\n");

        const evidenceText = await streamDetective(
          DETECTIVE_AGENT.id,
          DETECTIVE_AGENT.name,
          DETECTIVE_AGENT.color,
          DETECTIVE_AGENT.icon,
          "evidence-review",
          1,
          buildDetectiveEvidenceAnalysisPrompt(caseSummary, criticalEvidence),
          conversationHistory,
          send
        );

        conversationHistory.push({
          content: `[Detective]: ${evidenceText}`,
          role: "assistant",
        });

        send("phase-end", { phase: "evidence-review" });

        // Phase 3: Interrogation
        send("phase-start", { phase: "interrogation" as Phase });
        send("waiting-input", { phase: "interrogation" });

        controller.close();
      } catch (error) {
        send("error", {
          message:
            error instanceof Error ? error.message : "Investigation failed",
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
