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

const customAPIURL = process.env.CUSTOM_API_URL;
const customAPIKey = process.env.CUSTOM_API_KEY;
const customModelName = process.env.CUSTOM_MODEL_NAME ?? "default";

function createProvider() {
  if (customAPIURL && customAPIKey) {
    return createOpenAI({
      apiKey: customAPIKey,
      baseURL: customAPIURL,
    });
  }

  return createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    baseURL: "https://api.deepseek.com/v1",
  });
}

const provider = createProvider();

export function getModelName(): string {
  if (customAPIURL && customAPIKey) {
    return customModelName;
  }
  return "deepseek-v4-flash";
}

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  return provider(getModelName());
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

  return provider(getModelName());
}

export function getGuestTitleModel() {
  const { createGuestTitleModel } = require("./models.guest");
  return createGuestTitleModel();
}
