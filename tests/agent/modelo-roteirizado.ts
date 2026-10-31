import {
  MastraLanguageModelV2Mock,
  simulateReadableStream,
} from "@mastra/core/test-utils/llm-mock";

const USO = { inputTokens: 100, outputTokens: 20, totalTokens: 120 };

export type PassoRoteirizado =
  | { tipo: "ferramenta"; nome: string; entrada: Record<string, unknown> }
  | { tipo: "texto"; partes: string[] };

type ParteDoStream =
  | { type: "stream-start"; warnings: [] }
  | { type: "tool-call"; toolCallId: string; toolName: string; input: string }
  | { type: "text-start" | "text-end"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "finish"; finishReason: "tool-calls" | "stop"; usage: typeof USO };

function chunksDoPasso(
  passo: PassoRoteirizado,
  indice: number,
): ParteDoStream[] {
  if (passo.tipo === "ferramenta") {
    return [
      { type: "stream-start", warnings: [] },
      {
        type: "tool-call",
        toolCallId: `chamada-${indice}`,
        toolName: passo.nome,
        input: JSON.stringify(passo.entrada),
      },
      { type: "finish", finishReason: "tool-calls", usage: USO },
    ];
  }

  return [
    { type: "stream-start", warnings: [] },
    { type: "text-start", id: `texto-${indice}` },
    ...passo.partes.map((delta): ParteDoStream => ({
      type: "text-delta",
      id: `texto-${indice}`,
      delta,
    })),
    { type: "text-end", id: `texto-${indice}` },
    { type: "finish", finishReason: "stop", usage: USO },
  ];
}

export function criarModeloRoteirizado(passos: PassoRoteirizado[]) {
  const prompts: unknown[] = [];

  const modelo = new MastraLanguageModelV2Mock({
    doStream: async (opcoes) => {
      const indice = prompts.length;
      prompts.push(opcoes.prompt);
      const passo = passos[indice];
      if (passo === undefined) {
        throw new Error(`O roteiro não previa o passo ${indice + 1}.`);
      }
      return {
        stream: simulateReadableStream({
          chunks: chunksDoPasso(passo, indice),
          initialDelayInMs: 0,
          chunkDelayInMs: 0,
        }),
      };
    },
  });

  return { modelo, prompts };
}

export const respostaEmJson = (objeto: object, tamanhoDaParte = 24) => {
  const texto = JSON.stringify(objeto);
  const partes: string[] = [];
  for (let inicio = 0; inicio < texto.length; inicio += tamanhoDaParte) {
    partes.push(texto.slice(inicio, inicio + tamanhoDaParte));
  }
  return partes;
};
