import { beforeEach, describe, expect, it } from "vitest";
import { AssistenteIndisponivelError } from "@/application/ports/assistente";
import type { RepositorioDeConversas } from "@/application/ports/conversas";
import { carregarConversa } from "@/application/usecases/carregar-conversa";
import {
  LimiteDeMensagensAtingidoError,
  MensagemVaziaError,
  responderMensagem,
} from "@/application/usecases/responder-mensagem";
import { LIMITE_DE_MENSAGENS_POR_SESSAO } from "@/domain/types";
import { USUARIOS_DE_EXEMPLO } from "@/infrastructure/db/dados-exemplo";
import { conversas as tabelaDeConversas } from "@/infrastructure/db/schema";
import type { BancoDeDados } from "@/infrastructure/db/client";
import { criarRepositorioDeConversas } from "@/infrastructure/conversas/repositorio-sqlite";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import { criarServicoEmMemoria } from "../agent/servico-em-memoria";
import { criarAssistenteFalso } from "./assistente-falso";

const AGORA = new Date("2026-03-09T10:00:00-03:00");
const ana = USUARIOS_DE_EXEMPLO.find((usuario) => usuario.id === "usr-ana")!;

const rascunhoCritico = {
  tipo: "incidente",
  titulo: "Sistema de notas fora do ar",
  descricao: "Ninguém do Comercial emite nota.",
  categoria: "Software",
  prioridade: "critica",
  afetados: "equipe",
} as const;

let banco: BancoDeDados;
let conversas: RepositorioDeConversas;
let chamados: RepositorioDeChamados;

beforeEach(async () => {
  const servico = await criarServicoEmMemoria(AGORA);
  banco = servico.banco;
  chamados = servico.repositorioDeChamados;
  conversas = criarRepositorioDeConversas({ banco, agora: () => AGORA });
});

describe("responderMensagem", () => {
  it("abre a conversa, guarda as duas mensagens e a decisão do agent", async () => {
    const { assistente } = criarAssistenteFalso({
      resposta: "Achei um artigo sobre isso.",
      intencao: "tirar_duvida",
      chamadasDeFerramenta: [
        {
          ferramenta: "buscar_central_ajuda",
          entrada: { termo: "vpn" },
          saida: { total: 1 },
          sucesso: true,
        },
      ],
    });

    const resultado = await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "  Como uso a VPN?  " },
    );

    expect(resultado.situacao).toBe("respondida");
    if (resultado.situacao !== "respondida") return;

    expect(resultado.mensagemDoFuncionario.conteudo).toBe("Como uso a VPN?");
    expect(resultado.resposta).toMatchObject({
      autor: "agent",
      conteudo: "Achei um artigo sobre isso.",
      decisao: {
        intencao: "tirar_duvida",
        acoes: [{ descricao: "buscou na central de ajuda", sucesso: true }],
        proposta: null,
        transferencia: { recomendada: false, motivo: null },
      },
    });

    await expect(
      conversas.contarMensagens(resultado.conversa.id),
    ).resolves.toBe(2);
  });

  it("continua a mesma conversa e passa o histórico ao assistente", async () => {
    const { assistente, recebidas } = criarAssistenteFalso();
    const dependencias = {
      conversas,
      chamados,
      assistente,
      agora: () => AGORA,
    };

    await responderMensagem(dependencias, { funcionario: ana, texto: "Oi" });
    await responderMensagem(dependencias, {
      funcionario: ana,
      texto: "Meu chamado?",
    });

    expect(
      recebidas[1]?.historico.map((mensagem) => mensagem.conteudo),
    ).toEqual(["Oi", "Resposta do assistente.", "Meu chamado?"]);
  });

  it("guarda o rascunho como proposta pendente, sem criar chamado", async () => {
    const { assistente } = criarAssistenteFalso({
      intencao: "abrir_chamado",
      chamadasDeFerramenta: [
        {
          ferramenta: "propor_chamado",
          entrada: {},
          saida: {
            completo: true,
            rascunho: {
              ...rascunhoCritico,
              prioridade: "alta",
              afetados: "pessoa",
            },
            prazoDeResposta: "2026-03-09T17:00:00.000Z",
          },
          sucesso: true,
        },
      ],
    });

    const resultado = await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "A VPN parou" },
    );

    expect(
      resultado.situacao === "respondida" &&
        resultado.resposta.decisao?.proposta,
    ).toMatchObject({ tipo: "criar", situacao: "pendente" });
  });

  it("recomenda transferir em caso crítico, como pede o Anexo A", async () => {
    const { assistente } = criarAssistenteFalso({
      chamadasDeFerramenta: [
        {
          ferramenta: "propor_chamado",
          entrada: {},
          saida: {
            completo: true,
            rascunho: rascunhoCritico,
            prazoDeResposta: "2026-03-09T14:00:00.000Z",
          },
          sucesso: true,
        },
      ],
    });

    const resultado = await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "O sistema de notas caiu para todo mundo" },
    );

    expect(
      resultado.situacao === "respondida" &&
        resultado.resposta.decisao?.transferencia,
    ).toEqual({ recomendada: true, motivo: "caso_critico" });
  });

  it("recomenda transferir quando o agent não tem segurança", async () => {
    const { assistente } = criarAssistenteFalso({ confianca: 0.41 });

    const resultado = await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "Aquela coisa do sistema, sabe?" },
    );

    expect(
      resultado.situacao === "respondida" &&
        resultado.resposta.decisao?.transferencia,
    ).toEqual({ recomendada: true, motivo: "baixa_confianca" });
  });

  it("não chama o agent enquanto a conversa está com um analista", async () => {
    const { assistente, recebidas } = criarAssistenteFalso();
    const conversa = await conversas.criar(ana.id);
    await banco.update(tabelaDeConversas).set({ estado: "com_analista" });

    const resultado = await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "Alguém aí?" },
    );

    expect(resultado.situacao).toBe("com_analista");
    expect(recebidas).toHaveLength(0);
    await expect(conversas.contarMensagens(conversa.id)).resolves.toBe(1);
  });

  it("guarda a mensagem do funcionário mesmo quando o assistente falha", async () => {
    const { assistente } = criarAssistenteFalso(new Error("cota estourada"));

    await expect(
      responderMensagem(
        { conversas, chamados, assistente, agora: () => AGORA },
        { funcionario: ana, texto: "Oi" },
      ),
    ).rejects.toBeInstanceOf(AssistenteIndisponivelError);

    const ativa = await conversas.buscarAtiva(ana.id);
    await expect(conversas.contarMensagens(ativa!.id)).resolves.toBe(1);
  });

  it("recusa mensagem vazia", async () => {
    const { assistente } = criarAssistenteFalso();

    await expect(
      responderMensagem(
        { conversas, chamados, assistente, agora: () => AGORA },
        { funcionario: ana, texto: "   " },
      ),
    ).rejects.toBeInstanceOf(MensagemVaziaError);
  });

  it("bloqueia no servidor a mensagem acima do limite, sem chamar o modelo", async () => {
    const { assistente, recebidas } = criarAssistenteFalso();
    const dependencias = {
      conversas,
      chamados,
      assistente,
      agora: () => AGORA,
    };

    for (
      let enviada = 0;
      enviada < LIMITE_DE_MENSAGENS_POR_SESSAO;
      enviada += 1
    ) {
      await responderMensagem(dependencias, { funcionario: ana, texto: "Oi" });
    }

    await expect(
      responderMensagem(dependencias, { funcionario: ana, texto: "Mais uma" }),
    ).rejects.toBeInstanceOf(LimiteDeMensagensAtingidoError);
    expect(recebidas).toHaveLength(LIMITE_DE_MENSAGENS_POR_SESSAO);
  });

  it("recomenda transferir na última mensagem permitida", async () => {
    const { assistente } = criarAssistenteFalso();
    const dependencias = {
      conversas,
      chamados,
      assistente,
      agora: () => AGORA,
    };

    const respostas = [];
    for (
      let enviada = 0;
      enviada < LIMITE_DE_MENSAGENS_POR_SESSAO;
      enviada += 1
    ) {
      respostas.push(
        await responderMensagem(dependencias, {
          funcionario: ana,
          texto: "Oi",
        }),
      );
    }

    const ultima = respostas.at(-1);
    expect(
      ultima?.situacao === "respondida" &&
        ultima.resposta.decisao?.transferencia,
    ).toEqual({ recomendada: true, motivo: "limite_de_mensagens" });
    expect(ultima?.conversa.estado).toBe("aguardando_analista");
  });

  it("transfere na hora quando o funcionário pede um analista", async () => {
    const { assistente } = criarAssistenteFalso({
      intencao: "falar_com_analista",
      chamadasDeFerramenta: [
        {
          ferramenta: "chamar_analista",
          entrada: {},
          saida: {
            resumo: "A pessoa pediu para falar com alguém sobre a VPN.",
          },
          sucesso: true,
        },
      ],
    });

    const resultado = await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "Quero falar com um analista" },
    );

    expect(
      resultado.situacao === "respondida" && resultado.transferencia,
    ).toMatchObject({ motivo: "pedido_do_funcionario" });
    expect(resultado.conversa.estado).toBe("aguardando_analista");
    await expect(
      conversas.buscarPorId(resultado.conversa.id),
    ).resolves.toMatchObject({
      resumoParaAnalista: "A pessoa pediu para falar com alguém sobre a VPN.",
    });
  });

  it("monta um resumo a partir da decisão quando o agent não escreve um", async () => {
    const { assistente } = criarAssistenteFalso({
      intencao: "falar_com_analista",
      entendimento: "A pessoa quer falar com uma pessoa sobre a impressora.",
    });

    const resultado = await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "Me passa para um humano" },
    );

    await expect(
      conversas.buscarPorId(resultado.conversa.id),
    ).resolves.toMatchObject({
      resumoParaAnalista:
        "A pessoa quer falar com uma pessoa sobre a impressora. Transferido porque a pessoa pediu um analista.",
    });
  });

  it("apenas oferece o analista quando o chamado está vencido", async () => {
    const { assistente } = criarAssistenteFalso({
      intencao: "consultar_chamado",
      chamadasDeFerramenta: [
        {
          ferramenta: "consultar_chamado",
          entrada: { codigo: "INC-20311" },
          saida: {
            codigo: "INC-20311",
            tipo: "incidente",
            titulo: "Notebook lento",
            descricao: "Lentidão desde a atualização.",
            categoria: "Hardware",
            prioridade: "media",
            status: "aguardando_analista",
            abertoEm: AGORA.toISOString(),
            atualizadoEm: AGORA.toISOString(),
            prazoDeResposta: AGORA.toISOString(),
            vencido: true,
          },
          sucesso: true,
        },
      ],
    });

    const resultado = await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "Como está meu chamado?" },
    );

    expect(
      resultado.situacao === "respondida" && resultado.transferencia,
    ).toBeNull();
    expect(resultado.conversa.estado).toBe("com_agent");
    expect(
      resultado.situacao === "respondida" &&
        resultado.resposta.decisao?.transferencia,
    ).toEqual({ recomendada: true, motivo: "chamado_vencido" });
  });

  it("não chama o agent depois de a conversa ir para um analista", async () => {
    const { assistente, recebidas } = criarAssistenteFalso({
      intencao: "falar_com_analista",
    });
    const dependencias = {
      conversas,
      chamados,
      assistente,
      agora: () => AGORA,
    };

    await responderMensagem(dependencias, {
      funcionario: ana,
      texto: "Quero um analista",
    });
    const depois = await responderMensagem(dependencias, {
      funcionario: ana,
      texto: "Alguém aí?",
    });

    expect(depois.situacao).toBe("com_analista");
    expect(recebidas).toHaveLength(1);
  });
});

describe("carregarConversa", () => {
  it("devolve vazio quando o funcionário ainda não conversou", async () => {
    await expect(carregarConversa({ conversas }, ana)).resolves.toEqual({
      conversa: null,
      mensagens: [],
      mensagensEnviadas: 0,
    });
  });

  it("devolve o histórico para continuar de onde parou", async () => {
    const { assistente } = criarAssistenteFalso();
    await responderMensagem(
      { conversas, chamados, assistente, agora: () => AGORA },
      { funcionario: ana, texto: "Oi" },
    );

    const carregada = await carregarConversa({ conversas }, ana);

    expect(carregada.mensagens.map((mensagem) => mensagem.autor)).toEqual([
      "funcionario",
      "agent",
    ]);
    expect(carregada.mensagensEnviadas).toBe(1);
  });
});
