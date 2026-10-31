import { beforeEach, describe, expect, it } from "vitest";
import { criarAssistenteNexo } from "@/agent/assistente";
import type { ServicoDeChamadosRemoto } from "@/agent/servico-remoto";
import type { ChamadaDeFerramenta } from "@/application/ports/assistente";
import type { Mensagem } from "@/domain/types";
import { USUARIOS_DE_EXEMPLO } from "@/infrastructure/db/dados-exemplo";
import { criarModeloRoteirizado, respostaEmJson } from "./modelo-roteirizado";
import { criarServicoEmMemoria } from "./servico-em-memoria";

const AGORA = new Date("2026-03-09T10:00:00-03:00");
const ana = USUARIOS_DE_EXEMPLO.find((usuario) => usuario.id === "usr-ana")!;

const mensagemDaAna = (conteudo: string): Mensagem => ({
  id: "m1",
  conversaId: "c1",
  autor: "funcionario",
  conteudo,
  criadaEm: AGORA,
  decisao: null,
});

const RESPOSTA_FINAL = {
  resposta:
    "Preparei o rascunho do chamado com prioridade alta, por causa da reunião de hoje. Confere e confirma?",
  entendimento: "A VPN não conecta no notebook e ela tem reunião hoje.",
  intencao: "abrir_chamado",
  confianca: 0.92,
  justificativa:
    "Não há chamado aberto sobre VPN e o artigo do erro 809 vale só para Windows 10.",
  opcoesRapidas: [],
};

let servico: ServicoDeChamadosRemoto;

beforeEach(async () => {
  ({ servico } = await criarServicoEmMemoria(AGORA));
});

describe("assistente com o loop do Mastra", () => {
  it("usa as ferramentas, registra cada passo e devolve a decisão estruturada", async () => {
    const { modelo } = criarModeloRoteirizado([
      { tipo: "ferramenta", nome: "consultar_chamados", entrada: {} },
      {
        tipo: "ferramenta",
        nome: "propor_chamado",
        entrada: {
          tipo: "incidente",
          titulo: "VPN não conecta no notebook — erro 809",
          descricao: "Desde ontem o notebook com Windows 11 mostra erro 809.",
          categoria: "Rede e VPN",
          afetados: "pessoa",
          evidenciaDosAfetados: "só eu",
          urgencia: "compromisso_no_dia",
          evidenciaDaUrgencia: "tenho reunião hoje às 14h",
        },
      },
      { tipo: "texto", partes: respostaEmJson(RESPOSTA_FINAL) },
    ]);

    const ferramentasUsadas: ChamadaDeFerramenta[] = [];
    const respostasParciais: string[] = [];

    const saida = await criarAssistenteNexo({ modelo, servico }).responder(
      {
        funcionario: ana,
        historico: [
          mensagemDaAna(
            "Meu notebook não conecta na VPN, erro 809. Só eu, e tenho reunião hoje às 14h.",
          ),
        ],
        agora: AGORA,
      },
      {
        aoUsarFerramenta: (chamada) => ferramentasUsadas.push(chamada),
        aoAtualizarResposta: (parcial) => respostasParciais.push(parcial),
      },
    );

    expect(saida).toMatchObject({
      resposta: RESPOSTA_FINAL.resposta,
      intencao: "abrir_chamado",
      confianca: 0.92,
    });

    expect(
      saida.chamadasDeFerramenta.map((chamada) => chamada.ferramenta),
    ).toEqual(["consultar_chamados", "propor_chamado"]);
    expect(saida.chamadasDeFerramenta[1]?.saida).toMatchObject({
      completo: true,
      rascunho: { prioridade: "alta" },
    });
    expect(ferramentasUsadas).toHaveLength(2);

    expect(respostasParciais.length).toBeGreaterThan(1);
    expect(respostasParciais.at(-1)).toBe(RESPOSTA_FINAL.resposta);
  });

  it("consulta só os chamados do funcionário da sessão, mesmo pelo loop", async () => {
    const { modelo } = criarModeloRoteirizado([
      { tipo: "ferramenta", nome: "consultar_chamados", entrada: {} },
      {
        tipo: "texto",
        partes: respostaEmJson({
          ...RESPOSTA_FINAL,
          intencao: "consultar_chamado",
        }),
      },
    ]);

    const saida = await criarAssistenteNexo({ modelo, servico }).responder({
      funcionario: ana,
      historico: [mensagemDaAna("Quais são meus chamados?")],
      agora: AGORA,
    });

    const consulta = saida.chamadasDeFerramenta[0]?.saida as {
      chamados: { codigo: string }[];
    };
    expect(consulta.chamados).toHaveLength(6);
    expect(consulta.chamados.map((chamado) => chamado.codigo)).not.toContain(
      "INC-20377",
    );
  });

  it("corrige campos fora do esperado em vez de derrubar a resposta", async () => {
    const { modelo } = criarModeloRoteirizado([
      {
        tipo: "texto",
        partes: respostaEmJson({
          resposta: "Oi! Como posso ajudar?",
          intencao: "cumprimentar",
          confianca: 1.7,
          opcoesRapidas: [
            " Status de chamado ",
            "Abrir chamado",
            "",
            "VPN",
            "E-mail",
            "Outro",
          ],
        }),
      },
    ]);

    const saida = await criarAssistenteNexo({ modelo, servico }).responder({
      funcionario: ana,
      historico: [mensagemDaAna("oi")],
      agora: AGORA,
    });

    expect(saida).toMatchObject({
      intencao: "conversa",
      confianca: 1,
      entendimento: "",
      opcoesRapidas: ["Status de chamado", "Abrir chamado", "VPN", "E-mail"],
    });
  });

  it("envia ao modelo as instruções com o funcionário e as regras do Anexo A", async () => {
    const { modelo, prompts } = criarModeloRoteirizado([
      { tipo: "texto", partes: respostaEmJson(RESPOSTA_FINAL) },
    ]);

    await criarAssistenteNexo({ modelo, servico }).responder({
      funcionario: ana,
      historico: [mensagemDaAna("oi")],
      agora: AGORA,
    });

    const prompt = JSON.stringify(prompts[0]);
    expect(prompt).toContain("Ana Souza");
    expect(prompt).toContain("Rede e VPN");
    expect(prompt).toContain("4 horas úteis");
    expect(prompt).toContain("propor_chamado");
  });

  it("aproveita a resposta quando o modelo esquece o JSON, sem decisão registrada", async () => {
    const { modelo } = criarModeloRoteirizado([
      { tipo: "texto", partes: ["Você consegue trabalhar de outro jeito?"] },
    ]);

    const saida = await criarAssistenteNexo({ modelo, servico }).responder({
      funcionario: ana,
      historico: [mensagemDaAna("a impressora do meu andar parou")],
      agora: AGORA,
    });

    expect(saida).toMatchObject({
      resposta: "Você consegue trabalhar de outro jeito?",
      entendimento: "",
      intencao: "conversa",
      confianca: 0,
      justificativa: "",
    });
  });
});
