import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type { Conversa } from "@/domain/types";
import type { BancoDeDados } from "@/infrastructure/db/client";
import { conversas, mensagens } from "@/infrastructure/db/schema";

export type OpcoesDoRepositorioDeConversas = {
  banco: BancoDeDados;
  agora?: () => Date;
};

export function criarRepositorioDeConversas({
  banco,
  agora = () => new Date(),
}: OpcoesDoRepositorioDeConversas): RepositorioDeConversas {
  const ordemDeInsercao = sql`rowid`;

  return {
    async buscarAtiva(funcionarioId) {
      const [conversa] = await banco
        .select()
        .from(conversas)
        .where(
          and(
            eq(conversas.funcionarioId, funcionarioId),
            ne(conversas.estado, "encerrada"),
          ),
        )
        .orderBy(desc(conversas.atualizadaEm))
        .limit(1);
      return conversa ?? null;
    },

    async criar(funcionarioId) {
      const momento = agora();
      const nova: Conversa = {
        id: crypto.randomUUID(),
        funcionarioId,
        estado: "com_agent",
        analistaId: null,
        resumoParaAnalista: null,
        criadaEm: momento,
        atualizadaEm: momento,
      };
      await banco.insert(conversas).values(nova);
      return nova;
    },

    async buscarPorId(id) {
      const [conversa] = await banco
        .select()
        .from(conversas)
        .where(eq(conversas.id, id))
        .limit(1);
      return conversa ?? null;
    },

    async listarMensagens(conversaId, limite) {
      const consulta = banco
        .select()
        .from(mensagens)
        .where(eq(mensagens.conversaId, conversaId))
        .orderBy(desc(mensagens.criadaEm), desc(ordemDeInsercao));

      const recentes =
        limite === undefined ? await consulta : await consulta.limit(limite);
      return recentes.reverse();
    },

    async contarMensagens(conversaId, autor) {
      const [linha] = await banco
        .select({ total: count() })
        .from(mensagens)
        .where(
          and(
            eq(mensagens.conversaId, conversaId),
            autor === undefined ? undefined : eq(mensagens.autor, autor),
          ),
        );
      return linha?.total ?? 0;
    },

    async buscarMensagem(id) {
      const [mensagem] = await banco
        .select()
        .from(mensagens)
        .where(eq(mensagens.id, id))
        .limit(1);
      return mensagem ?? null;
    },

    async adicionarMensagem(dados) {
      const momento = agora();
      const nova = { ...dados, id: crypto.randomUUID(), criadaEm: momento };

      await banco.insert(mensagens).values(nova);
      await banco
        .update(conversas)
        .set({ atualizadaEm: momento })
        .where(eq(conversas.id, dados.conversaId));

      return nova;
    },

    async atualizarDecisao(mensagemId, decisao) {
      await banco
        .update(mensagens)
        .set({ decisao })
        .where(eq(mensagens.id, mensagemId));
    },
  };
}
