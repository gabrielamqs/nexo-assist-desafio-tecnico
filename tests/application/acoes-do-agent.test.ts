import { describe, expect, it } from "vitest";
import {
  acoesDasFerramentas,
  dadosConsultadosNasFerramentas,
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
      detalhe: "indisponível",
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

const chamadoVencido = {
  codigo: "INC-20311",
  tipo: "incidente",
  titulo: "Notebook lento após atualização do Windows",
  descricao: "Lentidão desde a atualização.",
  categoria: "Hardware",
  prioridade: "media",
  status: "aguardando_analista",
  abertoEm: "2026-02-23T17:00:00.000Z",
  atualizadoEm: "2026-03-03T17:00:00.000Z",
  prazoDeResposta: "2026-03-06T17:00:00.000Z",
  vencido: true,
  podeSerReaberto: false,
  atualizacoes: [],
};

describe("detalhe das ações, para o painel de transparência", () => {
  it("resume o que a consulta encontrou", () => {
    const [acao] = acoesDasFerramentas([
      chamada({
        ferramenta: "consultar_chamados",
        saida: {
          total: 2,
          chamados: [
            chamadoVencido,
            {
              ...chamadoVencido,
              codigo: "INC-1",
              status: "resolvido",
              vencido: false,
            },
          ],
        },
      }),
    ]);

    expect(acao?.detalhe).toBe("2 chamados no total, 1 em aberto, 1 vencido");
  });

  it("mostra o termo buscado e os artigos encontrados", () => {
    const [acao] = acoesDasFerramentas([
      chamada({
        ferramenta: "buscar_central_ajuda",
        entrada: { termo: "vpn erro 809" },
        saida: {
          total: 1,
          artigos: [{ id: "kb-001", titulo: "VPN com erro 809" }],
        },
      }),
    ]);

    expect(acao?.detalhe).toBe('"vpn erro 809" → VPN com erro 809');
  });

  it("explica de onde veio a prioridade", () => {
    const [acao] = acoesDasFerramentas([
      chamada({
        ferramenta: "propor_chamado",
        entrada: { afetados: "pessoa", urgencia: "compromisso_no_dia" },
        saida: {
          completo: true,
          rascunho,
          prazoDeResposta: "2026-03-09T21:00:00.000Z",
        },
      }),
    ]);

    expect(acao?.detalhe).toBe(
      "afetados: somente você, urgência: compromisso no mesmo dia → prioridade alta pela tabela do Anexo A, resposta até 09 mar, 18:00",
    );
  });

  it("lista o que falta no rascunho com nomes legíveis", () => {
    const [acao] = acoesDasFerramentas([
      chamada({
        ferramenta: "propor_chamado",
        saida: { completo: false, camposFaltando: ["afetados", "urgencia"] },
      }),
    ]);

    expect(acao?.detalhe).toBe("faltam: quem é afetado, urgência");
  });
});

describe("dadosConsultadosNasFerramentas", () => {
  it("guarda os chamados listados sem campos que a tela não usa", () => {
    const { chamadosListados } = dadosConsultadosNasFerramentas([
      chamada({
        ferramenta: "consultar_chamados",
        saida: { total: 1, chamados: [chamadoVencido] },
      }),
    ]);

    expect(chamadosListados).toHaveLength(1);
    expect(chamadosListados[0]).not.toHaveProperty("atualizacoes");
    expect(chamadosListados[0]).not.toHaveProperty("descricao");
  });

  it("guarda o chamado consultado com a descrição", () => {
    const { chamadoConsultado } = dadosConsultadosNasFerramentas([
      chamada({ ferramenta: "consultar_chamado", saida: chamadoVencido }),
    ]);

    expect(chamadoConsultado).toMatchObject({
      codigo: "INC-20311",
      descricao: "Lentidão desde a atualização.",
    });
  });

  it("junta os artigos de várias buscas sem repetir", () => {
    const artigo = { id: "kb-001", titulo: "VPN com erro 809" };
    const { artigosConsultados } = dadosConsultadosNasFerramentas([
      chamada({
        ferramenta: "buscar_central_ajuda",
        saida: { artigos: [artigo] },
      }),
      chamada({
        ferramenta: "buscar_central_ajuda",
        saida: { artigos: [artigo] },
      }),
    ]);

    expect(artigosConsultados).toEqual([artigo]);
  });

  it("ignora consultas que falharam", () => {
    expect(
      dadosConsultadosNasFerramentas([
        chamada({
          ferramenta: "consultar_chamado",
          saida: { erro: "indisponível" },
          sucesso: false,
        }),
      ]),
    ).toEqual({
      chamadosListados: [],
      chamadoConsultado: null,
      artigosConsultados: [],
    });
  });
});

describe("houveChamadoVencido", () => {
  it("detecta o chamado vencido consultado", () => {
    expect(
      houveChamadoVencido([
        chamada({ ferramenta: "consultar_chamado", saida: chamadoVencido }),
      ]),
    ).toBe(true);
  });

  it("não conta vencidos só por ter listado os chamados", () => {
    expect(
      houveChamadoVencido([
        chamada({
          ferramenta: "consultar_chamados",
          saida: { chamados: [chamadoVencido] },
        }),
      ]),
    ).toBe(false);
  });
});
