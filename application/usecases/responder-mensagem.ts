import {
  acoesDasFerramentas,
  dadosConsultadosNasFerramentas,
  houveChamadoVencido,
  propostaDasFerramentas,
  resumoParaAnalistaDasFerramentas,
} from "@/application/acoes-do-agent";
import {
  AssistenteIndisponivelError,
  type AcompanhamentoDaResposta,
  type Assistente,
  type SaidaDoAssistente,
} from "@/application/ports/assistente";
import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import {
  avaliarTransferencia,
  transfereImediatamente,
  type MotivoDeTransferencia,
} from "@/domain/transferencia";
import { ROTULO_DO_MOTIVO_DE_TRANSFERENCIA } from "@/domain/rotulos";
import { transferirConversa } from "./transferir-conversa";
import {
  LIMITE_DE_MENSAGENS_POR_SESSAO,
  type Conversa,
  type DecisaoDoAgent,
  type Mensagem,
  type Usuario,
} from "@/domain/types";

export const LIMITE_DO_HISTORICO = 20;

export class MensagemVaziaError extends Error {
  constructor() {
    super("A mensagem está vazia.");
    this.name = "MensagemVaziaError";
  }
}

export class LimiteDeMensagensAtingidoError extends Error {
  constructor() {
    super(
      `Esta sessão chegou ao limite de ${LIMITE_DE_MENSAGENS_POR_SESSAO} mensagens.`,
    );
    this.name = "LimiteDeMensagensAtingidoError";
  }
}

export type DependenciasDaResposta = {
  conversas: RepositorioDeConversas;
  chamados: RepositorioDeChamados;
  assistente: Assistente;
  agora?: () => Date;
};

export type PedidoDeResposta = {
  funcionario: Usuario;
  texto: string;
};

export type ResultadoDaResposta =
  | {
      situacao: "respondida";
      conversa: Conversa;
      mensagemDoFuncionario: Mensagem;
      resposta: Mensagem;
      transferencia: { aviso: Mensagem; motivo: MotivoDeTransferencia } | null;
    }
  | {
      situacao: "com_analista";
      conversa: Conversa;
      mensagemDoFuncionario: Mensagem;
    };

function montarDecisao(
  saida: SaidaDoAssistente,
  mensagensNaSessao: number,
): DecisaoDoAgent {
  const { chamadasDeFerramenta } = saida;
  const proposta = propostaDasFerramentas(chamadasDeFerramenta);

  const avaliacao = avaliarTransferencia({
    funcionarioPediu: saida.intencao === "falar_com_analista",
    prioridadeDoCaso:
      proposta?.tipo === "criar" ? proposta.rascunho.prioridade : null,
    temChamadoVencido: houveChamadoVencido(chamadasDeFerramenta),
    confianca: saida.confianca,
    mensagensNaSessao,
  });

  return {
    entendimento: saida.entendimento,
    intencao: saida.intencao,
    acoes: acoesDasFerramentas(chamadasDeFerramenta),
    confianca: saida.confianca,
    justificativa: saida.justificativa,
    opcoesRapidas: saida.opcoesRapidas,
    proposta: proposta === null ? null : { ...proposta, situacao: "pendente" },
    transferencia: {
      recomendada: avaliacao.deveTransferir,
      motivo: avaliacao.motivo,
    },
    ...dadosConsultadosNasFerramentas(chamadasDeFerramenta),
  };
}

function resumoDoCaso(
  saida: SaidaDoAssistente,
  motivo: MotivoDeTransferencia,
  decisao: DecisaoDoAgent,
): string {
  const escritoPeloAgent = resumoParaAnalistaDasFerramentas(
    saida.chamadasDeFerramenta,
  );
  if (escritoPeloAgent !== null) return escritoPeloAgent;

  const chamado = decisao.chamadoConsultado;
  const partes = [
    saida.entendimento === "" ? saida.resposta : saida.entendimento,
    chamado === null ? null : `Chamado em questão: ${chamado.codigo}.`,
    `Transferido porque ${ROTULO_DO_MOTIVO_DE_TRANSFERENCIA[motivo]}.`,
  ];

  return partes.filter((parte) => parte !== null).join(" ");
}

export async function responderMensagem(
  {
    conversas,
    chamados,
    assistente,
    agora = () => new Date(),
  }: DependenciasDaResposta,
  { funcionario, texto }: PedidoDeResposta,
  acompanhamento?: AcompanhamentoDaResposta,
): Promise<ResultadoDaResposta> {
  const conteudo = texto.trim();
  if (conteudo === "") throw new MensagemVaziaError();

  const conversa =
    (await conversas.buscarAtiva(funcionario.id)) ??
    (await conversas.criar(funcionario.id));

  const enviadas = await conversas.contarMensagens(conversa.id, "funcionario");
  if (enviadas >= LIMITE_DE_MENSAGENS_POR_SESSAO) {
    throw new LimiteDeMensagensAtingidoError();
  }

  const mensagemDoFuncionario = await conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "funcionario",
    conteudo,
    decisao: null,
  });

  if (conversa.estado !== "com_agent") {
    return { situacao: "com_analista", conversa, mensagemDoFuncionario };
  }

  const historico = await conversas.listarMensagens(
    conversa.id,
    LIMITE_DO_HISTORICO,
  );

  let saida: SaidaDoAssistente;
  try {
    saida = await assistente.responder(
      { funcionario, historico, agora: agora() },
      acompanhamento,
    );
  } catch (erro) {
    throw new AssistenteIndisponivelError(erro);
  }

  const decisao = montarDecisao(saida, enviadas + 1);

  const resposta = await conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "agent",
    conteudo: saida.resposta,
    decisao,
  });

  const motivo = decisao.transferencia.motivo;
  if (motivo === null || !transfereImediatamente(motivo)) {
    return {
      situacao: "respondida",
      conversa,
      mensagemDoFuncionario,
      resposta,
      transferencia: null,
    };
  }

  const transferida = await transferirConversa(
    { conversas, chamados },
    {
      conversa,
      motivo,
      resumo: resumoDoCaso(saida, motivo, decisao),
      codigoDoChamado: decisao.chamadoConsultado?.codigo ?? null,
    },
  );

  return {
    situacao: "respondida",
    conversa: transferida.conversa,
    mensagemDoFuncionario,
    resposta,
    transferencia: { aviso: transferida.aviso, motivo },
  };
}
