import { z } from "zod";
import {
  FERRAMENTAS_DO_ASSISTENTE as FERRAMENTA,
  type ChamadaDeFerramenta,
  type NomeDaFerramentaDoAssistente,
} from "@/application/ports/assistente";
import {
  ROTULO_DA_PRIORIDADE,
  ROTULO_DA_URGENCIA,
  ROTULO_DO_CAMPO_DO_RASCUNHO,
  ROTULO_DO_IMPACTO,
  ROTULO_DO_STATUS,
} from "@/domain/rotulos";
import {
  CATEGORIAS,
  IMPACTOS,
  PRIORIDADES,
  STATUS_DE_CHAMADO,
  TIPOS_DE_CHAMADO,
  URGENCIAS,
  type AcaoDoAgent,
  type ArtigoConsultado,
  type DetalheDeChamado,
  type PropostaDeChamado,
  type ResumoDeChamado,
} from "@/domain/types";
import { formatarDataHoraCurta } from "@/lib/formatacao";

const rascunhoCompleto = z.object({
  tipo: z.enum(TIPOS_DE_CHAMADO),
  titulo: z.string(),
  descricao: z.string(),
  categoria: z.enum(CATEGORIAS),
  prioridade: z.enum(PRIORIDADES),
  afetados: z.enum(IMPACTOS),
});

const propostaDeChamadoCompleta = z.object({
  completo: z.literal(true),
  rascunho: rascunhoCompleto,
  prazoDeResposta: z.string(),
});

const propostaDeChamadoIncompleta = z.object({
  completo: z.literal(false),
  camposFaltando: z.array(z.string()),
});

const propostaDeAtualizacaoPermitida = z.object({
  permitido: z.literal(true),
  codigo: z.string(),
  texto: z.string(),
  reabrir: z.boolean(),
});

const propostaDeAtualizacaoRecusada = z.object({
  permitido: z.literal(false),
  motivo: z.string(),
});

const resumoDeChamado = z.object({
  codigo: z.string(),
  tipo: z.enum(TIPOS_DE_CHAMADO),
  titulo: z.string(),
  categoria: z.enum(CATEGORIAS),
  prioridade: z.enum(PRIORIDADES),
  status: z.enum(STATUS_DE_CHAMADO),
  abertoEm: z.string(),
  atualizadoEm: z.string(),
  prazoDeResposta: z.string(),
  vencido: z.boolean(),
});

const detalheDeChamado = resumoDeChamado.extend({ descricao: z.string() });

const listaDeChamados = z.object({ chamados: z.array(resumoDeChamado) });

const listaDeArtigos = z.object({
  artigos: z.array(z.object({ id: z.string(), titulo: z.string() })),
});

const entradaDaProposta = z.object({
  afetados: z.enum(IMPACTOS).optional(),
  urgencia: z.enum(URGENCIAS).optional(),
});

const erroDaFerramenta = z.object({ erro: z.string() });

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

const termoDaEntrada = ({ entrada }: ChamadaDeFerramenta) =>
  typeof entrada.termo === "string" ? entrada.termo : "";

const plural = (quantidade: number, singular: string, plurais: string) =>
  `${quantidade} ${quantidade === 1 ? singular : plurais}`;

function detalheDaLista(saida: unknown): string | undefined {
  const lista = listaDeChamados.safeParse(saida);
  if (!lista.success) return undefined;

  const { chamados } = lista.data;
  const emAberto = chamados.filter((chamado) => chamado.status !== "resolvido");
  const vencidos = emAberto.filter((chamado) => chamado.vencido);

  return `${plural(chamados.length, "chamado", "chamados")} no total, ${plural(emAberto.length, "em aberto", "em aberto")}, ${plural(vencidos.length, "vencido", "vencidos")}`;
}

function detalheDoChamado(saida: unknown): string | undefined {
  const chamado = detalheDeChamado.safeParse(saida);
  if (!chamado.success) return undefined;

  const { status, vencido, prazoDeResposta } = chamado.data;
  const prazo = vencido
    ? "prazo vencido"
    : `prazo até ${formatarDataHoraCurta(new Date(prazoDeResposta))}`;

  return `${ROTULO_DO_STATUS[status]} · ${prazo}`;
}

function detalheDaBusca(chamada: ChamadaDeFerramenta): string {
  const lista = listaDeArtigos.safeParse(chamada.saida);
  const titulos = lista.success
    ? lista.data.artigos.map((artigo) => artigo.titulo)
    : [];
  const encontrados =
    titulos.length === 0 ? "nenhum artigo" : titulos.join("; ");

  return `"${termoDaEntrada(chamada)}" → ${encontrados}`;
}

function detalheDaProposta(chamada: ChamadaDeFerramenta): string | undefined {
  const completa = propostaDeChamadoCompleta.safeParse(chamada.saida);
  if (completa.success) {
    const { rascunho, prazoDeResposta } = completa.data;
    const entrada = entradaDaProposta.safeParse(chamada.entrada);
    const urgencia = entrada.data?.urgencia;
    const criterio = `afetados: ${ROTULO_DO_IMPACTO[rascunho.afetados].toLowerCase()}${urgencia === undefined ? "" : `, urgência: ${ROTULO_DA_URGENCIA[urgencia]}`}`;

    return `${criterio} → prioridade ${ROTULO_DA_PRIORIDADE[rascunho.prioridade].toLowerCase()} pela tabela do Anexo A, resposta até ${formatarDataHoraCurta(new Date(prazoDeResposta))}`;
  }

  const incompleta = propostaDeChamadoIncompleta.safeParse(chamada.saida);
  if (!incompleta.success) return undefined;

  const faltando = incompleta.data.camposFaltando.map(
    (campo) => ROTULO_DO_CAMPO_DO_RASCUNHO[campo] ?? campo,
  );
  return `faltam: ${faltando.join(", ")}`;
}

function acoesDeUmaChamada(chamada: ChamadaDeFerramenta): AcaoDoAgent[] {
  const { ferramenta, saida, sucesso } = chamada;
  const codigo = codigoDaEntrada(chamada);

  if (!sucesso) {
    return [
      {
        tipo: TIPO_DA_ACAO_POR_FERRAMENTA[ferramenta],
        descricao: `não conseguiu ${TENTATIVA_POR_FERRAMENTA[ferramenta](codigo)}`,
        sucesso: false,
        detalhe: erroDaFerramenta.safeParse(saida).data?.erro,
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
          detalhe: detalheDaLista(saida),
        },
      ];

    case FERRAMENTA.consultarChamado:
      return [
        {
          tipo: "consultou_chamado",
          descricao: `consultou o ${codigo}`,
          sucesso,
          detalhe: detalheDoChamado(saida),
        },
        { tipo: "calculou_prazo", descricao: "calculou o prazo", sucesso },
      ];

    case FERRAMENTA.buscarCentralDeAjuda:
      return [
        {
          tipo: "buscou_central_ajuda",
          descricao: "buscou na central de ajuda",
          sucesso,
          detalhe: detalheDaBusca(chamada),
        },
      ];

    case FERRAMENTA.proporChamado:
      return propostaDeChamadoCompleta.safeParse(saida).success
        ? [
            {
              tipo: "classificou_prioridade",
              descricao: "classificou a prioridade",
              sucesso,
              detalhe: detalheDaProposta(chamada),
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
              detalhe: detalheDaProposta(chamada),
            },
          ];

    case FERRAMENTA.proporAtualizacao: {
      const permitida = propostaDeAtualizacaoPermitida.safeParse(saida);
      const recusada = propostaDeAtualizacaoRecusada.safeParse(saida);
      const descricao = !permitida.success
        ? `verificou que o ${codigo} não pode ser reaberto`
        : permitida.data.reabrir
          ? `preparou a reabertura do ${codigo}`
          : `preparou a atualização do ${codigo}`;
      return [
        {
          tipo: "montou_rascunho",
          descricao,
          sucesso,
          detalhe: recusada.data?.motivo,
        },
      ];
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

const saidasBemSucedidas = (
  chamadas: ChamadaDeFerramenta[],
  ferramenta: NomeDaFerramentaDoAssistente,
) =>
  chamadas
    .filter((chamada) => chamada.sucesso && chamada.ferramenta === ferramenta)
    .map((chamada) => chamada.saida);

export type DadosConsultados = {
  chamadosListados: ResumoDeChamado[];
  chamadoConsultado: DetalheDeChamado | null;
  artigosConsultados: ArtigoConsultado[];
};

export function dadosConsultadosNasFerramentas(
  chamadas: ChamadaDeFerramenta[],
): DadosConsultados {
  const listas = saidasBemSucedidas(chamadas, FERRAMENTA.consultarChamados)
    .map((saida) => listaDeChamados.safeParse(saida).data)
    .filter((lista) => lista !== undefined);

  const detalhes = saidasBemSucedidas(chamadas, FERRAMENTA.consultarChamado)
    .map((saida) => detalheDeChamado.safeParse(saida).data)
    .filter((detalhe) => detalhe !== undefined);

  const artigos = saidasBemSucedidas(
    chamadas,
    FERRAMENTA.buscarCentralDeAjuda,
  ).flatMap((saida) => listaDeArtigos.safeParse(saida).data?.artigos ?? []);

  return {
    chamadosListados: listas.at(-1)?.chamados ?? [],
    chamadoConsultado: detalhes.at(-1) ?? null,
    artigosConsultados: [
      ...new Map(artigos.map((artigo) => [artigo.id, artigo])).values(),
    ],
  };
}

export const houveChamadoVencido = (chamadas: ChamadaDeFerramenta[]) =>
  dadosConsultadosNasFerramentas(chamadas).chamadoConsultado?.vencido === true;
