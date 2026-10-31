import { Agent } from "@mastra/core/agent";
import type {
  Assistente,
  ChamadaDeFerramenta,
} from "@/application/ports/assistente";
import type { Mensagem } from "@/domain/types";
import { criarFerramentasDoAssistente } from "./ferramentas";
import { construirInstrucoes } from "./instrucoes";
import {
  ESQUEMA_DA_SAIDA,
  INSTRUCOES_DA_SAIDA,
  normalizarSaida,
} from "./saida";
import type { ServicoDeChamadosRemoto } from "./servico-remoto";

export type ModeloDoAssistente = ConstructorParameters<
  typeof Agent
>[0]["model"];

export const MAXIMO_DE_PASSOS = 6;
export const TEMPO_MAXIMO_DA_RESPOSTA_EM_MS = 45_000;
const TEMPERATURA = 0.2;

function paraMensagemDoModelo({ autor, conteudo }: Mensagem) {
  switch (autor) {
    case "funcionario":
      return { role: "user" as const, content: conteudo };
    case "agent":
      return { role: "assistant" as const, content: conteudo };
    case "analista":
      return {
        role: "assistant" as const,
        content: `[Mensagem do analista] ${conteudo}`,
      };
    case "sistema":
      return { role: "system" as const, content: conteudo };
  }
}

export type DependenciasDoAssistente = {
  modelo: ModeloDoAssistente;
  servico: ServicoDeChamadosRemoto;
};

export function criarAssistenteNexo({
  modelo,
  servico,
}: DependenciasDoAssistente): Assistente {
  return {
    async responder({ funcionario, historico, agora }, acompanhamento = {}) {
      const chamadas: ChamadaDeFerramenta[] = [];

      const agent = new Agent({
        id: "nexo-assist",
        name: "Nexo Assist",
        instructions: construirInstrucoes({ funcionario, agora }),
        model: modelo,
        tools: criarFerramentasDoAssistente({
          funcionarioId: funcionario.id,
          servico,
          agora,
          registrar: (chamada) => {
            chamadas.push(chamada);
            acompanhamento.aoUsarFerramenta?.(chamada);
          },
        }),
      });

      const execucao = await agent.stream(historico.map(paraMensagemDoModelo), {
        maxSteps: MAXIMO_DE_PASSOS,
        modelSettings: {
          temperature: TEMPERATURA,
          timeout: { totalMs: TEMPO_MAXIMO_DA_RESPOSTA_EM_MS },
        },
        structuredOutput: {
          schema: ESQUEMA_DA_SAIDA,
          jsonPromptInjection: "system",
          instructions: INSTRUCOES_DA_SAIDA,
        },
      });

      for await (const parcial of execucao.objectStream) {
        if (typeof parcial.resposta === "string") {
          acompanhamento.aoAtualizarResposta?.(parcial.resposta);
        }
      }

      return {
        ...normalizarSaida(await execucao.object),
        chamadasDeFerramenta: chamadas,
      };
    },
  };
}
