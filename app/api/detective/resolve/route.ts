import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  buildDetectiveDeductionPrompt,
  buildDetectiveRevelationPrompt,
  DETECTIVE_AGENT,
} from "@/lib/detective/agents";
import { getCaseSummary } from "@/lib/detective/case-generator";
import { encodeSSE, streamDetective } from "@/lib/detective/deepseek-stream";
import type {
  CaseConclusion,
  CaseData,
  Deduction,
  InterrogationExchange,
  Phase,
} from "@/lib/detective/types";

export const maxDuration = 300;

const resolveRequestSchema = z.object({
  caseData: z.any(),
  deductions: z.array(z.any()),
  interrogationLog: z.array(z.any()),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof resolveRequestSchema>;
  try {
    const json = await request.json();
    body = resolveRequestSchema.parse(json);
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const {
    caseData: rawCaseData,
    interrogationLog: rawLog,
    deductions: rawDeductions,
  } = body;
  const caseData = rawCaseData as CaseData;
  const interrogationLog = rawLog as InterrogationExchange[];
  const existingDeductions = rawDeductions as Deduction[];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encodeSSE(event, data));
      };

      try {
        const caseSummary = getCaseSummary(caseData);

        const conversationHistory: Array<{
          role: "user" | "assistant";
          content: string;
        }> = [{ content: caseSummary.slice(0, 2000), role: "user" }];

        for (const ex of interrogationLog) {
          const entry = `[Interrogation - ${ex.suspectName}]: Q: ${ex.question} | A: ${ex.answer}`;
          conversationHistory.push({
            content: entry.slice(0, 500),
            role: "user",
          });
        }

        if (conversationHistory.length > 12) {
          conversationHistory.splice(2, conversationHistory.length - 12);
        }

        send("phase-start", { phase: "deduction" as Phase });

        const allEvidence = caseData.evidence
          .map(
            (e) =>
              `[${e.type}/${e.significance}] ${e.title}: ${e.description.slice(0, 100)}`
          )
          .join("\n");

        const interrogationSummary = interrogationLog
          .map(
            (ex) =>
              `${ex.suspectName}: Q="${ex.question}" A="${ex.answer.slice(0, 150)}" ${ex.contradictionFound ? "⚠️ CONTRADICTION" : ""}`
          )
          .join("\n");

        let deductionText = "";
        try {
          deductionText = await streamDetective(
            DETECTIVE_AGENT.id,
            DETECTIVE_AGENT.name,
            DETECTIVE_AGENT.color,
            DETECTIVE_AGENT.icon,
            "deduction",
            10,
            buildDetectiveDeductionPrompt(
              caseSummary.slice(0, 1500),
              interrogationSummary.slice(0, 2000),
              allEvidence.slice(0, 2000)
            ),
            conversationHistory,
            send
          );
        } catch (deductionError) {
          deductionText = `Deduction analysis could not be generated: ${deductionError instanceof Error ? deductionError.message : "unknown error"}. Proceeding with available data.`;
        }

        conversationHistory.push({
          content: `[Detective]: ${deductionText.slice(0, 500)}`,
          role: "assistant",
        });

        for (const suspect of caseData.suspects) {
          const relatedEvidence = caseData.evidence
            .filter((e) => e.relatedSuspectId === suspect.id)
            .map((e) => e.title);
          const suspectContradictions = interrogationLog
            .filter(
              (ex) => ex.suspectId === suspect.id && ex.contradictionFound
            )
            .map((ex) => ex.question);

          const deduction: Deduction = {
            confidence: suspect.isCulprit ? 85 : 20,
            contradictions: suspectContradictions,
            evidence: relatedEvidence,
            reasoning: deductionText.slice(0, 200),
            suspectId: suspect.id,
            suspectName: suspect.name,
          };

          send(
            "deduction-update",
            deduction as unknown as Record<string, unknown>
          );
        }

        send("phase-end", { phase: "deduction" });

        send("phase-start", { phase: "revelation" as Phase });

        const culprit = caseData.suspects.find((s) => s.isCulprit);

        if (culprit) {
          let revelationText = "";
          try {
            revelationText = await streamDetective(
              DETECTIVE_AGENT.id,
              DETECTIVE_AGENT.name,
              DETECTIVE_AGENT.color,
              DETECTIVE_AGENT.icon,
              "revelation",
              11,
              buildDetectiveRevelationPrompt(
                caseSummary.slice(0, 1500),
                culprit.name,
                culprit.motive,
                deductionText.slice(0, 300)
              ),
              conversationHistory.slice(-4),
              send
            );
          } catch {
            revelationText = `Based on the evidence, the culprit is ${culprit.name}. Their motive was ${culprit.motive}. Key contradictions in their story and critical evidence pointing to them have been identified.`;
            send("text-delta", {
              agentId: DETECTIVE_AGENT.id,
              round: 11,
              textDelta: revelationText,
            });
          }

          const conclusion: CaseConclusion = {
            culpritId: culprit.id,
            culpritName: culprit.name,
            deductions: existingDeductions,
            keyEvidence: caseData.evidence
              .filter(
                (e) =>
                  e.relatedSuspectId === culprit.id &&
                  e.significance === "critical"
              )
              .map((e) => e.title),
            method: revelationText.slice(0, 200),
            motive: culprit.motive,
            redHerrings: caseData.evidence
              .filter(
                (e) =>
                  e.significance === "minor" &&
                  e.relatedSuspectId !== culprit.id
              )
              .map((e) => e.title),
            summary: revelationText.slice(0, 500),
          };

          send("conclusion", conclusion as unknown as Record<string, unknown>);
        }

        send("phase-end", { phase: "revelation" });
        send("case-end", {});

        controller.close();
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "Resolution failed",
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
