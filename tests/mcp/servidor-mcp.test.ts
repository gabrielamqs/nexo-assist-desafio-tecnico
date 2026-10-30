import type { MCPServer } from "@mastra/mcp";
import { beforeEach, describe, expect, it } from "vitest";
import { criarCentralDeAjuda } from "@/infrastructure/central-de-ajuda/repositorio-sqlite";
import { construirChamadosDeExemplo } from "@/infrastructure/db/dados-exemplo";
import { chamados } from "@/infrastructure/db/schema";
import { criarServidorMcp } from "@/infrastructure/mcp/servidor";
import { criarRepositorioDeChamados } from "@/infrastructure/ticket-repo/repositorio-sqlite";
import { criarBancoComArtigos } from "../infrastructure/banco-de-teste";

const AGORA = new Date("2026-03-09T14:00:00-03:00");

type ChamadoNaFerramenta = {
  codigo: string;
  status: string;
  prioridade: string;
  vencido: boolean;
  prazoDeResposta: string;
  podeSerReaberto: boolean;
  atualizacoes?: { autor: string; texto: string }[];
};

let servidor: MCPServer;

const executar = async <T>(ferramenta: string, argumentos: unknown) => {
  const resultado = (await servidor.executeTool(ferramenta, argumentos)) as {
    status: string;
    output: T;
  };
  expect(resultado.status).toBe("completed");
  return resultado.output;
};

beforeEach(async () => {
  const banco = await criarBancoComArtigos();
  await banco.insert(chamados).values(construirChamadosDeExemplo(AGORA));

  servidor = criarServidorMcp({
    repositorioDeChamados: criarRepositorioDeChamados({
      banco,
      agora: () => AGORA,
    }),
    centralDeAjuda: criarCentralDeAjuda(banco),
    agora: () => AGORA,
  });
});

describe("ferramentas expostas", () => {
  it("publica as ferramentas do serviço de chamados", async () => {
    const { tools } = await servidor.getToolListInfo();

    expect(tools.map((ferramenta) => ferramenta.name).sort()).toEqual([
      "atualizar_chamado",
      "buscar_central_ajuda",
      "consultar_chamado",
      "consultar_chamados",
      "criar_chamado",
      "transferir_chamado",
    ]);
  });

  it("descreve cada ferramenta para o agent saber quando usar", async () => {
    const { tools } = await servidor.getToolListInfo();

    for (const ferramenta of tools) {
      expect(ferramenta.description ?? "").not.toBe("");
    }
  });
});

describe("consultar_chamados", () => {
  it("devolve os chamados do funcionário com prazo e situação", async () => {
    const resultado = await executar<{
      total: number;
      chamados: ChamadoNaFerramenta[];
    }>("consultar_chamados", { funcionarioId: "usr-ana" });

    expect(resultado.total).toBe(6);

    const vencido = resultado.chamados.find(
      (chamado) => chamado.codigo === "INC-20311",
    );
    expect(vencido?.vencido).toBe(true);
    expect(vencido?.prazoDeResposta).toBe("2026-03-06T17:00:00.000Z");
  });

  it("não mistura chamados de funcionários diferentes", async () => {
    const resultado = await executar<{ chamados: ChamadoNaFerramenta[] }>(
      "consultar_chamados",
      { funcionarioId: "usr-bruno" },
    );

    expect(resultado.chamados.map((chamado) => chamado.codigo)).toEqual([
      "INC-20377",
    ]);
  });
});

describe("consultar_chamado", () => {
  it("traz o chamado com o histórico de atualizações", async () => {
    await executar("atualizar_chamado", {
      funcionarioId: "usr-ana",
      codigo: "INC-20311",
      texto: "A lentidão piorou hoje.",
    });

    const resultado = await executar<ChamadoNaFerramenta>("consultar_chamado", {
      funcionarioId: "usr-ana",
      codigo: "INC-20311",
    });

    expect(resultado.atualizacoes).toEqual([
      expect.objectContaining({
        autor: "funcionario",
        texto: "A lentidão piorou hoje.",
      }),
    ]);
  });

  it("marca como reabrível o chamado resolvido há menos de 7 dias", async () => {
    const resultado = await executar<ChamadoNaFerramenta>("consultar_chamado", {
      funcionarioId: "usr-ana",
      codigo: "INC-20150",
    });

    expect(resultado.podeSerReaberto).toBe(true);
  });
});

describe("privacidade", () => {
  it("recusa o chamado de outro funcionário", async () => {
    await expect(
      servidor.executeTool("consultar_chamado", {
        funcionarioId: "usr-ana",
        codigo: "INC-20377",
      }),
    ).rejects.toThrow(/Nenhum chamado INC-20377 foi encontrado/);
  });

  it("responde igual para chamado inexistente, sem revelar que o outro existe", async () => {
    const deOutro = await servidor
      .executeTool("consultar_chamado", {
        funcionarioId: "usr-ana",
        codigo: "INC-20377",
      })
      .catch((erro: Error) => erro.message.replace("INC-20377", "CODIGO"));

    const inexistente = await servidor
      .executeTool("consultar_chamado", {
        funcionarioId: "usr-ana",
        codigo: "INC-99999",
      })
      .catch((erro: Error) => erro.message.replace("INC-99999", "CODIGO"));

    expect(deOutro).toBe(inexistente);
  });

  it("não deixa atualizar o chamado de outro funcionário", async () => {
    await expect(
      servidor.executeTool("atualizar_chamado", {
        funcionarioId: "usr-ana",
        codigo: "INC-20377",
        texto: "tentativa indevida",
      }),
    ).rejects.toThrow(/Nenhum chamado/);
  });

  it("não deixa transferir o chamado de outro funcionário", async () => {
    await expect(
      servidor.executeTool("transferir_chamado", {
        funcionarioId: "usr-ana",
        codigo: "INC-20377",
        resumo: "tentativa indevida",
      }),
    ).rejects.toThrow(/Nenhum chamado/);
  });
});

describe("criar_chamado", () => {
  it("abre o chamado com código novo e status aberto", async () => {
    const criado = await executar<ChamadoNaFerramenta>("criar_chamado", {
      funcionarioId: "usr-ana",
      tipo: "incidente",
      titulo: "VPN não conecta no notebook",
      descricao: "O notebook com Windows 11 mostra o erro 809 ao conectar.",
      categoria: "Rede e VPN",
      prioridade: "alta",
      afetados: "pessoa",
    });

    expect(criado.codigo).toBe("INC-20456");
    expect(criado.status).toBe("aberto");
    expect(criado.vencido).toBe(false);
  });

  it("recusa categoria fora das previstas no Anexo A", async () => {
    await expect(
      servidor.executeTool("criar_chamado", {
        funcionarioId: "usr-ana",
        tipo: "incidente",
        titulo: "Reembolso atrasado",
        descricao: "O reembolso do mês passado não caiu.",
        categoria: "Financeiro",
        prioridade: "media",
        afetados: "pessoa",
      }),
    ).rejects.toThrow();
  });
});

describe("transferir_chamado", () => {
  it("marca como aguardando analista e guarda o resumo", async () => {
    const transferido = await executar<ChamadoNaFerramenta>(
      "transferir_chamado",
      {
        funcionarioId: "usr-ana",
        codigo: "INC-20298",
        resumo: "Perdeu o acesso à pasta após mudar de time; precisa hoje.",
      },
    );

    expect(transferido.status).toBe("aguardando_analista");

    const detalhe = await executar<ChamadoNaFerramenta>("consultar_chamado", {
      funcionarioId: "usr-ana",
      codigo: "INC-20298",
    });

    expect(detalhe.atualizacoes).toEqual([
      expect.objectContaining({ autor: "agent" }),
    ]);
  });
});

describe("buscar_central_ajuda", () => {
  it("acha o artigo do assunto perguntado", async () => {
    const resultado = await executar<{
      total: number;
      artigos: { titulo: string }[];
    }>("buscar_central_ajuda", { termo: "vpn erro 809" });

    expect(resultado.artigos[0]?.titulo).toBe("VPN com erro 809");
  });

  it("devolve vazio quando o assunto não é de TI", async () => {
    const resultado = await executar<{ total: number }>(
      "buscar_central_ajuda",
      { termo: "reembolso de despesas médicas" },
    );

    expect(resultado.total).toBe(0);
  });
});
