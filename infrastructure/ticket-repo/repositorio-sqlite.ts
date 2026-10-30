import { asc, desc, eq, like } from "drizzle-orm";
import {
  ChamadoNaoEncontradoError,
  type DadosDeAtualizacao,
  type DadosDeNovoChamado,
  type RepositorioDeChamados,
} from "@/application/ports/ticket-repository";
import { formatarCodigoDeChamado } from "@/domain/chamados";
import {
  PREFIXO_POR_TIPO,
  type Chamado,
  type TipoDeChamado,
} from "@/domain/types";
import type { BancoDeDados } from "@/infrastructure/db/client";
import { atualizacoesDeChamado, chamados } from "@/infrastructure/db/schema";
import {
  sempreDisponivel,
  type VerificacaoDeDisponibilidade,
} from "./indisponibilidade";

const PRIMEIRO_NUMERO_POR_TIPO: Record<TipoDeChamado, number> = {
  incidente: 20000,
  requisicao: 10000,
};

export type OpcoesDoRepositorio = {
  banco: BancoDeDados;
  agora?: () => Date;
  verificarDisponibilidade?: VerificacaoDeDisponibilidade;
};

export function criarRepositorioDeChamados({
  banco,
  agora = () => new Date(),
  verificarDisponibilidade = sempreDisponivel,
}: OpcoesDoRepositorio): RepositorioDeChamados {
  async function exigirChamado(codigo: string): Promise<Chamado> {
    const [chamado] = await banco
      .select()
      .from(chamados)
      .where(eq(chamados.codigo, codigo))
      .limit(1);

    if (chamado === undefined) throw new ChamadoNaoEncontradoError(codigo);
    return chamado;
  }

  async function proximoCodigo(tipo: TipoDeChamado): Promise<string> {
    const prefixo = PREFIXO_POR_TIPO[tipo];
    const existentes = await banco
      .select({ codigo: chamados.codigo })
      .from(chamados)
      .where(like(chamados.codigo, `${prefixo}-%`));

    const maiorNumero = existentes.reduce((maior, { codigo }) => {
      const numero = Number.parseInt(codigo.slice(prefixo.length + 1), 10);
      return Number.isNaN(numero) ? maior : Math.max(maior, numero);
    }, PRIMEIRO_NUMERO_POR_TIPO[tipo]);

    return formatarCodigoDeChamado(tipo, maiorNumero + 1);
  }

  const registrarAtualizacao = (
    codigo: string,
    autor: DadosDeAtualizacao["autor"],
    texto: string,
    momento: Date,
  ) =>
    banco.insert(atualizacoesDeChamado).values({
      id: crypto.randomUUID(),
      chamadoCodigo: codigo,
      autor,
      texto,
      criadaEm: momento,
    });

  return {
    async listarPorSolicitante(solicitanteId) {
      verificarDisponibilidade();
      return banco
        .select()
        .from(chamados)
        .where(eq(chamados.solicitanteId, solicitanteId))
        .orderBy(desc(chamados.atualizadoEm));
    },

    async buscarPorCodigo(codigo) {
      verificarDisponibilidade();
      const [chamado] = await banco
        .select()
        .from(chamados)
        .where(eq(chamados.codigo, codigo))
        .limit(1);
      return chamado ?? null;
    },

    async listarAtualizacoes(codigo) {
      verificarDisponibilidade();
      return banco
        .select()
        .from(atualizacoesDeChamado)
        .where(eq(atualizacoesDeChamado.chamadoCodigo, codigo))
        .orderBy(asc(atualizacoesDeChamado.criadaEm));
    },

    async criar(dados: DadosDeNovoChamado) {
      verificarDisponibilidade();
      const momento = agora();
      const novo: Chamado = {
        ...dados,
        codigo: await proximoCodigo(dados.tipo),
        status: "aberto",
        abertoEm: momento,
        atualizadoEm: momento,
        resolvidoEm: null,
      };

      await banco.insert(chamados).values(novo);
      return novo;
    },

    async atualizar(codigo, dados) {
      verificarDisponibilidade();
      const atual = await exigirChamado(codigo);
      const momento = agora();
      const status = dados.status ?? atual.status;

      const atualizado: Chamado = {
        ...atual,
        status,
        prioridade: dados.prioridade ?? atual.prioridade,
        atualizadoEm: momento,
        resolvidoEm:
          status === "resolvido" ? (atual.resolvidoEm ?? momento) : null,
      };

      await banco
        .update(chamados)
        .set({
          status: atualizado.status,
          prioridade: atualizado.prioridade,
          atualizadoEm: atualizado.atualizadoEm,
          resolvidoEm: atualizado.resolvidoEm,
        })
        .where(eq(chamados.codigo, codigo));

      await registrarAtualizacao(codigo, dados.autor, dados.texto, momento);
      return atualizado;
    },

    async transferirParaAnalista(codigo, resumo) {
      verificarDisponibilidade();
      const atual = await exigirChamado(codigo);
      const momento = agora();

      const transferido: Chamado = {
        ...atual,
        status: "aguardando_analista",
        atualizadoEm: momento,
        resolvidoEm: null,
      };

      await banco
        .update(chamados)
        .set({
          status: transferido.status,
          atualizadoEm: momento,
          resolvidoEm: null,
        })
        .where(eq(chamados.codigo, codigo));

      await registrarAtualizacao(codigo, "agent", resumo, momento);
      return transferido;
    },
  };
}
