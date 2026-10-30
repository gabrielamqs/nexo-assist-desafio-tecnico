import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  AUTORES_DE_MENSAGEM,
  CATEGORIAS,
  ESTADOS_DE_CONVERSA,
  IMPACTOS,
  PAPEIS,
  PRIORIDADES,
  STATUS_DE_CHAMADO,
  TIPOS_DE_CHAMADO,
  type DecisaoDoAgent,
} from "@/domain/types";

const instante = (coluna: string) => integer(coluna, { mode: "timestamp_ms" });

export const usuarios = sqliteTable("usuarios", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  departamento: text("departamento").notNull(),
  papel: text("papel", { enum: PAPEIS }).notNull(),
});

export const artigos = sqliteTable("artigos", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  categoria: text("categoria", { enum: CATEGORIAS }).notNull(),
  palavrasChave: text("palavras_chave", { mode: "json" })
    .$type<string[]>()
    .notNull(),
});

export const chamados = sqliteTable(
  "chamados",
  {
    codigo: text("codigo").primaryKey(),
    tipo: text("tipo", { enum: TIPOS_DE_CHAMADO }).notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao").notNull(),
    categoria: text("categoria", { enum: CATEGORIAS }).notNull(),
    prioridade: text("prioridade", { enum: PRIORIDADES }).notNull(),
    status: text("status", { enum: STATUS_DE_CHAMADO }).notNull(),
    solicitanteId: text("solicitante_id")
      .notNull()
      .references(() => usuarios.id),
    afetados: text("afetados", { enum: IMPACTOS }).notNull(),
    abertoEm: instante("aberto_em").notNull(),
    atualizadoEm: instante("atualizado_em").notNull(),
    resolvidoEm: instante("resolvido_em"),
  },
  (tabela) => [
    index("idx_chamados_solicitante").on(
      tabela.solicitanteId,
      tabela.atualizadoEm,
    ),
  ],
);

export const atualizacoesDeChamado = sqliteTable(
  "atualizacoes_de_chamado",
  {
    id: text("id").primaryKey(),
    chamadoCodigo: text("chamado_codigo")
      .notNull()
      .references(() => chamados.codigo, { onDelete: "cascade" }),
    autor: text("autor", { enum: AUTORES_DE_MENSAGEM }).notNull(),
    texto: text("texto").notNull(),
    criadaEm: instante("criada_em").notNull(),
  },
  (tabela) => [
    index("idx_atualizacoes_chamado").on(tabela.chamadoCodigo, tabela.criadaEm),
  ],
);

export const conversas = sqliteTable(
  "conversas",
  {
    id: text("id").primaryKey(),
    funcionarioId: text("funcionario_id")
      .notNull()
      .references(() => usuarios.id),
    estado: text("estado", { enum: ESTADOS_DE_CONVERSA }).notNull(),
    analistaId: text("analista_id").references(() => usuarios.id),
    resumoParaAnalista: text("resumo_para_analista"),
    criadaEm: instante("criada_em").notNull(),
    atualizadaEm: instante("atualizada_em").notNull(),
  },
  (tabela) => [
    index("idx_conversas_funcionario").on(
      tabela.funcionarioId,
      tabela.atualizadaEm,
    ),
    index("idx_conversas_estado").on(tabela.estado, tabela.atualizadaEm),
  ],
);

export const mensagens = sqliteTable(
  "mensagens",
  {
    id: text("id").primaryKey(),
    conversaId: text("conversa_id")
      .notNull()
      .references(() => conversas.id, { onDelete: "cascade" }),
    autor: text("autor", { enum: AUTORES_DE_MENSAGEM }).notNull(),
    conteudo: text("conteudo").notNull(),
    criadaEm: instante("criada_em").notNull(),
    decisao: text("decisao", { mode: "json" }).$type<DecisaoDoAgent>(),
  },
  (tabela) => [
    index("idx_mensagens_conversa").on(tabela.conversaId, tabela.criadaEm),
  ],
);
