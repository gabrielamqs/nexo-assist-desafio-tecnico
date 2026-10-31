import { beforeEach, describe, expect, it } from "vitest";
import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import {
  PropostaIndisponivelError,
  cancelarProposta,
  confirmarProposta,
} from "@/application/usecases/confirmar-proposta";
import type { DecisaoDoAgent, PropostaDeChamado } from "@/domain/types";
import { criarRepositorioDeConversas } from "@/infrastructure/conversas/repositorio-sqlite";
import { USUARIOS_DE_EXEMPLO } from "@/infrastructure/db/dados-exemplo";
import { criarServicoEmMemoria } from "../agent/servico-em-memoria";

const AGORA = new Date("2026-03-09T10:00:00-03:00");
const ana = USUARIOS_DE_EXEMPLO.find((usuario) => usuario.id === "usr-ana")!;
const bruno = USUARIOS_DE_EXEMPLO.find(
  (usuario) => usuario.id === "usr-bruno",
)!;

const PROPOSTA_DE_CRIACAO: PropostaDeChamado = {
  tipo: "criar",
  rascunho: {
    tipo: "incidente",
    titulo: "VPN não conecta no notebook — erro 809",
    descricao: "Desde ontem o notebook com Windows 11 mostra erro 809.",
    categoria: "Rede e VPN",
    prioridade: "alta",
    afetados: "pessoa",
  },
  prazoDeResposta: "2026-03-09T17:00:00.000Z",
};

const decisaoCom = (proposta: PropostaDeChamado): DecisaoDoAgent => ({
  entendimento: "Quer abrir chamado.",
  intencao: "abrir_chamado",
  acoes: [],
  confianca: 0.9,
  justificativa: "Rascunho completo.",
  opcoesRapidas: [],
  proposta: { ...proposta, situacao: "pendente" },
  transferencia: { recomendada: false, motivo: null },
});

let conversas: RepositorioDeConversas;
let chamados: RepositorioDeChamados;

async function mensagemComProposta(proposta: PropostaDeChamado) {
  const conversa = await conversas.criar(ana.id);
  return conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "agent",
    conteudo: "Confere o rascunho?",
    decisao: decisaoCom(proposta),
  });
}

beforeEach(async () => {
  const servico = await criarServicoEmMemoria(AGORA);
  chamados = servico.repositorioDeChamados;
  conversas = criarRepositorioDeConversas({
    banco: servico.banco,
    agora: () => AGORA,
  });
});

describe("confirmarProposta", () => {
  it("só cria o chamado quando a pessoa confirma", async () => {
    const mensagem = await mensagemComProposta(PROPOSTA_DE_CRIACAO);
    const antes = await chamados.listarPorSolicitante(ana.id);

    const { chamado, mensagem: confirmacao } = await confirmarProposta(
      { conversas, chamados, agora: () => AGORA },
      { funcionario: ana, mensagemId: mensagem.id },
    );

    expect(chamado).toMatchObject({
      codigo: "INC-20456",
      prioridade: "alta",
      solicitanteId: ana.id,
    });
    await expect(chamados.listarPorSolicitante(ana.id)).resolves.toHaveLength(
      antes.length + 1,
    );
    expect(confirmacao.conteudo).toBe(
      "Pronto: abri o INC-20456 com prioridade alta. A primeira resposta chega hoje às 14:00.",
    );
    expect(confirmacao.decisao?.acoes).toEqual([
      { tipo: "criou_chamado", descricao: "criou o INC-20456", sucesso: true },
    ]);
  });

  it("marca a proposta como confirmada com o código criado", async () => {
    const mensagem = await mensagemComProposta(PROPOSTA_DE_CRIACAO);

    await confirmarProposta(
      { conversas, chamados, agora: () => AGORA },
      { funcionario: ana, mensagemId: mensagem.id },
    );

    const atualizada = await conversas.buscarMensagem(mensagem.id);
    expect(atualizada?.decisao?.proposta).toMatchObject({
      situacao: "confirmada",
      codigoDoChamado: "INC-20456",
    });
  });

  it("não deixa confirmar duas vezes", async () => {
    const mensagem = await mensagemComProposta(PROPOSTA_DE_CRIACAO);
    const dependencias = { conversas, chamados, agora: () => AGORA };

    await confirmarProposta(dependencias, {
      funcionario: ana,
      mensagemId: mensagem.id,
    });

    await expect(
      confirmarProposta(dependencias, {
        funcionario: ana,
        mensagemId: mensagem.id,
      }),
    ).rejects.toBeInstanceOf(PropostaIndisponivelError);
  });

  it("não deixa outra pessoa confirmar o rascunho", async () => {
    const mensagem = await mensagemComProposta(PROPOSTA_DE_CRIACAO);

    await expect(
      confirmarProposta(
        { conversas, chamados, agora: () => AGORA },
        { funcionario: bruno, mensagemId: mensagem.id },
      ),
    ).rejects.toBeInstanceOf(PropostaIndisponivelError);
  });

  it("reabre o chamado resolvido quando a proposta é de reabertura", async () => {
    const mensagem = await mensagemComProposta({
      tipo: "atualizar",
      codigo: "INC-20150",
      texto: "A senha bloqueou de novo.",
      reabrir: true,
    });

    const { chamado, mensagem: confirmacao } = await confirmarProposta(
      { conversas, chamados, agora: () => AGORA },
      { funcionario: ana, mensagemId: mensagem.id },
    );

    expect(chamado).toMatchObject({
      codigo: "INC-20150",
      status: "aberto",
      resolvidoEm: null,
    });
    expect(confirmacao.conteudo).toMatch(/^Pronto: reabri o INC-20150/);
  });

  it("recusa atualizar chamado de outra pessoa mesmo com proposta adulterada", async () => {
    const mensagem = await mensagemComProposta({
      tipo: "atualizar",
      codigo: "INC-20377",
      texto: "tentativa indevida",
      reabrir: false,
    });

    await expect(
      confirmarProposta(
        { conversas, chamados, agora: () => AGORA },
        { funcionario: ana, mensagemId: mensagem.id },
      ),
    ).rejects.toBeInstanceOf(PropostaIndisponivelError);

    await expect(
      chamados.listarAtualizacoes("INC-20377"),
    ).resolves.toHaveLength(0);
  });
});

describe("cancelarProposta", () => {
  it("descarta o rascunho sem criar nada", async () => {
    const mensagem = await mensagemComProposta(PROPOSTA_DE_CRIACAO);
    const antes = await chamados.listarPorSolicitante(ana.id);

    const resposta = await cancelarProposta(
      { conversas },
      { funcionario: ana, mensagemId: mensagem.id },
    );

    expect(resposta.conteudo).toMatch(/descartei o rascunho/);
    await expect(chamados.listarPorSolicitante(ana.id)).resolves.toHaveLength(
      antes.length,
    );
    const atualizada = await conversas.buscarMensagem(mensagem.id);
    expect(atualizada?.decisao?.proposta?.situacao).toBe("cancelada");
  });
});
