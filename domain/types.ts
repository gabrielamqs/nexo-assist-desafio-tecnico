export const TIPOS_DE_CHAMADO = ["incidente", "requisicao"] as const;
export type TipoDeChamado = (typeof TIPOS_DE_CHAMADO)[number];

export const PREFIXO_POR_TIPO: Record<TipoDeChamado, string> = {
  incidente: "INC",
  requisicao: "REQ",
};

export const CATEGORIAS = [
  "Acesso",
  "Rede e VPN",
  "Hardware",
  "Software",
  "E-mail",
  "Outros",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const PRIORIDADES = ["critica", "alta", "media", "baixa"] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export const STATUS_DE_CHAMADO = [
  "aberto",
  "em_andamento",
  "aguardando_analista",
  "aprovado",
  "resolvido",
] as const;
export type StatusDeChamado = (typeof STATUS_DE_CHAMADO)[number];

export const IMPACTOS = [
  "empresa",
  "equipe",
  "pessoa",
  "desconhecido",
] as const;
export type Impacto = (typeof IMPACTOS)[number];

export const URGENCIAS = [
  "trabalho_parado",
  "compromisso_no_dia",
  "ha_alternativa",
  "sem_urgencia",
] as const;
export type Urgencia = (typeof URGENCIAS)[number];

export const PAPEIS = ["funcionario", "analista"] as const;
export type Papel = (typeof PAPEIS)[number];

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  departamento: string;
  papel: Papel;
};

export type Chamado = {
  codigo: string;
  tipo: TipoDeChamado;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  prioridade: Prioridade;
  status: StatusDeChamado;
  solicitanteId: string;
  afetados: Impacto;
  abertoEm: Date;
  atualizadoEm: Date;
  resolvidoEm: Date | null;
};

export type ArtigoDaCentralDeAjuda = {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: Categoria;
  palavrasChave: string[];
};

export const ESTADOS_DE_CONVERSA = [
  "com_agent",
  "aguardando_analista",
  "com_analista",
  "encerrada",
] as const;
export type EstadoDaConversa = (typeof ESTADOS_DE_CONVERSA)[number];

export type Conversa = {
  id: string;
  funcionarioId: string;
  estado: EstadoDaConversa;
  analistaId: string | null;
  resumoParaAnalista: string | null;
  criadaEm: Date;
  atualizadaEm: Date;
};

export const AUTORES_DE_MENSAGEM = [
  "funcionario",
  "agent",
  "analista",
  "sistema",
] as const;
export type AutorDeMensagem = (typeof AUTORES_DE_MENSAGEM)[number];

export const TIPOS_DE_ACAO_DO_AGENT = [
  "consultou_chamados",
  "consultou_chamado",
  "buscou_central_ajuda",
  "classificou_prioridade",
  "calculou_prazo",
  "montou_rascunho",
  "criou_chamado",
  "atualizou_chamado",
  "reabriu_chamado",
  "transferiu_para_analista",
] as const;
export type TipoDeAcaoDoAgent = (typeof TIPOS_DE_ACAO_DO_AGENT)[number];

export type AcaoDoAgent = {
  tipo: TipoDeAcaoDoAgent;
  descricao: string;
};

export type DecisaoDoAgent = {
  entendimento: string;
  acoes: AcaoDoAgent[];
  confianca: number;
  justificativa: string;
};

export type Mensagem = {
  id: string;
  conversaId: string;
  autor: AutorDeMensagem;
  conteudo: string;
  criadaEm: Date;
  decisao: DecisaoDoAgent | null;
};

export const CAMPOS_OBRIGATORIOS_DO_CHAMADO = [
  "titulo",
  "descricao",
  "tipo",
  "categoria",
  "prioridade",
  "afetados",
] as const;
export type CampoObrigatorioDoChamado =
  (typeof CAMPOS_OBRIGATORIOS_DO_CHAMADO)[number];

export type RascunhoDeChamado = Partial<
  Pick<Chamado, CampoObrigatorioDoChamado>
>;

export const LIMITE_DE_MENSAGENS_POR_SESSAO = 30;
export const MENSAGENS_PARA_AVISAR_DO_LIMITE = 25;
export const DIAS_PARA_REABRIR_CHAMADO = 7;
export const CONFIANCA_MINIMA_PARA_AGIR = 0.7;
