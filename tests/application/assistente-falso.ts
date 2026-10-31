import type {
  Assistente,
  EntradaDoAssistente,
  SaidaDoAssistente,
} from "@/application/ports/assistente";

export function criarAssistenteFalso(
  saida: Partial<SaidaDoAssistente> | Error = {},
) {
  const recebidas: EntradaDoAssistente[] = [];

  const assistente: Assistente = {
    async responder(entrada) {
      recebidas.push(entrada);
      if (saida instanceof Error) throw saida;
      return {
        resposta: "Resposta do assistente.",
        entendimento: "Entendimento.",
        intencao: "conversa",
        confianca: 0.95,
        justificativa: "Justificativa.",
        opcoesRapidas: [],
        chamadasDeFerramenta: [],
        ...saida,
      };
    },
  };

  return { assistente, recebidas };
}
