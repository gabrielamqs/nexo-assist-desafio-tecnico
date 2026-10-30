import { beforeEach, describe, expect, it } from "vitest";
import {
  ChamadoNaoEncontradoError,
  type RepositorioDeChamados,
} from "@/application/ports/ticket-repository";
import type { BancoDeDados } from "@/infrastructure/db/client";
import { construirChamadosDeExemplo } from "@/infrastructure/db/dados-exemplo";
import { chamados } from "@/infrastructure/db/schema";
import { comTentativas } from "@/infrastructure/ticket-repo/com-tentativas";
import {
  SistemaDeChamadosIndisponivelError,
  criarVerificacaoDeDisponibilidade,
} from "@/infrastructure/ticket-repo/indisponibilidade";
import { criarRepositorioDeChamados } from "@/infrastructure/ticket-repo/repositorio-sqlite";
import { criarBancoDeTeste } from "./banco-de-teste";

const AGORA = new Date("2026-03-09T14:00:00-03:00");
const DEPOIS = new Date("2026-03-10T09:00:00-03:00");

let banco: BancoDeDados;
let repositorio: RepositorioDeChamados;

beforeEach(async () => {
  banco = await criarBancoDeTeste();
  await banco.insert(chamados).values(construirChamadosDeExemplo(AGORA));
  repositorio = criarRepositorioDeChamados({ banco, agora: () => DEPOIS });
});

describe("consulta", () => {
  it("lista só os chamados do solicitante, do mais recente para o mais antigo", async () => {
    const daAna = await repositorio.listarPorSolicitante("usr-ana");

    expect(daAna.every((chamado) => chamado.solicitanteId === "usr-ana")).toBe(
      true,
    );
    expect(daAna.map((chamado) => chamado.codigo)).toEqual([
      "INC-20298",
      "INC-20150",
      "INC-20311",
      "REQ-10442",
      "INC-19877",
      "INC-19410",
    ]);
  });

  it("busca pelo código", async () => {
    const chamado = await repositorio.buscarPorCodigo("INC-20311");
    expect(chamado?.titulo).toBe("Notebook lento após atualização do Windows");
  });

  it("devolve null para código inexistente", async () => {
    await expect(repositorio.buscarPorCodigo("INC-99999")).resolves.toBeNull();
  });
});

describe("criar", () => {
  it("gera o próximo código a partir do maior do mesmo tipo", async () => {
    const criado = await repositorio.criar({
      tipo: "incidente",
      titulo: "VPN não conecta no notebook",
      descricao: "O notebook mostra o erro 809 ao conectar na VPN.",
      categoria: "Rede e VPN",
      prioridade: "alta",
      solicitanteId: "usr-ana",
      afetados: "pessoa",
    });

    expect(criado.codigo).toBe("INC-20456");
    expect(criado.status).toBe("aberto");
    expect(criado.abertoEm).toEqual(DEPOIS);
    expect(criado.resolvidoEm).toBeNull();
  });

  it("usa a faixa de REQ para requisição", async () => {
    const criado = await repositorio.criar({
      tipo: "requisicao",
      titulo: "Teclado novo",
      descricao: "Teclas falhando no teclado atual.",
      categoria: "Hardware",
      prioridade: "baixa",
      solicitanteId: "usr-bruno",
      afetados: "pessoa",
    });

    expect(criado.codigo).toBe("REQ-10521");
  });

  it("grava o chamado de verdade", async () => {
    const criado = await repositorio.criar({
      tipo: "incidente",
      titulo: "Impressora sem tinta",
      descricao: "A impressora do 2º andar está sem tinta.",
      categoria: "Hardware",
      prioridade: "baixa",
      solicitanteId: "usr-bruno",
      afetados: "equipe",
    });

    await expect(repositorio.buscarPorCodigo(criado.codigo)).resolves.toEqual(
      criado,
    );
  });
});

describe("atualizar", () => {
  it("registra a informação nova e reinicia a contagem do prazo", async () => {
    const atualizado = await repositorio.atualizar("INC-20311", {
      autor: "funcionario",
      texto: "A lentidão piorou depois da última atualização.",
    });

    expect(atualizado.atualizadoEm).toEqual(DEPOIS);

    const atualizacoes = await repositorio.listarAtualizacoes("INC-20311");
    expect(atualizacoes).toHaveLength(1);
    expect(atualizacoes[0]).toMatchObject({
      autor: "funcionario",
      texto: "A lentidão piorou depois da última atualização.",
      criadaEm: DEPOIS,
    });
  });

  it("marca a data de resolução ao resolver", async () => {
    const resolvido = await repositorio.atualizar("INC-20298", {
      autor: "analista",
      texto: "Permissão devolvida na pasta.",
      status: "resolvido",
    });

    expect(resolvido.status).toBe("resolvido");
    expect(resolvido.resolvidoEm).toEqual(DEPOIS);
  });

  it("limpa a data de resolução ao reabrir", async () => {
    const reaberto = await repositorio.atualizar("INC-20150", {
      autor: "funcionario",
      texto: "A senha bloqueou de novo.",
      status: "em_andamento",
    });

    expect(reaberto.resolvidoEm).toBeNull();
  });

  it("não remarca a data de um chamado que já estava resolvido", async () => {
    const original = await repositorio.buscarPorCodigo("INC-20150");

    const atualizado = await repositorio.atualizar("INC-20150", {
      autor: "analista",
      texto: "Fechamento confirmado com o funcionário.",
    });

    expect(atualizado.resolvidoEm).toEqual(original?.resolvidoEm);
  });

  it("avisa quando o chamado não existe", async () => {
    await expect(
      repositorio.atualizar("INC-99999", { autor: "agent", texto: "oi" }),
    ).rejects.toBeInstanceOf(ChamadoNaoEncontradoError);
  });
});

describe("transferir para analista", () => {
  it("muda o status e guarda o resumo do caso", async () => {
    const transferido = await repositorio.transferirParaAnalista(
      "INC-20298",
      "Funcionária precisa da pasta hoje; perdeu o acesso após mudança de time.",
    );

    expect(transferido.status).toBe("aguardando_analista");
    expect(transferido.atualizadoEm).toEqual(DEPOIS);

    const [resumo] = await repositorio.listarAtualizacoes("INC-20298");
    expect(resumo).toMatchObject({
      autor: "agent",
      texto:
        "Funcionária precisa da pasta hoje; perdeu o acesso após mudança de time.",
    });
  });
});

describe("indisponibilidade do sistema legado", () => {
  it("falha quando o sistema está fora do ar", async () => {
    const instavel = criarRepositorioDeChamados({
      banco,
      agora: () => DEPOIS,
      verificarDisponibilidade: criarVerificacaoDeDisponibilidade(1, () => 0),
    });

    await expect(
      instavel.listarPorSolicitante("usr-ana"),
    ).rejects.toBeInstanceOf(SistemaDeChamadosIndisponivelError);
  });

  it("se recupera quando a indisponibilidade é passageira", async () => {
    let chamadas = 0;
    const falhaNasDuasPrimeiras = () => (chamadas++ < 2 ? 0 : 1);

    const instavel = criarRepositorioDeChamados({
      banco,
      agora: () => DEPOIS,
      verificarDisponibilidade: criarVerificacaoDeDisponibilidade(
        0.5,
        falhaNasDuasPrimeiras,
      ),
    });

    const protegido = comTentativas(instavel, { esperar: async () => {} });

    await expect(
      protegido.listarPorSolicitante("usr-ana"),
    ).resolves.toHaveLength(6);
    expect(chamadas).toBe(3);
  });

  it("não grava nada quando a indisponibilidade interrompe a escrita", async () => {
    const instavel = criarRepositorioDeChamados({
      banco,
      agora: () => DEPOIS,
      verificarDisponibilidade: criarVerificacaoDeDisponibilidade(1, () => 0),
    });

    await expect(
      instavel.atualizar("INC-20311", { autor: "agent", texto: "tentativa" }),
    ).rejects.toBeInstanceOf(SistemaDeChamadosIndisponivelError);

    await expect(
      repositorio.listarAtualizacoes("INC-20311"),
    ).resolves.toHaveLength(0);
  });
});
