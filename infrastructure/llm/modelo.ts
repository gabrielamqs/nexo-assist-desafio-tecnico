import { ambiente, chaveDoGemini } from "@/lib/env";

export const modeloDoAssistente = () => ({
  id: `google/${ambiente().GEMINI_MODEL}` as const,
  apiKey: chaveDoGemini(),
});
