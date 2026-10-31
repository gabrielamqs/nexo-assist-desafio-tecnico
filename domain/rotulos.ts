import type { Prazo } from "./prazos";
import type {
  Impacto,
  Prioridade,
  StatusDeChamado,
  TipoDeChamado,
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
