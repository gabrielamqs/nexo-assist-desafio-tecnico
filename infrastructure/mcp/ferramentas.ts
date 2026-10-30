import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { CentralDeAjuda } from "@/application/ports/central-de-ajuda";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import { podeSerReaberto } from "@/domain/chamados";
import { estaVencido, prazoDoChamado } from "@/domain/prazos";
import {
  CATEGORIAS,
  IMPACTOS,
  PRIORIDADES,
  STATUS_DE_CHAMADO,
  TIPOS_DE_CHAMADO,
  type Chamado,
} from "@/domain/types";

export type DependenciasDasFerramentas = {
  repositorioDeChamados: RepositorioDeChamados;
  centralDeAjuda: CentralDeAjuda;
  agora?: () => Date;
};

export class ChamadoIndisponivelParaOFuncionarioError extends Error {
  constructor(codigo: string) {
    super(
      `Nenhum chamado ${codigo} foi encontrado entre os chamados desse funcionário.`,
    );
    this.name = "ChamadoIndisponivelParaOFuncionarioError";
  }
}

const descreverChamado = (chamado: Chamado, agora: Date) => ({
  codigo: chamado.codigo,
  tipo: chamado.tipo,
  titulo: chamado.titulo,
  descricao: chamado.descricao,
  categoria: chamado.categoria,
  prioridade: chamado.prioridade,
  status: chamado.status,
  afetados: chamado.afetados,
  abertoEm: chamado.abertoEm.toISOString(),
  atualizadoEm: chamado.atualizadoEm.toISOString(),
  resolvidoEm: chamado.resolvidoEm?.toISOString() ?? null,
  prazoDeResposta: prazoDoChamado(chamado).toISOString(),
  vencido: estaVencido(chamado, agora),
  podeSerReaberto: podeSerReaberto(chamado, agora),
});

const funcionarioId = z
  .string()
  .describe(
    "Identificador do funcionário dono da conversa. Vem da sessão, nunca do que o funcionário digita.",
  );

const codigoDoChamado = z
  .string()
  .describe("Código do chamado, como INC-20311 ou REQ-10442.");

export function criarFerramentasDeChamados({
  repositorioDeChamados,
  centralDeAjuda,
  agora = () => new Date(),
}: DependenciasDasFerramentas) {
  async function exigirChamadoDoFuncionario(
    codigo: string,
    solicitanteId: string,
  ): Promise<Chamado> {
    const chamado = await repositorioDeChamados.buscarPorCodigo(codigo);

    if (chamado === null || chamado.solicitanteId !== solicitanteId) {
      throw new ChamadoIndisponivelParaOFuncionarioError(codigo);
    }
    return chamado;
  }

  const consultarChamados = createTool({
    id: "consultar_chamados",
    description:
      "Lista os chamados do funcionário, do mais recente para o mais antigo, com prazo e indicação de vencido. Use antes de abrir um chamado novo, para não duplicar.",
    inputSchema: z.object({ funcionarioId }),
    execute: async ({ funcionarioId: solicitanteId }) => {
      const momento = agora();
      const chamados =
        await repositorioDeChamados.listarPorSolicitante(solicitanteId);

      return {
        total: chamados.length,
        chamados: chamados.map((chamado) => descreverChamado(chamado, momento)),
      };
    },
  });

  const consultarChamado = createTool({
    id: "consultar_chamado",
    description:
      "Mostra um chamado do funcionário em detalhe, com o histórico de atualizações. Só devolve chamados do próprio funcionário.",
    inputSchema: z.object({ funcionarioId, codigo: codigoDoChamado }),
    execute: async ({ funcionarioId: solicitanteId, codigo }) => {
      const chamado = await exigirChamadoDoFuncionario(codigo, solicitanteId);
      const atualizacoes =
        await repositorioDeChamados.listarAtualizacoes(codigo);

      return {
        ...descreverChamado(chamado, agora()),
        atualizacoes: atualizacoes.map((atualizacao) => ({
          autor: atualizacao.autor,
          texto: atualizacao.texto,
          criadaEm: atualizacao.criadaEm.toISOString(),
        })),
      };
    },
  });

  const criarChamado = createTool({
    id: "criar_chamado",
    description:
      "Abre um chamado novo. Só pode ser chamada depois de o funcionário confirmar o rascunho, e só quando não existe chamado aberto sobre o mesmo problema.",
    inputSchema: z.object({
      funcionarioId,
      tipo: z
        .enum(TIPOS_DE_CHAMADO)
        .describe(
          "incidente quando algo parou de funcionar; requisicao quando é pedido de acesso, equipamento ou software.",
        ),
      titulo: z.string().min(1),
      descricao: z.string().min(1),
      categoria: z.enum(CATEGORIAS),
      prioridade: z.enum(PRIORIDADES),
      afetados: z
        .enum(IMPACTOS)
        .describe(
          "Quem é afetado: pessoa (só o funcionário), equipe, empresa ou desconhecido.",
        ),
    }),
    execute: async ({ funcionarioId: solicitanteId, ...dados }) => {
      const criado = await repositorioDeChamados.criar({
        ...dados,
        solicitanteId,
      });
      return descreverChamado(criado, agora());
    },
  });

  const atualizarChamado = createTool({
    id: "atualizar_chamado",
    description:
      "Acrescenta informação a um chamado do funcionário e, se preciso, muda status ou prioridade. Serve também para reabrir um chamado resolvido há até 7 dias. Cada atualização reinicia a contagem do prazo.",
    inputSchema: z.object({
      funcionarioId,
      codigo: codigoDoChamado,
      texto: z
        .string()
        .min(1)
        .describe("A informação nova, em uma ou duas frases."),
      status: z.enum(STATUS_DE_CHAMADO).optional(),
      prioridade: z.enum(PRIORIDADES).optional(),
    }),
    execute: async ({
      funcionarioId: solicitanteId,
      codigo,
      texto,
      status,
      prioridade,
    }) => {
      await exigirChamadoDoFuncionario(codigo, solicitanteId);
      const atualizado = await repositorioDeChamados.atualizar(codigo, {
        autor: "funcionario",
        texto,
        status,
        prioridade,
      });
      return descreverChamado(atualizado, agora());
    },
  });

  const transferirChamado = createTool({
    id: "transferir_chamado",
    description:
      "Marca o chamado como aguardando analista e registra o resumo do caso. Use quando o funcionário pede uma pessoa, em caso crítico, em chamado vencido ou quando não houver segurança sobre o que fazer.",
    inputSchema: z.object({
      funcionarioId,
      codigo: codigoDoChamado,
      resumo: z
        .string()
        .min(1)
        .describe(
          "Resumo do caso para o analista: o que o funcionário relatou, o que já foi tentado e o que falta decidir.",
        ),
    }),
    execute: async ({ funcionarioId: solicitanteId, codigo, resumo }) => {
      await exigirChamadoDoFuncionario(codigo, solicitanteId);
      const transferido = await repositorioDeChamados.transferirParaAnalista(
        codigo,
        resumo,
      );
      return descreverChamado(transferido, agora());
    },
  });

  const buscarCentralDeAjuda = createTool({
    id: "buscar_central_ajuda",
    description:
      "Procura artigos da central de ajuda por assunto. Use antes de abrir chamado: muita dúvida se resolve com um artigo.",
    inputSchema: z.object({
      termo: z
        .string()
        .min(1)
        .describe("O assunto em palavras-chave, como 'vpn erro 809'."),
      limite: z.number().int().min(1).max(10).optional(),
    }),
    execute: async ({ termo, limite }) => {
      const artigos = await centralDeAjuda.buscar(termo, limite);
      return { total: artigos.length, artigos };
    },
  });

  return {
    consultar_chamados: consultarChamados,
    consultar_chamado: consultarChamado,
    criar_chamado: criarChamado,
    atualizar_chamado: atualizarChamado,
    transferir_chamado: transferirChamado,
    buscar_central_ajuda: buscarCentralDeAjuda,
  };
}
