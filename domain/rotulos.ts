import type { Prazo } from "./prazos";
import type { MotivoDeTransferencia } from "./transferencia";
import type {
  EstadoDaConversa,
  Impacto,
  Intencao,
  Prioridade,
  StatusDeChamado,
  TipoDeChamado,
  Urgencia,
} from "./types";

export const ROTULO_DA_PRIORIDADE: Record<Prioridade, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const ROTULO_DO_STATUS: Record<StatusDeChamado, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  aguardando_analista: "Aguardando analista",
  aprovado: "Aprovado",
  resolvido: "Resolvido",
};

export const ROTULO_DO_TIPO: Record<TipoDeChamado, string> = {
  incidente: "Incidente",
  requisicao: "Requisição",
};

export const ROTULO_DO_IMPACTO: Record<Impacto, string> = {
  pessoa: "Somente você",
  equipe: "Sua equipe",
  empresa: "A empresa toda",
  desconhecido: "Não informado",
};

const UNIDADE_NO_SINGULAR: Record<Prazo["unidade"], string> = {
  hora_corrida: "hora",
  hora_util: "hora útil",
  dia_util: "dia útil",
};

const UNIDADE_NO_PLURAL: Record<Prazo["unidade"], string> = {
  hora_corrida: "horas",
  hora_util: "horas úteis",
  dia_util: "dias úteis",
};

export const descreverPrazo = ({ quantidade, unidade }: Prazo) =>
  `${quantidade} ${quantidade === 1 ? UNIDADE_NO_SINGULAR[unidade] : UNIDADE_NO_PLURAL[unidade]}`;

export const ROTULO_DO_ESTADO_DA_CONVERSA: Record<EstadoDaConversa, string> = {
  com_agent: "Com o agent",
  aguardando_analista: "Aguardando atendente",
  com_analista: "Em atendimento",
  encerrada: "Encerrada",
};

export const ROTULO_DA_URGENCIA: Record<Urgencia, string> = {
  trabalho_parado: "trabalho parado",
  compromisso_no_dia: "compromisso no mesmo dia",
  ha_alternativa: "atrapalha, mas há alternativa",
  sem_urgencia: "sem urgência",
};

export const ROTULO_DO_CAMPO_DO_RASCUNHO: Record<string, string> = {
  titulo: "título",
  descricao: "descrição",
  tipo: "tipo",
  categoria: "categoria",
  afetados: "quem é afetado",
  urgencia: "urgência",
};

export const ROTULO_DA_INTENCAO: Record<Intencao, string> = {
  tirar_duvida: "Tirar uma dúvida",
  consultar_chamado: "Consultar chamado",
  abrir_chamado: "Abrir chamado",
  complementar_chamado: "Complementar chamado",
  falar_com_analista: "Falar com um analista",
  fora_do_escopo: "Fora do escopo de TI",
  conversa: "Conversa",
};

export const ROTULO_DO_MOTIVO_DE_TRANSFERENCIA: Record<
  MotivoDeTransferencia,
  string
> = {
  pedido_do_funcionario: "a pessoa pediu um analista",
  caso_critico: "caso crítico",
  chamado_vencido: "chamado com prazo vencido",
  limite_de_mensagens: "limite de mensagens da sessão",
  baixa_confianca: "o agent não teve segurança para decidir",
};
