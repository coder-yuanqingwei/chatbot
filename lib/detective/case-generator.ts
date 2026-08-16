import type {
  CaseData,
  Evidence,
  Location,
  Suspect,
  TimelineEvent,
} from "./types";

const SUSPECT_COLORS = ["red", "blue", "green", "amber", "purple"];
const SUSPECT_ICONS = ["user", "crown", "wrench", "lightbulb", "palette"];

function buildCaseGenerationPrompt(userScenario: string): string {
  return `You are a master mystery writer creating a detective case. Generate a complete, solvable mystery case based on the user's scenario.

${userScenario ? `The user provided this scenario: "${userScenario}"` : "Create an original corporate espionage/mystery case."}

Requirements:
1. Create exactly 5 suspects with detailed backgrounds. Exactly ONE is the culprit (isCulprit: true).
2. Create exactly 10 pieces of evidence. At least 3 should be "critical" significance and point toward the culprit. Include 2-3 red herring pieces.
3. Create exactly 8-10 timeline events in chronological order. Include some red herring events.
4. Create exactly 3 locations relevant to the case.
5. Each suspect needs:
   - A plausible alibi (the culprit's alibi should have subtle holes)
   - A clear motive (even if innocent)
   - personality traits (nervous, confident, evasive, etc.)
   - initialTestimony: what they say when first approached
   - interrogationResponses with three fields:
     - alibiDetails: detailed response about their alibi
     - relationshipToVictim: response about their relationship with the victim
     - whereaboutDetails: response about their whereabouts at the time of the crime
     The culprit should have responses that contain subtle contradictions.
   - contradictions: list of specific contradictions in their story (empty for non-culprits unless they're hiding something unrelated)
6. The case should be solvable by analyzing evidence, timeline, and interrogation contradictions.
7. All IDs should be simple strings like "suspect-1", "evidence-1", "event-1", "loc-1".

IMPORTANT: Make the mystery challenging but fair. The culprit should be identifiable through careful analysis of contradictions and evidence alignment.

You MUST respond with ONLY a valid JSON object matching this exact structure (no markdown, no code fences):
{
  "title": "string",
  "summary": "string",
  "difficulty": "easy" | "medium" | "hard",
  "culpritId": "string",
  "suspects": [{ "id": "string", "name": "string", "title": "string", "background": "string", "alibi": "string", "motive": "revenge"|"money"|"cover-up"|"ambition"|"loyalty"|"fear", "personality": "string", "initialTestimony": "string", "interrogationResponses": { "alibiDetails": "string", "relationshipToVictim": "string", "whereaboutDetails": "string" }, "contradictions": ["string"], "isCulprit": boolean }],
  "evidence": [{ "id": "string", "title": "string", "description": "string", "type": "physical"|"digital"|"testimony"|"document", "significance": "critical"|"major"|"minor", "foundAt": "string", "timestamp": "string", "relatedSuspectId": "string" | null }],
  "timeline": [{ "id": "string", "description": "string", "timestamp": "string", "locationId": "string", "involvedSuspectIds": ["string"], "isRedHerring": boolean }],
  "locations": [{ "id": "string", "name": "string", "description": "string", "searchResults": ["string"] }]
}

Respond in the same language as the user's input (Chinese if Chinese, English if English).`;
}

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    return fenced[1].trim();
  }

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return text.trim();
}

function normalizeCase(raw: Record<string, unknown>): CaseData {
  const suspects = Array.isArray(raw.suspects) ? raw.suspects : [];
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];
  const timeline = Array.isArray(raw.timeline) ? raw.timeline : [];
  const locations = Array.isArray(raw.locations) ? raw.locations : [];

  const normalizedSuspects: Suspect[] = suspects.map(
    (s: Record<string, unknown>, i: number) => ({
      alibi: String(s.alibi ?? ""),
      background: String(s.background ?? ""),
      color: SUSPECT_COLORS[i % SUSPECT_COLORS.length],
      contradictions: Array.isArray(s.contradictions)
        ? (s.contradictions as unknown[]).map(String)
        : [],
      icon: SUSPECT_ICONS[i % SUSPECT_ICONS.length],
      id: String(s.id ?? `suspect-${i + 1}`),
      initialTestimony: String(s.initialTestimony ?? ""),
      interrogationResponses: (() => {
        const r = (s.interrogationResponses ?? {}) as Record<string, unknown>;
        return {
          alibiDetails: String(r.alibiDetails ?? r.alibi_details ?? ""),
          relationshipToVictim: String(
            r.relationshipToVictim ?? r.relationship_to_victim ?? ""
          ),
          whereaboutDetails: String(
            r.whereaboutDetails ?? r.whereabout_details ?? ""
          ),
        };
      })(),
      isCulprit: Boolean(s.isCulprit),
      motive: ([
        "revenge",
        "money",
        "cover-up",
        "ambition",
        "loyalty",
        "fear",
      ].includes(s.motive as string)
        ? s.motive
        : "money") as Suspect["motive"],
      name: String(s.name ?? `Suspect ${i + 1}`),
      personality: String(s.personality ?? ""),
      title: String(s.title ?? ""),
    })
  );

  const culprit = normalizedSuspects.find((s) => s.isCulprit);

  const normalizedEvidence: Evidence[] = evidence.map(
    (e: Record<string, unknown>, i: number) => ({
      description: String(e.description ?? ""),
      foundAt: String(e.foundAt ?? ""),
      id: String(e.id ?? `evidence-${i + 1}`),
      relatedSuspectId:
        e.relatedSuspectId === null ? null : String(e.relatedSuspectId),
      significance: (["critical", "major", "minor"].includes(
        e.significance as string
      )
        ? e.significance
        : "minor") as Evidence["significance"],
      timestamp: String(e.timestamp ?? ""),
      title: String(e.title ?? ""),
      type: (["physical", "digital", "testimony", "document"].includes(
        e.type as string
      )
        ? e.type
        : "physical") as Evidence["type"],
    })
  );

  const normalizedTimeline: TimelineEvent[] = timeline.map(
    (e: Record<string, unknown>, i: number) => ({
      description: String(e.description ?? ""),
      id: String(e.id ?? `event-${i + 1}`),
      involvedSuspectIds: Array.isArray(e.involvedSuspectIds)
        ? (e.involvedSuspectIds as unknown[]).map(String)
        : [],
      isRedHerring: Boolean(e.isRedHerring),
      locationId: String(e.locationId ?? ""),
      timestamp: String(e.timestamp ?? ""),
    })
  );

  const normalizedLocations: Location[] = locations.map(
    (l: Record<string, unknown>, i: number) => ({
      description: String(l.description ?? ""),
      id: String(l.id ?? `loc-${i + 1}`),
      name: String(l.name ?? ""),
      searchResults: Array.isArray(l.searchResults)
        ? (l.searchResults as unknown[]).map(String)
        : [],
    })
  );

  return {
    culpritId: String(raw.culpritId ?? culprit?.id ?? ""),
    difficulty: (["easy", "medium", "hard"].includes(raw.difficulty as string)
      ? raw.difficulty
      : "medium") as CaseData["difficulty"],
    evidence: normalizedEvidence,
    locations: normalizedLocations,
    summary: String(raw.summary ?? ""),
    suspects: normalizedSuspects,
    timeline: normalizedTimeline,
    title: String(raw.title ?? "Untitled Case"),
  };
}

async function callDeepSeekAPI(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY ?? "";
  const baseURL =
    process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1";

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);

      const response = await fetch(`${baseURL}/chat/completions`, {
        body: JSON.stringify({
          max_tokens: 16_384,
          messages: [{ content: prompt, role: "user" }],
          model: "deepseek-chat",
          temperature: 0.7,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from DeepSeek API");
      }

      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, (attempt + 1) * 2000)
        );
      }
    }
  }

  throw lastError ?? new Error("Failed to call DeepSeek API after 3 attempts");
}

export async function generateCase(
  _model: unknown,
  userScenario: string
): Promise<CaseData> {
  const text = await callDeepSeekAPI(buildCaseGenerationPrompt(userScenario));
  const jsonStr = extractJSON(text);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    throw new Error(`Failed to parse case JSON: ${jsonStr.slice(0, 200)}`);
  }

  return normalizeCase(parsed);
}

export function getCaseSummary(caseData: CaseData): string {
  const suspectList = caseData.suspects
    .map((s) => `- ${s.name} (${s.title}): ${s.background.slice(0, 80)}...`)
    .join("\n");

  const evidenceList = caseData.evidence
    .map(
      (e) =>
        `- [${e.type}/${e.significance}] ${e.title}: ${e.description.slice(0, 60)}...`
    )
    .join("\n");

  const timelineList = caseData.timeline
    .map((e) => `- ${e.timestamp}: ${e.description}`)
    .join("\n");

  return `CASE: ${caseData.title}
${caseData.summary}

SUSPECTS:
${suspectList}

EVIDENCE:
${evidenceList}

TIMELINE:
${timelineList}`;
}
