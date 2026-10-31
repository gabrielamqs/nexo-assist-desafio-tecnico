import { criarAssistenteNexo } from "@/agent/assistente";
import { ambiente } from "@/lib/env";
import { criarCentralDeAjuda } from "./central-de-ajuda/repositorio-sqlite";
import { criarRepositorioDeConversas } from "./conversas/repositorio-sqlite";
import { banco } from "./db/client";
import { modeloDoAssistente } from "./llm/modelo";
import { criarServicoDeChamadosViaMcp } from "./mcp/cliente";
import { criarServidorMcp } from "./mcp/servidor";
import { comTentativas } from "./ticket-repo/com-tentativas";
import { criarVerificacaoDeDisponibilidade } from "./ticket-repo/indisponibilidade";
import { criarRepositorioDeChamados } from "./ticket-repo/repositorio-sqlite";
import { criarRepositorioDeUsuarios } from "./usuarios/repositorio-sqlite";

const memoizar = <T>(criar: () => T) => {
  let instancia: T | undefined;
  return () => (instancia ??= criar());
};

export const repositorioDeChamados = memoizar(() =>
  comTentativas(
    criarRepositorioDeChamados({
      banco: banco(),
      verificarDisponibilidade: criarVerificacaoDeDisponibilidade(
        ambiente().TICKET_SERVICE_FAILURE_RATE,
      ),
    }),
  ),
);

export const centralDeAjuda = memoizar(() => criarCentralDeAjuda(banco()));

export const repositorioDeUsuarios = memoizar(() =>
  criarRepositorioDeUsuarios(banco()),
);

export const repositorioDeConversas = memoizar(() =>
  criarRepositorioDeConversas({ banco: banco() }),
);

export const servidorMcp = memoizar(() =>
  criarServidorMcp({
    repositorioDeChamados: repositorioDeChamados(),
    centralDeAjuda: centralDeAjuda(),
  }),
);

export const assistente = memoizar(() =>
  criarAssistenteNexo({
    modelo: modeloDoAssistente(),
    servico: criarServicoDeChamadosViaMcp(new URL(ambiente().MCP_SERVER_URL)),
  }),
);
