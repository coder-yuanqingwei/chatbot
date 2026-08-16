import type { LanguageModel } from "ai";

const mockReasoningSteps = [
  "Let me think about this question carefully...",
  "The user is asking about a topic that requires analysis.",
  "I should consider multiple perspectives here.",
  "Let me break this down into logical steps.",
  "First, I need to understand the core intent of the query.",
  "Now I'm evaluating the best way to structure my response.",
  "I want to make sure my answer is clear and helpful.",
  "Let me refine my thinking and prepare the final answer.",
];

const mockResponses: Record<string, { reasoning: string[]; response: string }> =
  {
    code: {
      reasoning: [
        "This appears to be a programming-related question.",
        "Code questions need careful technical analysis.",
        "I should consider edge cases and best practices.",
        "Let me structure a clear code example.",
        "Making sure the explanation is beginner-friendly.",
      ],
      response:
        "Here's a clean approach to solve this:\n\n```typescript\nfunction example() {\n  // Your solution here\n  return 'Hello from guest mode!';\n}\n```\n\nAs you can see, I reasoned through the problem step by step before writing this code!",
    },
    default: {
      reasoning: mockReasoningSteps,
      response:
        "Based on my analysis, I can provide you with a thoughtful response. This mock demonstrates the reasoning stream feature where you can see the AI's thought process in real-time. The timeline view shows each step of my thinking before I present the final answer.",
    },
    greeting: {
      reasoning: [
        "The user is greeting me!",
        "This is a simple social interaction.",
        "I should respond warmly and offer assistance.",
        "A friendly greeting will set a positive tone.",
        "Ready to formulate my response now.",
      ],
      response:
        "Hello! 👋 Welcome! I'm your AI assistant running in guest mode with simulated reasoning. You can see my thought process unfolding above in real-time. Feel free to ask me anything - I'll show you how I think through each question!",
    },
    weather: {
      reasoning: [
        "The user is asking about weather conditions.",
        "Weather queries require location context.",
        "Since this is a mock, I'll provide a sample response.",
        "In a real implementation, I would call the weather tool here.",
        "Preparing a helpful weather response.",
      ],
      response:
        "The weather looks great today! ☀️ In this guest mode demo, I'm showing you my internal reasoning process. Notice how I break down the problem step by step before giving you the final answer above.",
    },
  };

function getResponseForPrompt(prompt: unknown) {
  const promptStr = JSON.stringify(prompt).toLowerCase();

  if (promptStr.includes("weather") || promptStr.includes("temperature")) {
    return mockResponses.weather;
  }
  if (
    promptStr.includes("hello") ||
    promptStr.includes("hi") ||
    promptStr.includes("hey") ||
    promptStr.includes("你好")
  ) {
    return mockResponses.greeting;
  }
  if (
    promptStr.includes("code") ||
    promptStr.includes("programming") ||
    promptStr.includes("函数") ||
    promptStr.includes("代码")
  ) {
    return mockResponses.code;
  }

  return mockResponses.default;
}

const mockUsage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 15, total: 15 },
  outputTokens: { reasoning: 80, text: 50, total: 130 },
};

export const createGuestModel = (): LanguageModel =>
  ({
    defaultObjectGenerationMode: "tool",
    doGenerate: async ({ prompt }: { prompt: unknown }) => {
      const { reasoning, response } = getResponseForPrompt(prompt);
      return {
        content: [
          ...reasoning.map((text) => ({ text, type: "reasoning" as const })),
          { text: response, type: "text" as const },
        ],
        finishReason: "stop",
        usage: mockUsage,
        warnings: [],
      };
    },
    doStream: ({ prompt }: { prompt: unknown }) => {
      const { reasoning, response } = getResponseForPrompt(prompt);
      const words = response.split(" ");

      return {
        stream: new ReadableStream({
          async start(controller) {
            const reasoningId = "r1";
            const textId = "t1";

            controller.enqueue({ id: reasoningId, type: "reasoning-start" });

            for (const [index, step] of reasoning.entries()) {
              await new Promise((resolve) =>
                setTimeout(resolve, 150 + index * 50)
              );
              controller.enqueue({
                delta: step,
                id: reasoningId,
                type: "reasoning-delta",
              });
            }

            controller.enqueue({ id: reasoningId, type: "reasoning-end" });

            await new Promise((resolve) => setTimeout(resolve, 200));

            controller.enqueue({ id: textId, type: "text-start" });

            for (const word of words) {
              await new Promise((resolve) =>
                setTimeout(resolve, 30 + Math.random() * 40)
              );
              controller.enqueue({
                delta: `${word} `,
                id: textId,
                type: "text-delta",
              });
            }

            controller.enqueue({ id: textId, type: "text-end" });
            controller.enqueue({
              finishReason: "stop",
              type: "finish",
              usage: mockUsage,
            });
            controller.close();
          },
        }),
      };
    },
    modelId: "guest-mock-model",
    provider: "guest-mock",
    specificationVersion: "v3",
    supportedUrls: {},
  }) as unknown as LanguageModel;

export const createGuestTitleModel = (): LanguageModel =>
  ({
    defaultObjectGenerationMode: "tool",
    doGenerate: async () => ({
      content: [{ text: "Guest Conversation", type: "text" as const }],
      finishReason: "stop",
      usage: {
        inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 5, total: 5 },
        outputTokens: { reasoning: 0, text: 5, total: 5 },
      },
      warnings: [],
    }),
    doStream: () => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ id: "t1", type: "text-start" });
          controller.enqueue({
            delta: "Guest Conversation",
            id: "t1",
            type: "text-delta",
          });
          controller.enqueue({ id: "t1", type: "text-end" });
          controller.enqueue({
            finishReason: "stop",
            type: "finish",
            usage: {
              inputTokens: {
                cacheRead: 0,
                cacheWrite: 0,
                noCache: 5,
                total: 5,
              },
              outputTokens: { reasoning: 0, text: 5, total: 5 },
            },
          });
          controller.close();
        },
      }),
    }),
    modelId: "guest-title-model",
    provider: "guest-mock",
    specificationVersion: "v3",
    supportedUrls: {},
  }) as unknown as LanguageModel;
