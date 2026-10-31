import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import { transferirConversa } from "@/application/usecases/transferir-conversa";
import type { Conversa } from "@/domain/types";
import { criarRepositorioDeConversas } from "@/infrastructure/conversas/repositorio-sqlite";
import { criarServicoEmMemoria } from "../agent/servico-em-memoria";

const AGORA = new Date("2026-03-09T10:00:00-03:00");
const RESUMO = "A VPN não conecta no Windows 11 e a pessoa tem reunião hoje.";

let conversas: RepositorioDeConversas;
let chamados: RepositorioDeChamados;
let conversa: Conversa;

beforeEach(async () => {
  const servico = await criarServicoEmMemoria(AGORA);
  chamados = servico.repositorioDeChamados;
  conversas = criarRepositorioDeConversas({
    banco: servico.banco,
    agora: () => AGORA,
  });
  conversa = await conversas.criar("usr-ana");
});

describe("transferirConversa", () => {
  it("marca a conversa como aguardando analista e guarda o resumo", async () => {
    const resultado = await transferirConversa(
      { conversas, chamados },
      {
        conversa,
        motivo: "pedido_do_funcionario",
        resumo: RESUMO,
        codigoDoChamado: null,
      },
    );

    expect(resultado.conversa).toMatchObject({
      estado: "aguardando_analista",
      resumoParaAnalista: RESUMO,
    });
    await expect(conversas.buscarPorId(conversa.id)).resolves.toMatchObject({
      estado: "aguardando_analista",
    });
  });

  it("registra o motivo na conversa, para o funcionário e o analista verem", async () => {
    const { aviso } = await transferirConversa(
      { conversas, chamados },
      {
        conversa,
        motivo: "baixa_confianca",
        resumo: RESUMO,
        codigoDoChamado: null,
      },
    );

    expect(aviso).toMatchObject({
      autor: "sistema",
      conteudo:
        "Transferida para um analista · o agent não teve segurança para decidir",
    });
  });

  it("transfere também o chamado em questão", async () => {
    const resultado = await transferirConversa(
      { conversas, chamados },
      {
        conversa,
        motivo: "chamado_vencido",
        resumo: RESUMO,
        codigoDoChamado: "INC-20311",
      },
    );

    expect(resultado.chamadoTransferido).toBe("INC-20311");
    await expect(chamados.buscarPorCodigo("INC-20311")).resolves.toMatchObject({
      status: "aguardando_analista",
    });
    const [atualizacao] = await chamados.listarAtualizacoes("INC-20311");
    expect(atualizacao).toMatchObject({ autor: "agent", texto: RESUMO });
  });

  it("não desfaz a transferência se o sistema de chamados falhar", async () => {
    const instavel: RepositorioDeChamados = {
      ...chamados,
      transferirParaAnalista: vi.fn(async () => {
        throw new Error("sistema de chamados indisponível");
      }),
    };

    const resultado = await transferirConversa(
      { conversas, chamados: instavel },
      {
        conversa,
        motivo: "caso_critico",
        resumo: RESUMO,
        codigoDoChamado: "INC-20311",
      },
    );

    expect(resultado.chamadoTransferido).toBeNull();
    expect(resultado.conversa.estado).toBe("aguardando_analista");
  });
});
