const isCustomAPI = !!(
  process.env.CUSTOM_API_URL && process.env.CUSTOM_API_KEY
);

const modelName = isCustomAPI
  ? (process.env.CUSTOM_MODEL_NAME ?? "default")
  : "deepseek-v4-flash";

const providerName = isCustomAPI
  ? (process.env.CUSTOM_API_URL ?? "").replace(/https?:\/\//, "").split("/")[0]
  : "deepseek";

export const DEFAULT_CHAT_MODEL = isCustomAPI
  ? `custom/${modelName}`
  : "deepseek/deepseek-v4-flash";

export const titleModel = {
  description: isCustomAPI
    ? `Custom model: ${modelName}`
    : "Fast model for title generation",
  id: DEFAULT_CHAT_MODEL,
  name: isCustomAPI ? modelName : "DeepSeek V4 Flash",
  provider: providerName,
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  gatewayOrder?: string[];
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
};

export const chatModels: ChatModel[] = [
  {
    description: isCustomAPI
      ? `Custom API model: ${modelName}`
      : "Fast and capable model with tool use",
    id: DEFAULT_CHAT_MODEL,
    name: isCustomAPI ? modelName : "DeepSeek V4 Flash",
    provider: providerName,
  },
];

export function getCapabilities(): Record<string, ModelCapabilities> {
  const results = chatModels.map((model) => [
    model.id,
    {
      reasoning: model.reasoningEffort !== undefined,
      tools: true,
      vision: false,
    },
  ]);

  return Object.fromEntries(results);
}

export const isDemo = process.env.IS_DEMO === "1";

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export function getAllGatewayModels(): GatewayModelWithCapabilities[] {
  return [];
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

export type ModelAvailability = "healthy" | "impacted" | "unknown";

export function getModelAvailability(_modelId: string): ModelAvailability {
  return "healthy";
}
