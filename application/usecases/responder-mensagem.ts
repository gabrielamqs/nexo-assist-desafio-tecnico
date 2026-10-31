import {
  acoesDasFerramentas,
  houveChamadoVencido,
  propostaDasFerramentas,
} from "@/application/acoes-do-agent";
import {
  AssistenteIndisponivelError,
  type AcompanhamentoDaResposta,
  type Assistente,
  type SaidaDoAssistente,
} from "@/application/ports/assistente";
import type { RepositorioDeConversas } from "@/application/ports/conversas";
import { avaliarTransferencia } from "@/domain/transferencia";
import type {
  Conversa,
  DecisaoDoAgent,
  Mensagem,
  Usuario,
} from "@/domain/types";

export const LIMITE_DO_HISTORICO = 20;

export class MensagemVaziaError extends Error {
  constructor() {
    super("A mensagem está vazia.");
    this.name = "MensagemVaziaError";
  }
}

export type DependenciasDaResposta = {
  conversas: RepositorioDeConversas;
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
  };
}

export async function responderMensagem(
  { conversas, assistente, agora = () => new Date() }: DependenciasDaResposta,
  { funcionario, texto }: PedidoDeResposta,
  acompanhamento?: AcompanhamentoDaResposta,
): Promise<ResultadoDaResposta> {
  const conteudo = texto.trim();
  if (conteudo === "") throw new MensagemVaziaError();

  const conversa =
    (await conversas.buscarAtiva(funcionario.id)) ??
    (await conversas.criar(funcionario.id));

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

  const mensagensNaSessao = (await conversas.contarMensagens(conversa.id)) + 1;

  const resposta = await conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "agent",
    conteudo: saida.resposta,
    decisao: montarDecisao(saida, mensagensNaSessao),
  });

  return { situacao: "respondida", conversa, mensagemDoFuncionario, resposta };
}
