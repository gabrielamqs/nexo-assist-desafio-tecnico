import {
  CONFIANCA_MINIMA_PARA_AGIR,
  LIMITE_DE_MENSAGENS_POR_SESSAO,
  type Prioridade,
} from "./types";

export const MOTIVOS_DE_TRANSFERENCIA = [
  "pedido_do_funcionario",
  "caso_critico",
  "chamado_vencido",
  "limite_de_mensagens",
  "baixa_confianca",
] as const;
export type MotivoDeTransferencia = (typeof MOTIVOS_DE_TRANSFERENCIA)[number];

export type SituacaoDaConversa = {
  funcionarioPediu: boolean;
  prioridadeDoCaso: Prioridade | null;
  temChamadoVencido: boolean;
  confianca: number;
  mensagensNaSessao: number;
};

export type ResultadoDaAvaliacao =
  | { deveTransferir: true; motivo: MotivoDeTransferencia }
  | { deveTransferir: false; motivo: null };

export function avaliarTransferencia(
  situacao: SituacaoDaConversa,
): ResultadoDaAvaliacao {
  const motivo = primeiroMotivoAplicavel(situacao);
  return motivo === null
    ? { deveTransferir: false, motivo: null }
    : { deveTransferir: true, motivo };
}

function primeiroMotivoAplicavel({
  funcionarioPediu,
  prioridadeDoCaso,
  temChamadoVencido,
  confianca,
  mensagensNaSessao,
}: SituacaoDaConversa): MotivoDeTransferencia | null {
  if (funcionarioPediu) return "pedido_do_funcionario";
  if (prioridadeDoCaso === "critica") return "caso_critico";
  if (temChamadoVencido) return "chamado_vencido";
  if (mensagensNaSessao >= LIMITE_DE_MENSAGENS_POR_SESSAO) {
    return "limite_de_mensagens";
  }
  if (confianca < CONFIANCA_MINIMA_PARA_AGIR) return "baixa_confianca";
  return null;
}
