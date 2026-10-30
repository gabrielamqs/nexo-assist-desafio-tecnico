import type { Chamado, Prioridade } from "./types";

export type UnidadeDePrazo = "hora_corrida" | "hora_util" | "dia_util";

export type Prazo = {
  quantidade: number;
  unidade: UnidadeDePrazo;
};

export const PRAZO_POR_PRIORIDADE: Record<Prioridade, Prazo> = {
  critica: { quantidade: 1, unidade: "hora_corrida" },
  alta: { quantidade: 4, unidade: "hora_util" },
  media: { quantidade: 3, unidade: "dia_util" },
  baixa: { quantidade: 5, unidade: "dia_util" },
};

export const EXPEDIENTE = { horaDeInicio: 8, horaDeFim: 18 } as const;
export const HORAS_UTEIS_POR_DIA =
  EXPEDIENTE.horaDeFim - EXPEDIENTE.horaDeInicio;

// Brasil não adota horário de verão desde 2019, então o offset de São Paulo é fixo.
const OFFSET_DO_FUSO_EM_MINUTOS = -180;

const MS_POR_MINUTO = 60_000;
const MS_POR_HORA = 60 * MS_POR_MINUTO;
const MS_POR_DIA = 24 * MS_POR_HORA;
const OFFSET_EM_MS = OFFSET_DO_FUSO_EM_MINUTOS * MS_POR_MINUTO;

const paraHorarioLocal = (instante: Date) =>
  new Date(instante.getTime() + OFFSET_EM_MS);

const paraInstante = (horarioLocal: Date) =>
  new Date(horarioLocal.getTime() - OFFSET_EM_MS);

const ehDiaUtil = (horarioLocal: Date) => {
  const diaDaSemana = horarioLocal.getUTCDay();
  return diaDaSemana >= 1 && diaDaSemana <= 5;
};

const comHora = (horarioLocal: Date, hora: number) => {
  const resultado = new Date(horarioLocal);
  resultado.setUTCHours(hora, 0, 0, 0);
  return resultado;
};

const inicioDoExpediente = (horarioLocal: Date) =>
  comHora(horarioLocal, EXPEDIENTE.horaDeInicio);

const fimDoExpediente = (horarioLocal: Date) =>
  comHora(horarioLocal, EXPEDIENTE.horaDeFim);

const inicioDoProximoExpediente = (horarioLocal: Date) =>
  inicioDoExpediente(new Date(horarioLocal.getTime() + MS_POR_DIA));

const proximoHorarioUtil = (horarioLocal: Date) => {
  let atual = horarioLocal;
  while (true) {
    if (!ehDiaUtil(atual)) {
      atual = inicioDoProximoExpediente(atual);
      continue;
    }
    if (atual < inicioDoExpediente(atual)) return inicioDoExpediente(atual);
    if (atual >= fimDoExpediente(atual)) {
      atual = inicioDoProximoExpediente(atual);
      continue;
    }
    return atual;
  }
};

export function adicionarHorasUteis(inicio: Date, horas: number): Date {
  let atual = proximoHorarioUtil(paraHorarioLocal(inicio));
  let restanteEmMs = horas * MS_POR_HORA;

  while (restanteEmMs > 0) {
    const fim = fimDoExpediente(atual);
    const disponivelEmMs = fim.getTime() - atual.getTime();

    if (disponivelEmMs >= restanteEmMs) {
      atual = new Date(atual.getTime() + restanteEmMs);
      restanteEmMs = 0;
    } else {
      restanteEmMs -= disponivelEmMs;
      atual = proximoHorarioUtil(inicioDoProximoExpediente(fim));
    }
  }

  return paraInstante(atual);
}

export function calcularPrazo(inicio: Date, prioridade: Prioridade): Date {
  const prazo = PRAZO_POR_PRIORIDADE[prioridade];

  switch (prazo.unidade) {
    case "hora_corrida":
      return new Date(inicio.getTime() + prazo.quantidade * MS_POR_HORA);
    case "hora_util":
      return adicionarHorasUteis(inicio, prazo.quantidade);
    case "dia_util":
      return adicionarHorasUteis(
        inicio,
        prazo.quantidade * HORAS_UTEIS_POR_DIA,
      );
  }
}

export const prazoDoChamado = (chamado: Chamado): Date =>
  calcularPrazo(chamado.atualizadoEm, chamado.prioridade);

export function estaVencido(chamado: Chamado, agora: Date): boolean {
  if (chamado.status === "resolvido") return false;
  return agora.getTime() > prazoDoChamado(chamado).getTime();
}
