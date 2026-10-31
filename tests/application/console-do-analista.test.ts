import { beforeEach, describe, expect, it } from "vitest";
import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import type { RepositorioDeUsuarios } from "@/application/ports/usuarios";
import {
  ConversaIndisponivelError,
  assumirAtendimento,
  carregarAtendimento,
  contarPorFiltro,
  devolverAoAgent,
  encerrarAtendimento,
  listarFila,
  responderComoAnalista,
} from "@/application/usecases/console-do-analista";
import { FILTROS_DA_FILA } from "@/domain/conversas";
import type { Conversa, Usuario } from "@/domain/types";
import { criarRepositorioDeConversas } from "@/infrastructure/conversas/repositorio-sqlite";
import { USUARIOS_DE_EXEMPLO } from "@/infrastructure/db/dados-exemplo";
import { criarRepositorioDeUsuarios } from "@/infrastructure/usuarios/repositorio-sqlite";
import { criarServicoEmMemoria } from "../agent/servico-em-memoria";

const AGORA = new Date("2026-03-09T10:00:00-03:00");
const porId = (id: string) =>
  USUARIOS_DE_EXEMPLO.find((usuario) => usuario.id === id)!;

const rafael = porId("usr-rafael");
const ana = porId("usr-ana");
const bruno = porId("usr-bruno");

let conversas: RepositorioDeConversas;
let chamados: RepositorioDeChamados;
let usuarios: RepositorioDeUsuarios;
let dependencias: {
  conversas: RepositorioDeConversas;
  chamados: RepositorioDeChamados;
  usuarios: RepositorioDeUsuarios;
  agora: () => Date;
};
let daAna: Conversa;
let doBruno: Conversa;

beforeEach(async () => {
  const servico = await criarServicoEmMemoria(AGORA);
  chamados = servico.repositorioDeChamados;
  usuarios = criarRepositorioDeUsuarios(servico.banco);
  conversas = criarRepositorioDeConversas({
    banco: servico.banco,
    agora: () => AGORA,
  });
  dependencias = { conversas, chamados, usuarios, agora: () => AGORA };

  daAna = await conversas.criar(ana.id);
  await conversas.adicionarMensagem({
    conversaId: daAna.id,
    autor: "funcionario",
    conteudo: "Meu notebook está lento.",
    decisao: null,
  });
  daAna = await conversas.transferirParaAnalista(
    daAna.id,
    "Notebook lento; chamado INC-20311 vencido.",
  );

  doBruno = await conversas.criar(bruno.id);
});

describe("fila do analista", () => {
  it("separa o que espera atendimento do que está com o agent", async () => {
    const paraVoce = await listarFila(
      { conversas },
      { analista: rafael, filtro: "para_voce" },
    );
    const comAgent = await listarFila(
      { conversas },
      { analista: rafael, filtro: "com_agent" },
    );

    expect(paraVoce.map((item) => item.conversa.id)).toEqual([daAna.id]);
    expect(comAgent.map((item) => item.conversa.id)).toEqual([doBruno.id]);
  });

  it("traz o nome do funcionário e a última mensagem para a lista", async () => {
    const [item] = await listarFila(
      { conversas },
      { analista: rafael, filtro: "para_voce" },
    );

    expect(item?.funcionario.nome).toBe("Ana Souza");
    expect(item?.ultimaMensagem?.conteudo).toBe("Meu notebook está lento.");
    expect(item?.mensagensDoFuncionario).toBe(1);
  });

  it("conta cada aba para o analista saber onde olhar", async () => {
    const contagem = await contarPorFiltro(
      { conversas },
      rafael,
      FILTROS_DA_FILA,
    );

    expect(contagem).toMatchObject({
      para_voce: 1,
      com_agent: 1,
      minhas: 0,
      encerradas: 0,
      todas: 2,
    });
  });

  it("só mostra em 'minhas' o que este analista assumiu", async () => {
    await assumirAtendimento(
      { conversas },
      { analista: rafael, conversaId: daAna.id },
    );

    const minhas = await listarFila(
      { conversas },
      { analista: rafael, filtro: "minhas" },
    );
    const deOutro: Usuario = { ...rafael, id: "usr-outro" };
    const doOutro = await listarFila(
      { conversas },
      { analista: deOutro, filtro: "minhas" },
    );

    expect(minhas).toHaveLength(1);
    expect(doOutro).toHaveLength(0);
  });
});

describe("carregarAtendimento", () => {
  it("entrega a conversa, o histórico e os chamados do funcionário", async () => {
    const atendimento = await carregarAtendimento(dependencias, {
      analista: rafael,
      conversaId: daAna.id,
    });

    expect(atendimento.funcionario.nome).toBe("Ana Souza");
    expect(atendimento.mensagens).toHaveLength(1);
    expect(atendimento.chamados.length).toBeGreaterThan(0);
    expect(
      atendimento.chamados.every((chamado) => chamado.solicitanteId === ana.id),
    ).toBe(true);
  });

  it("marca o chamado vencido e calcula o prazo", async () => {
    const atendimento = await carregarAtendimento(dependencias, {
      analista: rafael,
      conversaId: daAna.id,
    });

    const vencido = atendimento.chamados.find(
      (chamado) => chamado.codigo === "INC-20311",
    );
    expect(vencido?.vencido).toBe(true);
    expect(vencido?.prazoDeResposta).toBeInstanceOf(Date);
  });

  it("não deixa responder antes de assumir", async () => {
    const atendimento = await carregarAtendimento(dependencias, {
      analista: rafael,
      conversaId: daAna.id,
    });

    expect(atendimento).toMatchObject({
      podeAssumir: true,
      podeResponder: false,
      podeDevolver: false,
      podeEncerrar: true,
    });
  });
});

describe("assumir, devolver e encerrar", () => {
  it("assume o atendimento e pausa o agent", async () => {
    const conversa = await assumirAtendimento(
      { conversas },
      { analista: rafael, conversaId: daAna.id },
    );

    expect(conversa).toMatchObject({
      estado: "com_analista",
      analistaId: rafael.id,
    });

    const mensagens = await conversas.listarMensagens(daAna.id);
    expect(mensagens.at(-1)).toMatchObject({
      autor: "sistema",
      conteudo:
        "Rafael Lima assumiu o atendimento · o Nexo Assist está pausado",
    });
  });

  it("devolve ao agent e registra quem devolveu", async () => {
    await assumirAtendimento(
      { conversas },
      { analista: rafael, conversaId: daAna.id },
    );

    const conversa = await devolverAoAgent(
      { conversas },
      { analista: rafael, conversaId: daAna.id },
    );

    expect(conversa).toMatchObject({ estado: "com_agent", analistaId: null });
    const mensagens = await conversas.listarMensagens(daAna.id);
    expect(mensagens.at(-1)?.conteudo).toBe(
      "Rafael Lima devolveu a conversa ao Nexo Assist",
    );
  });

  it("encerra o atendimento", async () => {
    const conversa = await encerrarAtendimento(
      { conversas },
      { analista: rafael, conversaId: daAna.id },
    );

    expect(conversa.estado).toBe("encerrada");
    await expect(
      encerrarAtendimento(
        { conversas },
        { analista: rafael, conversaId: daAna.id },
      ),
    ).rejects.toBeInstanceOf(ConversaIndisponivelError);
  });

  it("não deixa assumir uma conversa já em atendimento", async () => {
    await assumirAtendimento(
      { conversas },
      { analista: rafael, conversaId: daAna.id },
    );

    await expect(
      assumirAtendimento(
        { conversas },
        { analista: rafael, conversaId: daAna.id },
      ),
    ).rejects.toBeInstanceOf(ConversaIndisponivelError);
  });

  it("não deixa devolver o que ninguém assumiu", async () => {
    await expect(
      devolverAoAgent(
        { conversas },
        { analista: rafael, conversaId: daAna.id },
      ),
    ).rejects.toBeInstanceOf(ConversaIndisponivelError);
  });
});

describe("responderComoAnalista", () => {
  it("grava a resposta do analista depois de assumir", async () => {
    await assumirAtendimento(
      { conversas },
      { analista: rafael, conversaId: daAna.id },
    );

    const mensagem = await responderComoAnalista(
      { conversas },
      {
        analista: rafael,
        conversaId: daAna.id,
        texto: "  Oi Ana, já estou olhando o seu notebook.  ",
      },
    );

    expect(mensagem).toMatchObject({
      autor: "analista",
      conteudo: "Oi Ana, já estou olhando o seu notebook.",
    });
  });

  it("recusa responder sem ter assumido", async () => {
    await expect(
      responderComoAnalista(
        { conversas },
        { analista: rafael, conversaId: daAna.id, texto: "Oi" },
      ),
    ).rejects.toBeInstanceOf(ConversaIndisponivelError);
  });

  it("recusa mensagem vazia", async () => {
    await assumirAtendimento(
      { conversas },
      { analista: rafael, conversaId: daAna.id },
    );

    await expect(
      responderComoAnalista(
        { conversas },
        { analista: rafael, conversaId: daAna.id, texto: "   " },
      ),
    ).rejects.toBeInstanceOf(ConversaIndisponivelError);
  });
});
