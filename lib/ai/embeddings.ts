import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

export const EMBEDDING_DIMENSIONS = 1536;

function getEmbeddingModel() {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "",
  });

  return openai.embedding("text-embedding-3-small");
}

export function isEmbeddingAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    providerOptions: {
      openai: { dimensions: EMBEDDING_DIMENSIONS },
    },
    value: text,
  });

  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    providerOptions: {
      openai: { dimensions: EMBEDDING_DIMENSIONS },
    },
    values: texts,
  });

  return embeddings;
}
