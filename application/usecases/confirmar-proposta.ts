import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import { prazoDoChamado } from "@/domain/prazos";
import { ROTULO_DA_PRIORIDADE } from "@/domain/rotulos";
import { avaliarTransferencia } from "@/domain/transferencia";
import type {
  AcaoDoAgent,
  Chamado,
  DecisaoDoAgent,
  Mensagem,
  PropostaDeChamado,
  Usuario,
} from "@/domain/types";
import { formatarPrazoDeResposta } from "@/lib/formatacao";

export class PropostaIndisponivelError extends Error {
  constructor() {
    super("Este rascunho não está mais disponível para confirmação.");
    this.name = "PropostaIndisponivelError";
  }
}

export type DependenciasDaConfirmacao = {
  conversas: RepositorioDeConversas;
  chamados: RepositorioDeChamados;
  agora?: () => Date;
};

export type PedidoDeConfirmacao = {
  funcionario: Usuario;
  mensagemId: string;
};

type PropostaPendente = {
  mensagem: Mensagem;
  decisao: DecisaoDoAgent;
  proposta: PropostaDeChamado;
};

async function exigirPropostaPendente(
  conversas: RepositorioDeConversas,
  { funcionario, mensagemId }: PedidoDeConfirmacao,
): Promise<PropostaPendente> {
  const mensagem = await conversas.buscarMensagem(mensagemId);
  const conversa =
    mensagem === null ? null : await conversas.buscarPorId(mensagem.conversaId);
  const proposta = mensagem?.decisao?.proposta;

  if (
    mensagem === null ||
    mensagem.decisao === null ||
    conversa?.funcionarioId !== funcionario.id ||
    proposta === undefined ||
    proposta === null ||
    proposta.situacao !== "pendente"
  ) {
    throw new PropostaIndisponivelError();
  }

  return { mensagem, decisao: mensagem.decisao, proposta };
}

async function executarProposta(
  chamados: RepositorioDeChamados,
  funcionario: Usuario,
  proposta: PropostaDeChamado,
): Promise<Chamado> {
  if (proposta.tipo === "criar") {
    return chamados.criar({
      ...proposta.rascunho,
      solicitanteId: funcionario.id,
    });
  }

  const alvo = await chamados.buscarPorCodigo(proposta.codigo);
  if (alvo === null || alvo.solicitanteId !== funcionario.id) {
    throw new PropostaIndisponivelError();
  }

  return chamados.atualizar(proposta.codigo, {
    autor: "funcionario",
    texto: proposta.texto,
    status: proposta.reabrir ? "aberto" : undefined,
  });
}

function descreverResultado(
  proposta: PropostaDeChamado,
  chamado: Chamado,
  agora: Date,
): { texto: string; acao: AcaoDoAgent } {
  const prazo = formatarPrazoDeResposta(prazoDoChamado(chamado), agora);

  if (proposta.tipo === "criar") {
    return {
      texto: `Pronto: abri o ${chamado.codigo} com prioridade ${ROTULO_DA_PRIORIDADE[chamado.prioridade].toLowerCase()}. A primeira resposta chega ${prazo}.`,
      acao: {
        tipo: "criou_chamado",
        descricao: `criou o ${chamado.codigo}`,
        sucesso: true,
      },
    };
  }

  if (proposta.reabrir) {
    return {
      texto: `Pronto: reabri o ${chamado.codigo}. A resposta chega ${prazo}.`,
      acao: {
        tipo: "reabriu_chamado",
        descricao: `reabriu o ${chamado.codigo}`,
        sucesso: true,
      },
    };
  }

  return {
    texto: `Pronto: acrescentei a informação ao ${chamado.codigo}. O prazo de resposta recomeçou e vence ${prazo}.`,
    acao: {
      tipo: "atualizou_chamado",
      descricao: `atualizou o ${chamado.codigo}`,
      sucesso: true,
    },
  };
}

export async function confirmarProposta(
  { conversas, chamados, agora = () => new Date() }: DependenciasDaConfirmacao,
  pedido: PedidoDeConfirmacao,
): Promise<{ chamado: Chamado; mensagem: Mensagem }> {
  const { mensagem, decisao, proposta } = await exigirPropostaPendente(
    conversas,
    pedido,
  );

  const chamado = await executarProposta(
    chamados,
    pedido.funcionario,
    proposta,
  );

  await conversas.atualizarDecisao(mensagem.id, {
    ...decisao,
    proposta: {
      ...proposta,
      situacao: "confirmada",
      codigoDoChamado: chamado.codigo,
    },
  });

  const { texto, acao } = descreverResultado(proposta, chamado, agora());
  const avaliacao = avaliarTransferencia({
    funcionarioPediu: false,
    prioridadeDoCaso: chamado.prioridade,
    temChamadoVencido: false,
    confianca: 1,
    mensagensNaSessao:
      (await conversas.contarMensagens(mensagem.conversaId)) + 1,
  });

  const confirmacao = await conversas.adicionarMensagem({
    conversaId: mensagem.conversaId,
    autor: "agent",
    conteudo: texto,
    decisao: {
      entendimento: "A pessoa confirmou o rascunho na tela.",
      intencao:
        proposta.tipo === "criar" ? "abrir_chamado" : "complementar_chamado",
      acoes: [acao],
      confianca: 1,
      justificativa:
        "Executado só depois da confirmação explícita do funcionário, como pede o Anexo A.",
      opcoesRapidas: [],
      proposta: null,
      transferencia: {
        recomendada: avaliacao.deveTransferir,
        motivo: avaliacao.motivo,
      },
    },
  });

  return { chamado, mensagem: confirmacao };
}

export async function cancelarProposta(
  { conversas }: Pick<DependenciasDaConfirmacao, "conversas">,
  pedido: PedidoDeConfirmacao,
): Promise<Mensagem> {
  const { mensagem, decisao, proposta } = await exigirPropostaPendente(
    conversas,
    pedido,
  );

  await conversas.atualizarDecisao(mensagem.id, {
    ...decisao,
    proposta: { ...proposta, situacao: "cancelada" },
  });

  return conversas.adicionarMensagem({
    conversaId: mensagem.conversaId,
    autor: "agent",
    conteudo:
      "Tudo bem, descartei o rascunho. Se quiser, me conte o que ajustar e eu monto de novo.",
    decisao: {
      entendimento: "A pessoa cancelou o rascunho.",
      intencao: "conversa",
      acoes: [],
      confianca: 1,
      justificativa: "Nada foi criado nem alterado: a pessoa não confirmou.",
      opcoesRapidas: [],
      proposta: null,
      transferencia: { recomendada: false, motivo: null },
    },
  });
}
