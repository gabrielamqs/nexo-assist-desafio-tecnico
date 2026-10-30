import { describe, expect, it } from "vitest";
import {
  adicionarHorasUteis,
  calcularPrazo,
  estaVencido,
} from "@/domain/prazos";
import type { Chamado } from "@/domain/types";

const local = (dataHora: string) => new Date(`${dataHora}-03:00`);

const SEGUNDA = "2026-03-02";
const TERCA = "2026-03-03";
const QUINTA = "2026-03-05";
const SABADO = "2026-03-07";
const SEGUNDA_SEGUINTE = "2026-03-09";
const TERCA_SEGUINTE = "2026-03-10";

describe("adicionarHorasUteis", () => {
  it("soma dentro do mesmo expediente", () => {
    expect(adicionarHorasUteis(local(`${SEGUNDA}T09:00`), 4)).toEqual(
      local(`${SEGUNDA}T13:00`),
    );
  });

  it("continua no dia seguinte quando o expediente acaba", () => {
    expect(adicionarHorasUteis(local(`${SEGUNDA}T16:00`), 4)).toEqual(
      local(`${TERCA}T10:00`),
    );
  });

  it("começa no próximo dia útil quando parte de um fim de semana", () => {
    expect(adicionarHorasUteis(local(`${SABADO}T10:00`), 4)).toEqual(
      local(`${SEGUNDA_SEGUINTE}T12:00`),
    );
  });

  it("começa na abertura quando parte de antes do expediente", () => {
    expect(adicionarHorasUteis(local(`${SEGUNDA}T06:00`), 4)).toEqual(
      local(`${SEGUNDA}T12:00`),
    );
  });

  it("começa no dia seguinte quando parte de depois do expediente", () => {
    expect(adicionarHorasUteis(local(`${SEGUNDA}T19:00`), 2)).toEqual(
      local(`${TERCA}T10:00`),
    );
  });

  it("pula o fim de semana ao atravessar vários dias", () => {
    expect(adicionarHorasUteis(local(`${QUINTA}T10:00`), 30)).toEqual(
      local(`${TERCA_SEGUINTE}T10:00`),
    );
  });
});

describe("calcularPrazo", () => {
  it("trata prioridade crítica como 1 hora corrida, fora do expediente", () => {
    expect(calcularPrazo(local(`${SABADO}T23:00`), "critica")).toEqual(
      local(`2026-03-08T00:00`),
    );
  });

  it("dá 4 horas úteis para prioridade alta", () => {
    expect(calcularPrazo(local(`${SEGUNDA}T09:00`), "alta")).toEqual(
      local(`${SEGUNDA}T13:00`),
    );
  });

  it("dá 3 dias úteis para prioridade média", () => {
    expect(calcularPrazo(local(`${SEGUNDA}T10:00`), "media")).toEqual(
      local(`2026-03-05T10:00`),
    );
  });

  it("dá 5 dias úteis para prioridade baixa", () => {
    expect(calcularPrazo(local(`${SEGUNDA}T10:00`), "baixa")).toEqual(
      local(`${SEGUNDA_SEGUINTE}T10:00`),
    );
  });
});

const chamadoMedia = (atualizadoEm: Date, status: Chamado["status"]) =>
  ({
    codigo: "INC-1",
    tipo: "incidente",
    titulo: "Notebook lento",
    descricao: "Lentidão desde a atualização",
    categoria: "Hardware",
    prioridade: "media",
    status,
    solicitanteId: "usr-ana",
    afetados: "pessoa",
    abertoEm: atualizadoEm,
    atualizadoEm,
    resolvidoEm: status === "resolvido" ? atualizadoEm : null,
  }) satisfies Chamado;

describe("estaVencido", () => {
  it("marca como vencido o chamado em aberto além do prazo", () => {
    const chamado = chamadoMedia(local(`${SEGUNDA}T10:00`), "aberto");
    expect(estaVencido(chamado, local(`${SEGUNDA_SEGUINTE}T10:00`))).toBe(true);
  });

  it("não marca como vencido o chamado dentro do prazo", () => {
    const chamado = chamadoMedia(local(`${SEGUNDA}T10:00`), "aberto");
    expect(estaVencido(chamado, local(`${TERCA}T10:00`))).toBe(false);
  });

  it("nunca marca como vencido um chamado resolvido", () => {
    const chamado = chamadoMedia(local(`${SEGUNDA}T10:00`), "resolvido");
    expect(estaVencido(chamado, local(`${SEGUNDA_SEGUINTE}T10:00`))).toBe(
      false,
    );
  });
});
