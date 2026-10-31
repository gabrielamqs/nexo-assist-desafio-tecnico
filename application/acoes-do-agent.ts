import { z } from "zod";
import {
  FERRAMENTAS_DO_ASSISTENTE as FERRAMENTA,
  type ChamadaDeFerramenta,
  type NomeDaFerramentaDoAssistente,
} from "@/application/ports/assistente";
import {
  CATEGORIAS,
  IMPACTOS,
  PRIORIDADES,
  TIPOS_DE_CHAMADO,
  type AcaoDoAgent,
  type PropostaDeChamado,
} from "@/domain/types";

const propostaDeChamadoCompleta = z.object({
  completo: z.literal(true),
  rascunho: z.object({
    tipo: z.enum(TIPOS_DE_CHAMADO),
    titulo: z.string(),
    descricao: z.string(),
    categoria: z.enum(CATEGORIAS),
    prioridade: z.enum(PRIORIDADES),
    afetados: z.enum(IMPACTOS),
  }),
  prazoDeResposta: z.string(),
});

const propostaDeAtualizacaoPermitida = z.object({
  permitido: z.literal(true),
  codigo: z.string(),
  texto: z.string(),
  reabrir: z.boolean(),
});

const chamadoConsultado = z.object({
  codigo: z.string(),
  vencido: z.boolean(),
});

const TIPO_DA_ACAO_POR_FERRAMENTA: Record<
  NomeDaFerramentaDoAssistente,
  AcaoDoAgent["tipo"]
> = {
  [FERRAMENTA.consultarChamados]: "consultou_chamados",
  [FERRAMENTA.consultarChamado]: "consultou_chamado",
  [FERRAMENTA.buscarCentralDeAjuda]: "buscou_central_ajuda",
  [FERRAMENTA.proporChamado]: "montou_rascunho",
  [FERRAMENTA.proporAtualizacao]: "montou_rascunho",
};

const TENTATIVA_POR_FERRAMENTA: Record<
  NomeDaFerramentaDoAssistente,
  (codigo: string) => string
> = {
  [FERRAMENTA.consultarChamados]: () => "consultar seus chamados",
  [FERRAMENTA.consultarChamado]: (codigo) => `consultar o ${codigo}`,
  [FERRAMENTA.buscarCentralDeAjuda]: () => "buscar na central de ajuda",
  [FERRAMENTA.proporChamado]: () => "montar o rascunho",
  [FERRAMENTA.proporAtualizacao]: (codigo) =>
    `preparar a atualização do ${codigo}`,
};

const codigoDaEntrada = ({ entrada }: ChamadaDeFerramenta) =>
  typeof entrada.codigo === "string" ? entrada.codigo : "chamado";

function acoesDeUmaChamada(chamada: ChamadaDeFerramenta): AcaoDoAgent[] {
  const { ferramenta, saida, sucesso } = chamada;
  const codigo = codigoDaEntrada(chamada);

  if (!sucesso) {
    return [
      {
        tipo: TIPO_DA_ACAO_POR_FERRAMENTA[ferramenta],
        descricao: `não conseguiu ${TENTATIVA_POR_FERRAMENTA[ferramenta](codigo)}`,
        sucesso: false,
      },
    ];
  }

  switch (ferramenta) {
    case FERRAMENTA.consultarChamados:
      return [
        {
          tipo: "consultou_chamados",
          descricao: "consultou seus chamados",
          sucesso,
        },
      ];

    case FERRAMENTA.consultarChamado:
      return [
        {
          tipo: "consultou_chamado",
          descricao: `consultou o ${codigo}`,
          sucesso,
        },
        { tipo: "calculou_prazo", descricao: "calculou o prazo", sucesso },
      ];

    case FERRAMENTA.buscarCentralDeAjuda:
      return [
        {
          tipo: "buscou_central_ajuda",
          descricao: "buscou na central de ajuda",
          sucesso,
        },
      ];

    case FERRAMENTA.proporChamado:
      return propostaDeChamadoCompleta.safeParse(saida).success
        ? [
            {
              tipo: "classificou_prioridade",
              descricao: "classificou a prioridade",
              sucesso,
            },
            { tipo: "calculou_prazo", descricao: "consultou o SLA", sucesso },
            {
              tipo: "montou_rascunho",
              descricao: "montou o rascunho",
              sucesso,
            },
          ]
        : [
            {
              tipo: "montou_rascunho",
              descricao: "verificou o que falta para o rascunho",
              sucesso,
            },
          ];

    case FERRAMENTA.proporAtualizacao: {
      const proposta = propostaDeAtualizacaoPermitida.safeParse(saida);
      const descricao = !proposta.success
        ? `verificou que o ${codigo} não pode ser reaberto`
        : proposta.data.reabrir
          ? `preparou a reabertura do ${codigo}`
          : `preparou a atualização do ${codigo}`;
      return [{ tipo: "montou_rascunho", descricao, sucesso }];
    }
  }
}

export const acoesDasFerramentas = (
  chamadas: ChamadaDeFerramenta[],
): AcaoDoAgent[] => chamadas.flatMap(acoesDeUmaChamada);

function propostaDeUmaChamada({
  ferramenta,
  saida,
  sucesso,
}: ChamadaDeFerramenta): PropostaDeChamado | null {
  if (!sucesso) return null;

  if (ferramenta === FERRAMENTA.proporChamado) {
    const resultado = propostaDeChamadoCompleta.safeParse(saida);
    return resultado.success
      ? {
          tipo: "criar",
          rascunho: resultado.data.rascunho,
          prazoDeResposta: resultado.data.prazoDeResposta,
        }
      : null;
  }

  if (ferramenta === FERRAMENTA.proporAtualizacao) {
    const resultado = propostaDeAtualizacaoPermitida.safeParse(saida);
    return resultado.success
      ? {
          tipo: "atualizar",
          codigo: resultado.data.codigo,
          texto: resultado.data.texto,
          reabrir: resultado.data.reabrir,
        }
      : null;
  }

  return null;
}

export const propostaDasFerramentas = (
  chamadas: ChamadaDeFerramenta[],
): PropostaDeChamado | null =>
  chamadas
    .map(propostaDeUmaChamada)
    .findLast((proposta) => proposta !== null) ?? null;

export const houveChamadoVencido = (chamadas: ChamadaDeFerramenta[]) =>
  chamadas.some(
    ({ ferramenta, saida, sucesso }) =>
      sucesso &&
      ferramenta === FERRAMENTA.consultarChamado &&
      chamadoConsultado.safeParse(saida).data?.vencido === true,
  );
