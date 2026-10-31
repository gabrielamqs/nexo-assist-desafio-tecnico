import { beforeEach, describe, expect, it } from "vitest";
import type { RepositorioDeConversas } from "@/application/ports/conversas";
import { novidadesDaConversa } from "@/application/usecases/carregar-conversa";
import type { Conversa } from "@/domain/types";
import { criarRepositorioDeConversas } from "@/infrastructure/conversas/repositorio-sqlite";
import { USUARIOS_DE_EXEMPLO } from "@/infrastructure/db/dados-exemplo";
import { criarBancoDeTeste } from "../infrastructure/banco-de-teste";

const AGORA = new Date("2026-03-09T10:00:00-03:00");
const porId = (id: string) =>
  USUARIOS_DE_EXEMPLO.find((usuario) => usuario.id === id)!;

const ana = porId("usr-ana");
const bruno = porId("usr-bruno");
const rafael = porId("usr-rafael");

let conversas: RepositorioDeConversas;
let daAna: Conversa;
let primeiraMensagemId: string;

beforeEach(async () => {
  const banco = await criarBancoDeTeste();
  conversas = criarRepositorioDeConversas({ banco, agora: () => AGORA });

  daAna = await conversas.criar(ana.id);
  const primeira = await conversas.adicionarMensagem({
    conversaId: daAna.id,
    autor: "funcionario",
    conteudo: "Meu notebook está lento.",
    decisao: null,
  });
  primeiraMensagemId = primeira.id;
});

describe("novidadesDaConversa", () => {
  it("traz só o que chegou depois da última mensagem conhecida", async () => {
    await conversas.adicionarMensagem({
      conversaId: daAna.id,
      autor: "analista",
      conteudo: "Oi, Ana! Já estou olhando.",
      decisao: null,
    });

    const novidades = await novidadesDaConversa({ conversas }, ana, {
      conversaId: daAna.id,
      desdeMensagemId: primeiraMensagemId,
    });

    expect(novidades?.mensagens.map((mensagem) => mensagem.conteudo)).toEqual([
      "Oi, Ana! Já estou olhando.",
    ]);
    expect(novidades?.mensagensEnviadas).toBe(1);
  });

  it("devolve a conversa inteira quando não há marco conhecido", async () => {
    const novidades = await novidadesDaConversa({ conversas }, ana, {
      conversaId: daAna.id,
      desdeMensagemId: null,
    });

    expect(novidades?.mensagens).toHaveLength(1);
    expect(novidades?.estado).toBe("com_agent");
  });

  it("acompanha a mudança de estado até o encerramento", async () => {
    await conversas.mudarEstado(daAna.id, {
      estado: "com_analista",
      analistaId: rafael.id,
    });
    const emAtendimento = await novidadesDaConversa({ conversas }, ana, {
      conversaId: daAna.id,
      desdeMensagemId: primeiraMensagemId,
    });
    expect(emAtendimento?.estado).toBe("com_analista");

    await conversas.mudarEstado(daAna.id, {
      estado: "encerrada",
      analistaId: rafael.id,
    });
    const encerrada = await novidadesDaConversa({ conversas }, ana, {
      conversaId: daAna.id,
      desdeMensagemId: primeiraMensagemId,
    });
    expect(encerrada?.estado).toBe("encerrada");
  });

  it("não entrega a conversa de outro funcionário", async () => {
    const novidades = await novidadesDaConversa({ conversas }, bruno, {
      conversaId: daAna.id,
      desdeMensagemId: null,
    });

    expect(novidades).toBeNull();
  });

  it("devolve nulo quando a conversa não existe", async () => {
    const novidades = await novidadesDaConversa({ conversas }, ana, {
      conversaId: "conversa-que-nao-existe",
      desdeMensagemId: null,
    });

    expect(novidades).toBeNull();
  });
});
