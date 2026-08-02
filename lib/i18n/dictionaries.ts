import en from "./en.json" with { type: "json" };
import zh from "./zh.json" with { type: "json" };

export type Locale = "en" | "zh";

export const dictionaries = {
  en,
  zh,
} as const;
