import { describe, expect, it } from "vitest";
import type { DecisaoDoAgent, Mensagem } from "@/domain/types";
import {
  lerEventosDoChat,
  paraMensagemNaTela,
  type EventoDoChat,
} from "@/lib/mensagem-na-tela";

const fluxoDe = (pedacos: string[]) => {
  const codificador = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controle) {
      for (const pedaco of pedacos)
        controle.enqueue(codificador.encode(pedaco));
      controle.close();
    },
  });
};

const coletar = async (fluxo: ReadableStream<Uint8Array>) => {
  const eventos: EventoDoChat[] = [];
  for await (const evento of lerEventosDoChat(fluxo)) eventos.push(evento);
  return eventos;
};

describe("lerEventosDoChat", () => {
  it("lê um evento por linha", async () => {
    const eventos = await coletar(
      fluxoDe(['{"tipo":"parcial","texto":"Olá"}\n{"tipo":"limite"}\n']),
    );

    expect(eventos).toEqual([
      { tipo: "parcial", texto: "Olá" },
      { tipo: "limite" },
    ]);
  });

  it("junta linhas cortadas entre pacotes da rede", async () => {
    const eventos = await coletar(
      fluxoDe([
        '{"tipo":"parc',
        'ial","texto":"Ol',
        'á"}\n{"tipo":"lim',
        'ite"}',
      ]),
    );

    expect(eventos).toEqual([
      { tipo: "parcial", texto: "Olá" },
      { tipo: "limite" },
    ]);
  });

  it("preserva acentos divididos no meio do caractere", async () => {
    const bytes = new TextEncoder().encode(
      '{"tipo":"parcial","texto":"ção"}\n',
    );
    const corte = bytes.indexOf(0xc3) + 1;
    const fluxo = new ReadableStream<Uint8Array>({
      start(controle) {
        controle.enqueue(bytes.slice(0, corte));
        controle.enqueue(bytes.slice(corte));
        controle.close();
      },
    });

    await expect(coletar(fluxo)).resolves.toEqual([
      { tipo: "parcial", texto: "ção" },
    ]);
  });
});

describe("paraMensagemNaTela", () => {
  it("completa decisões gravadas antes dos dados consultados existirem", () => {
    const decisaoAntiga = {
      entendimento: "Oi",
      intencao: "conversa",
      acoes: [],
      confianca: 1,
      justificativa: "",
      opcoesRapidas: [],
      proposta: null,
      transferencia: { recomendada: false, motivo: null },
    } as unknown as DecisaoDoAgent;

    const mensagem: Mensagem = {
      id: "m1",
      conversaId: "c1",
      autor: "agent",
      conteudo: "Oi",
      criadaEm: new Date("2026-03-09T13:00:00.000Z"),
      decisao: decisaoAntiga,
    };

    expect(paraMensagemNaTela(mensagem)).toMatchObject({
      criadaEm: "2026-03-09T13:00:00.000Z",
      decisao: {
        chamadosListados: [],
        chamadoConsultado: null,
        artigosConsultados: [],
      },
    });
  });
});
