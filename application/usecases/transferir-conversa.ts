import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import { ROTULO_DO_MOTIVO_DE_TRANSFERENCIA } from "@/domain/rotulos";
import type { MotivoDeTransferencia } from "@/domain/transferencia";
import type { Conversa, Mensagem } from "@/domain/types";

export type DependenciasDaTransferencia = {
  conversas: RepositorioDeConversas;
  chamados: RepositorioDeChamados;
};

export type PedidoDeTransferencia = {
  conversa: Conversa;
  motivo: MotivoDeTransferencia;
  resumo: string;
  codigoDoChamado: string | null;
};

export type ResultadoDaTransferencia = {
  conversa: Conversa;
  aviso: Mensagem;
  chamadoTransferido: string | null;
};

const MENSAGEM_POR_MOTIVO: Record<MotivoDeTransferencia, string> = {
  pedido_do_funcionario:
    "Encaminhei para um analista, como você pediu. Ele assume daqui com o resumo do caso.",
  caso_critico:
    "Como o caso é crítico, encaminhei para um analista agora. Ele assume daqui com o resumo do caso.",
  chamado_vencido:
    "Encaminhei para um analista, porque o prazo do chamado já passou.",
  limite_de_mensagens:
    "Esta conversa chegou ao limite de mensagens, então encaminhei para um analista com o resumo do caso.",
  baixa_confianca:
    "Prefiro não arriscar um palpite aqui: encaminhei para um analista com o resumo do caso.",
};

export const avisoDaTransferencia = (motivo: MotivoDeTransferencia) =>
  MENSAGEM_POR_MOTIVO[motivo];

export async function transferirConversa(
  { conversas, chamados }: DependenciasDaTransferencia,
  { conversa, motivo, resumo, codigoDoChamado }: PedidoDeTransferencia,
): Promise<ResultadoDaTransferencia> {
  const transferida = await conversas.transferirParaAnalista(
    conversa.id,
    resumo,
  );

  const chamadoTransferido = await transferirChamado(
    chamados,
    codigoDoChamado,
    resumo,
  );

  const aviso = await conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "sistema",
    conteudo: `Transferida para um analista · ${ROTULO_DO_MOTIVO_DE_TRANSFERENCIA[motivo]}`,
    decisao: null,
  });

  return { conversa: transferida, aviso, chamadoTransferido };
}

// A conversa já foi transferida: uma falha do sistema legado aqui não pode
// desfazer isso, então o chamado fica para o analista acertar.
async function transferirChamado(
  chamados: RepositorioDeChamados,
  codigo: string | null,
  resumo: string,
): Promise<string | null> {
  if (codigo === null) return null;

  try {
    const chamado = await chamados.transferirParaAnalista(codigo, resumo);
    return chamado.codigo;
  } catch {
    return null;
  }
}
