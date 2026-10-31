import type { Conversa, EstadoDaConversa } from "./types";

export const ESTADOS_EM_ANDAMENTO: readonly EstadoDaConversa[] = [
  "com_agent",
  "aguardando_analista",
  "com_analista",
];

export const estaEncerrada = (conversa: Conversa) =>
  conversa.estado === "encerrada";

export const agentEstaPausado = (conversa: Conversa) =>
  conversa.estado !== "com_agent";

export const podeAssumir = (conversa: Conversa) =>
  conversa.estado === "com_agent" || conversa.estado === "aguardando_analista";

export const podeDevolverAoAgent = (conversa: Conversa) =>
  conversa.estado === "com_analista";

export const podeEncerrar = (conversa: Conversa) => !estaEncerrada(conversa);

export const atendidaPor = (conversa: Conversa, analistaId: string) =>
  conversa.estado === "com_analista" && conversa.analistaId === analistaId;

export const FILTROS_DA_FILA = [
  "para_voce",
  "com_agent",
  "minhas",
  "encerradas",
  "todas",
] as const;
export type FiltroDaFila = (typeof FILTROS_DA_FILA)[number];

export const FILTRO_PADRAO: FiltroDaFila = "para_voce";

export function pertenceAoFiltro(
  conversa: Conversa,
  filtro: FiltroDaFila,
  analistaId: string,
): boolean {
  switch (filtro) {
    case "para_voce":
      return conversa.estado === "aguardando_analista";
    case "com_agent":
      return conversa.estado === "com_agent";
    case "minhas":
      return atendidaPor(conversa, analistaId);
    case "encerradas":
      return estaEncerrada(conversa);
    case "todas":
      return true;
  }
}
