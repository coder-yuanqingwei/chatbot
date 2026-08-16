import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        chatModel,
        titleModel: mockTitleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": mockTitleModel,
        },
      });
    })()
  : null;

// DeepSeek provider - direct API access via OpenAI-compatible endpoint
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
  baseURL: "https://api.deepseek.com/v1",
});

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  // Use DeepSeek v4-flash for all models
  return deepseek("deepseek-v4-flash");
}

export function getGuestModel() {
  console.log("[Providers] getGuestModel() called - using guest mock model");
  const { createGuestModel } = require("./models.guest");
  return createGuestModel();
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  // Use DeepSeek v4-flash for title generation
  return deepseek("deepseek-v4-flash");
}

export function getGuestTitleModel() {
  const { createGuestTitleModel } = require("./models.guest");
  return createGuestTitleModel();
}
