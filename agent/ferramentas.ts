import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  FERRAMENTAS_DO_ASSISTENTE as FERRAMENTA,
  type ChamadaDeFerramenta,
  type NomeDaFerramentaDoAssistente,
  type ResultadoDaPropostaDeAtualizacao,
  type ResultadoDaPropostaDeChamado,
} from "@/application/ports/assistente";
import { rascunhoEstaCompleto, validarRascunho } from "@/domain/chamados";
import { calcularPrazo } from "@/domain/prazos";
import { definirPrioridade } from "@/domain/prioridade";
import {
  CATEGORIAS,
  DIAS_PARA_REABRIR_CHAMADO,
  IMPACTOS,
  STATUS_DE_CHAMADO,
  TIPOS_DE_CHAMADO,
  URGENCIAS,
  type Categoria,
  type Impacto,
  type TipoDeChamado,
  type Urgencia,
} from "@/domain/types";
import { mensagemDoErro, type ServicoDeChamadosRemoto } from "./servico-remoto";

export type EntradaDaPropostaDeChamado = {
  tipo?: TipoDeChamado;
  titulo?: string;
  descricao?: string;
  categoria?: Categoria;
  afetados?: Impacto;
  urgencia?: Urgencia;
};

export function montarPropostaDeChamado(
  { urgencia, ...campos }: EntradaDaPropostaDeChamado,
  agora: Date,
): ResultadoDaPropostaDeChamado {
  const prioridade =
    campos.afetados !== undefined && urgencia !== undefined
      ? definirPrioridade({ impacto: campos.afetados, urgencia })
      : undefined;

  const rascunho = { ...campos, prioridade };

  if (!rascunhoEstaCompleto(rascunho)) {
    const validacao = validarRascunho(rascunho);
    const faltando = validacao.valido
      ? []
      : validacao.camposFaltando.filter((campo) => campo !== "prioridade");

    return {
      completo: false,
      camposFaltando:
        urgencia === undefined ? [...faltando, "urgencia"] : faltando,
    };
  }

  return {
    completo: true,
    rascunho,
    prazoDeResposta: calcularPrazo(agora, rascunho.prioridade).toISOString(),
  };
}

const chamadoRemoto = z.object({
  codigo: z.string(),
  status: z.enum(STATUS_DE_CHAMADO),
  podeSerReaberto: z.boolean(),
});

export function decidirAtualizacao(
  chamado: z.infer<typeof chamadoRemoto>,
  texto: string,
): ResultadoDaPropostaDeAtualizacao {
  const { codigo, status, podeSerReaberto } = chamado;

  if (status !== "resolvido") {
    return { permitido: true, codigo, texto, reabrir: false };
  }
  if (podeSerReaberto) {
    return { permitido: true, codigo, texto, reabrir: true };
  }
  return {
    permitido: false,
    motivo: `O ${codigo} foi resolvido há mais de ${DIAS_PARA_REABRIR_CHAMADO} dias e não pode ser reaberto. O certo é abrir um chamado novo.`,
  };
}

export type OpcoesDasFerramentas = {
  funcionarioId: string;
  servico: ServicoDeChamadosRemoto;
  agora: Date;
  registrar: (chamada: ChamadaDeFerramenta) => void;
};

const codigoDoChamado = z
  .string()
  .describe("Código do chamado, como INC-20311 ou REQ-10442.");

export function criarFerramentasDoAssistente({
  funcionarioId,
  servico,
  agora,
  registrar,
}: OpcoesDasFerramentas) {
  async function executar<T>(
    ferramenta: NomeDaFerramentaDoAssistente,
    entrada: Record<string, unknown>,
    acao: () => Promise<T>,
  ): Promise<T | { erro: string }> {
    try {
      const saida = await acao();
      registrar({ ferramenta, entrada, saida, sucesso: true });
      return saida;
    } catch (erro) {
      const saida = { erro: mensagemDoErro(erro) };
      registrar({ ferramenta, entrada, saida, sucesso: false });
      return saida;
    }
  }

  const consultarChamados = createTool({
    id: FERRAMENTA.consultarChamados,
    description:
      "Lista os chamados da pessoa com status, prazo de resposta e se estão vencidos. Use para saber o status dos chamados e, antes de propor um chamado novo, para não duplicar.",
    inputSchema: z.object({}),
    execute: async () =>
      executar(FERRAMENTA.consultarChamados, {}, () =>
        servico("consultar_chamados", { funcionarioId }),
      ),
  });

  const consultarChamado = createTool({
    id: FERRAMENTA.consultarChamado,
    description:
      "Mostra um chamado da pessoa em detalhe, com o histórico de atualizações, o prazo e se está vencido.",
    inputSchema: z.object({ codigo: codigoDoChamado }),
    execute: async ({ codigo }) =>
      executar(FERRAMENTA.consultarChamado, { codigo }, () =>
        servico("consultar_chamado", { funcionarioId, codigo }),
      ),
  });

  const buscarCentralDeAjuda = createTool({
    id: FERRAMENTA.buscarCentralDeAjuda,
    description:
      "Procura artigos da central de ajuda pelo assunto. Use antes de propor um chamado: muita dúvida se resolve com um artigo.",
    inputSchema: z.object({
      termo: z
        .string()
        .min(1)
        .describe("O assunto em palavras-chave, como 'vpn erro 809'."),
    }),
    execute: async ({ termo }) =>
      executar(FERRAMENTA.buscarCentralDeAjuda, { termo }, () =>
        servico("buscar_central_ajuda", { termo }),
      ),
  });

  const proporChamado = createTool({
    id: FERRAMENTA.proporChamado,
    description:
      "Monta o rascunho de um chamado novo para a pessoa conferir. NÃO cria o chamado: ele só é criado quando a pessoa confirma o rascunho na tela. Envie o que já souber; se faltar algo, a resposta lista os campos que ainda precisam ser perguntados. A prioridade é calculada a partir de afetados e urgencia, nunca escolhida por você.",
    inputSchema: z.object({
      tipo: z
        .enum(TIPOS_DE_CHAMADO)
        .optional()
        .describe(
          "incidente quando algo parou ou não funciona; requisicao quando é pedido de acesso, equipamento ou software.",
        ),
      titulo: z
        .string()
        .optional()
        .describe(
          "Curto e específico, como 'VPN não conecta no notebook — erro 809'.",
        ),
      descricao: z
        .string()
        .optional()
        .describe(
          "O que acontece, desde quando, o que já foi tentado e para que a pessoa precisa. Escrita para o analista não ter que perguntar de novo.",
        ),
      categoria: z.enum(CATEGORIAS).optional(),
      afetados: z
        .enum(IMPACTOS)
        .optional()
        .describe(
          "Quem é afetado: pessoa (só a pessoa), equipe, empresa, ou desconhecido se ela não souber.",
        ),
      urgencia: z
        .enum(URGENCIAS)
        .optional()
        .describe(
          "trabalho_parado (não consegue trabalhar), compromisso_no_dia (compromisso de hoje em risco), ha_alternativa (atrapalha mas dá para contornar) ou sem_urgencia (pedido ou melhoria).",
        ),
    }),
    execute: async (entrada) =>
      executar(FERRAMENTA.proporChamado, entrada, async () =>
        montarPropostaDeChamado(entrada, agora),
      ),
  });

  const proporAtualizacao = createTool({
    id: FERRAMENTA.proporAtualizacao,
    description: `Prepara o acréscimo de informação a um chamado da pessoa, ou a reabertura de um chamado resolvido há até ${DIAS_PARA_REABRIR_CHAMADO} dias. NÃO altera nada: a atualização só acontece quando a pessoa confirma na tela. Use em vez de propor_chamado quando já existe chamado sobre o mesmo problema.`,
    inputSchema: z.object({
      codigo: codigoDoChamado,
      texto: z
        .string()
        .min(1)
        .describe("A informação nova, em uma ou duas frases."),
    }),
    execute: async ({ codigo, texto }) =>
      executar(FERRAMENTA.proporAtualizacao, { codigo, texto }, async () => {
        const chamado = chamadoRemoto.parse(
          await servico("consultar_chamado", { funcionarioId, codigo }),
        );
        return decidirAtualizacao(chamado, texto);
      }),
  });

  return {
    [FERRAMENTA.consultarChamados]: consultarChamados,
    [FERRAMENTA.consultarChamado]: consultarChamado,
    [FERRAMENTA.buscarCentralDeAjuda]: buscarCentralDeAjuda,
    [FERRAMENTA.proporChamado]: proporChamado,
    [FERRAMENTA.proporAtualizacao]: proporAtualizacao,
  };
}
