import { modeloDoGemini, variavelObrigatoria } from "@/lib/env";

export const modeloDoAssistente = () => ({
  id: `google/${modeloDoGemini()}` as const,
  apiKey: variavelObrigatoria("GEMINI_API_KEY"),
});
