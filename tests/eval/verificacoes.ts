import {
  ROTULO_DA_INTENCAO,
  ROTULO_DO_MOTIVO_DE_TRANSFERENCIA,
} from "@/domain/rotulos";
import type { MotivoDeTransferencia } from "@/domain/transferencia";
import {
  CONFIANCA_MINIMA_PARA_AGIR,
  type DecisaoDoAgent,
  type Intencao,
  type RascunhoCompleto,
  type TipoDeAcaoDoAgent,
} from "@/domain/types";
import { paraComparacao } from "@/lib/texto";

export type Rodada = {
  pergunta: string;
  resposta: string;
  decisao: DecisaoDoAgent;
};

export type Verificacao = {
  descricao: string;
  aprovada: (rodada: Rodada) => boolean;
};

const contem = (texto: string, termo: string) =>
  paraComparacao(texto).includes(paraComparacao(termo));

const fez = ({ decisao }: Rodada, tipo: TipoDeAcaoDoAgent) =>
  decisao.acoes.some((acao) => acao.tipo === tipo && acao.sucesso);

const contarPerguntas = (resposta: string) =>
  (resposta.match(/\?/g) ?? []).length;

const camposBatem = (
  rascunho: RascunhoCompleto,
  esperado: Partial<RascunhoCompleto>,
) =>
  (Object.keys(esperado) as (keyof RascunhoCompleto)[]).every(
    (campo) => rascunho[campo] === esperado[campo],
  );

const descreverCampos = (esperado: Partial<RascunhoCompleto>) =>
  Object.entries(esperado)
    .map(([campo, valor]) => `${campo} ${String(valor)}`)
    .join(", ");

export const consultouOsChamados = (): Verificacao => ({
  descricao: "consulta os chamados da pessoa antes de decidir",
  aprovada: (rodada) => fez(rodada, "consultou_chamados"),
});

export const consultouOChamado = (codigo: string): Verificacao => ({
  descricao: `consulta o ${codigo} em detalhe`,
  aprovada: ({ decisao }) => decisao.chamadoConsultado?.codigo === codigo,
});

export const buscouNaCentral = (): Verificacao => ({
  descricao: "procura na central de ajuda",
  aprovada: (rodada) => fez(rodada, "buscou_central_ajuda"),
});

export const usouOArtigo = (id: string): Verificacao => ({
  descricao: `encontra o artigo ${id}`,
  aprovada: ({ decisao }) =>
    decisao.artigosConsultados.some((artigo) => artigo.id === id),
});

export const entendeuComo = (...intencoes: Intencao[]): Verificacao => ({
  descricao: `entende a conversa como ${intencoes.map((intencao) => ROTULO_DA_INTENCAO[intencao].toLowerCase()).join(" ou ")}`,
  aprovada: ({ decisao }) => intencoes.includes(decisao.intencao),
});

export const propoeCriar = (
  esperado: Partial<RascunhoCompleto>,
): Verificacao => ({
  descricao: `propõe um chamado novo com ${descreverCampos(esperado)}`,
  aprovada: ({ decisao: { proposta } }) =>
    proposta?.tipo === "criar" && camposBatem(proposta.rascunho, esperado),
});

export const propoeAtualizar = (codigo: string): Verificacao => ({
  descricao: `propõe atualizar o ${codigo} em vez de duplicar`,
  aprovada: ({ decisao: { proposta } }) =>
    proposta?.tipo === "atualizar" &&
    proposta.codigo === codigo &&
    !proposta.reabrir,
});

export const propoeReabrir = (codigo: string): Verificacao => ({
  descricao: `propõe reabrir o ${codigo}`,
  aprovada: ({ decisao: { proposta } }) =>
    proposta?.tipo === "atualizar" &&
    proposta.codigo === codigo &&
    proposta.reabrir,
});

export const semRascunho = (): Verificacao => ({
  descricao: "não monta rascunho nenhum",
  aprovada: ({ decisao }) => decisao.proposta === null,
});

const FORMULAS_DE_PERGUNTA = [
  "me diga",
  "me conte",
  "me confirma",
  "preciso saber",
  "pode me dizer",
  "poderia me dizer",
];

export const pergunta = (): Verificacao => ({
  descricao: "pergunta em vez de presumir",
  aprovada: ({ resposta }) =>
    contarPerguntas(resposta) >= 1 ||
    FORMULAS_DE_PERGUNTA.some((formula) => contem(resposta, formula)),
});

export const ofereceOpcoes = (): Verificacao => ({
  descricao: "oferece respostas rápidas para a pergunta fechada",
  aprovada: ({ decisao }) => decisao.opcoesRapidas.length > 0,
});

export const diz = (...termos: string[]): Verificacao => ({
  descricao: `diz ${termos.map((termo) => `"${termo}"`).join(" e ")}`,
  aprovada: ({ resposta }) => termos.every((termo) => contem(resposta, termo)),
});

export const naoDiz = (...termos: string[]): Verificacao => ({
  descricao: `não diz ${termos.map((termo) => `"${termo}"`).join(" nem ")}`,
  aprovada: ({ resposta }) => !termos.some((termo) => contem(resposta, termo)),
});

export const chamaAnalista = (motivo: MotivoDeTransferencia): Verificacao => ({
  descricao: `encaminha ao analista por ${ROTULO_DO_MOTIVO_DE_TRANSFERENCIA[motivo]}`,
  aprovada: ({ decisao: { transferencia } }) =>
    transferencia.recomendada && transferencia.motivo === motivo,
});

export const resolveSemFila = (): Verificacao => ({
  descricao: "resolve sem precisar de analista",
  aprovada: ({ decisao }) => !decisao.transferencia.recomendada,
});

export const confiante = (): Verificacao => ({
  descricao: `tem pelo menos ${Math.round(CONFIANCA_MINIMA_PARA_AGIR * 100)}% de segurança`,
  aprovada: ({ decisao }) => decisao.confianca >= CONFIANCA_MINIMA_PARA_AGIR,
});

const AFIRMACOES_DE_JA_TER_AGIDO = [
  "abri o chamado",
  "abri um chamado",
  "criei o chamado",
  "criei um chamado",
  "atualizei o chamado",
  "reabri o chamado",
  "chamado foi aberto",
  "chamado foi criado",
  "chamado foi atualizado",
  "chamado foi reaberto",
];

const MARCACAO_DE_MARKDOWN = /\*\*|^#{1,6}\s|^\s*[-*]\s/m;

export const VERIFICACOES_DE_TODA_RODADA: Verificacao[] = [
  {
    descricao: "pergunta uma coisa por vez",
    aprovada: ({ resposta }) => contarPerguntas(resposta) <= 1,
  },
  {
    descricao: "responde em texto corrido, sem markdown",
    aprovada: ({ resposta }) => !MARCACAO_DE_MARKDOWN.test(resposta),
  },
  {
    descricao: "não diz que já abriu ou alterou um chamado",
    aprovada: ({ resposta }) =>
      !AFIRMACOES_DE_JA_TER_AGIDO.some((afirmacao) =>
        contem(resposta, afirmacao),
      ),
  },
  {
    descricao: "explica o que entendeu e por que decidiu assim",
    aprovada: ({ decisao }) =>
      decisao.entendimento.trim() !== "" && decisao.justificativa.trim() !== "",
  },
];

export const reprovadas = (
  verificacoes: Verificacao[],
  rodada: Rodada,
): string[] =>
  verificacoes
    .filter((verificacao) => !verificacao.aprovada(rodada))
    .map((verificacao) => verificacao.descricao);
