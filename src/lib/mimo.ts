import OpenAI from "openai";

const baseURL =
  process.env.MIMO_BASE_URL?.trim() || "https://api.xiaomimimo.com/v1";

const apiKey = process.env.MIMO_API_KEY?.trim();

export const MIMO_MODELS = {
  pro: process.env.MIMO_MODEL_PRO?.trim() || "mimo-v2-pro",
  omni: process.env.MIMO_MODEL_OMNI?.trim() || "mimo-v2-omni",
  flash: process.env.MIMO_MODEL_FLASH?.trim() || "mimo-v2-flash",
  tts: process.env.MIMO_MODEL_TTS?.trim() || "mimo-v2-tts",
} as const;

export function getMimoClient(): OpenAI {
  if (!apiKey) {
    throw new Error(
      "MIMO_API_KEY is not set. Add it to .env.local — get a key at https://platform.xiaomimimo.com.",
    );
  }
  return new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: {
      "api-key": apiKey,
    },
  });
}

export function hasMimoKey(): boolean {
  return Boolean(apiKey);
}

export const MIMO_BASE_URL = baseURL;
