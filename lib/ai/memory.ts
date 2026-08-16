import { generateObject } from "ai";
import { z } from "zod";
import {
  type RetrievedMemory,
  saveMemory,
  searchMemories,
} from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { embedText, embedTexts, isEmbeddingAvailable } from "./embeddings";
import { DEFAULT_CHAT_MODEL } from "./models";
import { getLanguageModel } from "./providers";

const memoryExtractionPrompt = `You are a memory extraction engine. Your task is to analyze the conversation and extract important, memorable facts about the user that would be valuable for future conversations.

Focus on extracting:
1. Personal preferences (programming languages, frameworks, tools, design styles)
2. Ongoing projects (what the user is building, working on, or planning)
3. Technical context (hardware specs, performance requirements, environment details)
4. Background facts (role, expertise, goals, constraints)
5. Opinions and tastes (likes, dislikes, aesthetic preferences)

Rules:
- Only extract facts that are worth remembering long-term (not small talk or greetings)
- Each memory must be self-contained and understandable without the original conversation context
- Rephrase extracted information into clear, standalone statements
- Do NOT extract the assistant's responses or general knowledge
- If there's nothing worth remembering, return an empty memories array

Examples of good memories:
- "User is building a Swift lyrics app targeting 120Hz refresh rate"
- "User prefers TypeScript over JavaScript"
- "User's development environment uses macOS"
- "User is interested in 60fps animation optimization"

Examples of bad memories (do NOT extract):
- "User said hello"
- "The assistant explained what TypeScript is"
- "User asked a question about weather"`;

const memorySchema = z.object({
  memories: z
    .array(
      z.object({
        category: z
          .enum(["preference", "project", "fact", "context", "goal"])
          .describe(
            "The category of this memory: preference, project, fact, context, or goal"
          ),
        content: z
          .string()
          .describe(
            "The full memory text, self-contained and understandable without context"
          ),
        importance: z
          .number()
          .min(1)
          .max(5)
          .describe(
            "Importance score: 1=trivial, 5=critical for future conversations"
          ),
        summary: z
          .string()
          .describe("A short 5-10 word summary for quick reference"),
      })
    )
    .describe(
      "Array of extracted memories. Empty if nothing worth remembering."
    ),
});

type ExtractedMemory = z.infer<typeof memorySchema>["memories"][number];

function formatConversationForExtraction(messages: ChatMessage[]): string {
  const recentMessages = messages.slice(-12);
  return recentMessages
    .map((msg) => {
      const text = msg.parts
        .filter((part) => part.type === "text")
        .map((part) => (part as { type: "text"; text: string }).text)
        .join("");
      return `${msg.role === "user" ? "User" : "Assistant"}: ${text}`;
    })
    .join("\n\n");
}

export async function extractAndStoreMemories({
  chatId,
  messages,
  userId,
}: {
  chatId: string;
  messages: ChatMessage[];
  userId: string;
}): Promise<number> {
  if (!isEmbeddingAvailable()) {
    return 0;
  }

  try {
    const conversationText = formatConversationForExtraction(messages);
    if (!conversationText.trim()) {
      return 0;
    }

    const { object } = await generateObject({
      instructions: memoryExtractionPrompt,
      model: getLanguageModel(DEFAULT_CHAT_MODEL),
      prompt: conversationText,
      schema: memorySchema,
    });

    if (!object.memories || object.memories.length === 0) {
      return 0;
    }

    const memories: ExtractedMemory[] = object.memories;
    const memoryTexts = memories.map((m) => `${m.summary}: ${m.content}`);
    const embeddings = await embedTexts(memoryTexts);

    const storePromises = memories.map((memory, index) =>
      saveMemory({
        category: memory.category,
        chatId,
        content: memory.content,
        embedding: embeddings[index] ?? null,
        importance: memory.importance,
        summary: memory.summary,
        userId,
      })
    );

    await Promise.all(storePromises);

    return memories.length;
  } catch (error) {
    console.error("[Memory] Extraction failed:", error);
    return 0;
  }
}

export async function retrieveRelevantMemories({
  limit = 5,
  queryText,
  threshold = 0.3,
  userId,
}: {
  limit?: number;
  queryText: string;
  threshold?: number;
  userId: string;
}): Promise<RetrievedMemory[]> {
  if (!isEmbeddingAvailable()) {
    return [];
  }

  try {
    const queryEmbedding = await embedText(queryText);
    const memories = await searchMemories({
      embedding: queryEmbedding,
      limit,
      threshold,
      userId,
    });

    return memories;
  } catch (error) {
    console.error("[Memory] Retrieval failed:", error);
    return [];
  }
}

export function formatMemoriesForPrompt(memories: RetrievedMemory[]): string {
  if (memories.length === 0) {
    return "";
  }

  const memoryLines = memories
    .map((memory, index) => {
      const similarityPct = Math.round(memory.similarity * 100);
      return `${index + 1}. [${memory.category}|importance:${memory.importance}] ${memory.content} (relevance: ${similarityPct}%)`;
    })
    .join("\n");

  return `## Long-term Memory

You have access to the user's long-term memories from previous conversations. These are facts and preferences the user has shared over time. Use them to provide personalized, context-aware responses. When a memory is relevant to the current conversation, reference it naturally — the user should feel that you remember them.

Retrieved memories (sorted by relevance):
${memoryLines}`;
}
