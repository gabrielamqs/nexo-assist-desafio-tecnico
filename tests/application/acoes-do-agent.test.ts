import { describe, expect, it } from "vitest";
import {
  acoesDasFerramentas,
  houveChamadoVencido,
  propostaDasFerramentas,
} from "@/application/acoes-do-agent";
import type { ChamadaDeFerramenta } from "@/application/ports/assistente";

const rascunho = {
  tipo: "incidente",
  titulo: "VPN não conecta",
  descricao: "Erro 809 desde ontem.",
  categoria: "Rede e VPN",
  prioridade: "alta",
  afetados: "pessoa",
} as const;

const chamada = (
  dados: Pick<ChamadaDeFerramenta, "ferramenta" | "saida"> &
    Partial<ChamadaDeFerramenta>,
): ChamadaDeFerramenta => ({ entrada: {}, sucesso: true, ...dados });

describe("acoesDasFerramentas", () => {
  it("descreve o que o agent fez com as palavras do protótipo", () => {
    const acoes = acoesDasFerramentas([
      chamada({ ferramenta: "consultar_chamados", saida: {} }),
      chamada({ ferramenta: "buscar_central_ajuda", saida: {} }),
    ]);

    expect(acoes.map((acao) => acao.descricao)).toEqual([
      "consultou seus chamados",
      "buscou na central de ajuda",
    ]);
  });

  it("desdobra o rascunho em classificar, consultar o SLA e montar", () => {
    const acoes = acoesDasFerramentas([
      chamada({
        ferramenta: "propor_chamado",
        saida: {
          completo: true,
          rascunho,
          prazoDeResposta: "2026-03-09T21:00:00.000Z",
        },
      }),
    ]);

    expect(acoes.map((acao) => acao.descricao)).toEqual([
      "classificou a prioridade",
      "consultou o SLA",
      "montou o rascunho",
    ]);
  });

  it("cita o código do chamado consultado", () => {
    const acoes = acoesDasFerramentas([
      chamada({
        ferramenta: "consultar_chamado",
        entrada: { codigo: "INC-20311" },
        saida: { codigo: "INC-20311", vencido: true },
      }),
    ]);

    expect(acoes.map((acao) => acao.descricao)).toEqual([
      "consultou o INC-20311",
      "calculou o prazo",
    ]);
  });

  it("mostra a falha em vez de esconder", () => {
    const [acao] = acoesDasFerramentas([
      chamada({
        ferramenta: "consultar_chamados",
        saida: { erro: "indisponível" },
        sucesso: false,
      }),
    ]);

    expect(acao).toEqual({
      tipo: "consultou_chamados",
      descricao: "não conseguiu consultar seus chamados",
      sucesso: false,
    });
  });
});

describe("propostaDasFerramentas", () => {
  it("usa o último rascunho completo", () => {
    const proposta = propostaDasFerramentas([
      chamada({
        ferramenta: "propor_chamado",
        saida: { completo: false, camposFaltando: ["urgencia"] },
      }),
      chamada({
        ferramenta: "propor_chamado",
        saida: {
          completo: true,
          rascunho,
          prazoDeResposta: "2026-03-09T21:00:00.000Z",
        },
      }),
    ]);

    expect(proposta).toEqual({
      tipo: "criar",
      rascunho,
      prazoDeResposta: "2026-03-09T21:00:00.000Z",
    });
  });

  it("não propõe nada a partir de rascunho incompleto", () => {
    expect(
      propostaDasFerramentas([
        chamada({
          ferramenta: "propor_chamado",
          saida: { completo: false, camposFaltando: ["urgencia"] },
        }),
      ]),
    ).toBeNull();
  });

  it("propõe a atualização permitida", () => {
    expect(
      propostaDasFerramentas([
        chamada({
          ferramenta: "propor_atualizacao",
          saida: {
            permitido: true,
            codigo: "INC-20150",
            texto: "Bloqueou de novo.",
            reabrir: true,
          },
        }),
      ]),
    ).toEqual({
      tipo: "atualizar",
      codigo: "INC-20150",
      texto: "Bloqueou de novo.",
      reabrir: true,
    });
  });

  it("ignora saídas que não têm o formato esperado", () => {
    expect(
      propostaDasFerramentas([
        chamada({ ferramenta: "propor_chamado", saida: { completo: true } }),
      ]),
    ).toBeNull();
  });
});

describe("houveChamadoVencido", () => {
  it("detecta o chamado vencido consultado", () => {
    expect(
      houveChamadoVencido([
        chamada({
          ferramenta: "consultar_chamado",
          saida: { codigo: "INC-20311", vencido: true },
        }),
      ]),
    ).toBe(true);
  });

  it("não conta vencidos só por ter listado os chamados", () => {
    expect(
      houveChamadoVencido([
        chamada({
          ferramenta: "consultar_chamados",
          saida: { chamados: [{ codigo: "INC-20311", vencido: true }] },
        }),
      ]),
    ).toBe(false);
  });
});
