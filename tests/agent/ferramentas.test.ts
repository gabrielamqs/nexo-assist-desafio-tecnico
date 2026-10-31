import { beforeEach, describe, expect, it } from "vitest";
import {
  criarFerramentasDoAssistente,
  decidirAtualizacao,
  foiDitoPeloFuncionario,
  montarPropostaDeChamado,
} from "@/agent/ferramentas";
import type { ServicoDeChamadosRemoto } from "@/agent/servico-remoto";
import type { ChamadaDeFerramenta } from "@/application/ports/assistente";
import { criarServicoEmMemoria } from "./servico-em-memoria";

const AGORA = new Date("2026-03-09T14:00:00-03:00");

const FALAS_DA_ANA = [
  "Meu notebook não conecta na VPN desde ontem, aparece o erro 809.",
  "Só eu. Tenho reunião com um cliente às 14h e preciso da VPN.",
];

const RASCUNHO_DA_VPN = {
  tipo: "incidente",
  titulo: "VPN não conecta — erro 809",
  descricao: "Notebook com Windows 11 mostra erro 809 desde ontem.",
  categoria: "Rede e VPN",
} as const;

describe("montarPropostaDeChamado", () => {
  it("calcula a prioridade pela tabela do Anexo A, não pelo modelo", () => {
    const resultado = montarPropostaDeChamado(
      {
        ...RASCUNHO_DA_VPN,
        afetados: "pessoa",
        evidenciaDosAfetados: "Só eu",
        urgencia: "compromisso_no_dia",
        evidenciaDaUrgencia: "Tenho reunião com um cliente às 14h",
      },
      AGORA,
      FALAS_DA_ANA,
    );

    expect(resultado).toEqual({
      completo: true,
      rascunho: expect.objectContaining({ prioridade: "alta" }),
      prazoDeResposta: "2026-03-09T21:00:00.000Z",
    });
  });

  it("lista o que falta perguntar quando o rascunho está incompleto", () => {
    const resultado = montarPropostaDeChamado(
      { tipo: "incidente", titulo: "VPN não conecta" },
      AGORA,
      FALAS_DA_ANA,
    );

    expect(resultado).toMatchObject({
      completo: false,
      camposFaltando: ["descricao", "categoria", "afetados", "urgencia"],
    });
  });

  it("descarta quem é afetado e a urgência que a pessoa não disse", () => {
    const resultado = montarPropostaDeChamado(
      {
        tipo: "incidente",
        titulo: "Impressora parou",
        descricao: "A impressora do andar parou de imprimir.",
        categoria: "Hardware",
        afetados: "equipe",
        evidenciaDosAfetados: "afeta toda a equipe",
        urgencia: "trabalho_parado",
        evidenciaDaUrgencia: "ninguém consegue trabalhar",
      },
      AGORA,
      ["A impressora do meu andar parou de imprimir desde hoje cedo"],
    );

    expect(resultado).toEqual({
      completo: false,
      camposFaltando: ["afetados", "urgencia"],
      orientacao: expect.stringContaining("Pergunte à pessoa"),
    });
  });

  it("descarta quando o modelo nem informa de onde tirou", () => {
    const resultado = montarPropostaDeChamado(
      {
        ...RASCUNHO_DA_VPN,
        afetados: "pessoa",
        urgencia: "compromisso_no_dia",
      },
      AGORA,
      FALAS_DA_ANA,
    );

    expect(resultado).toMatchObject({
      completo: false,
      camposFaltando: ["afetados", "urgencia"],
    });
  });

  it("aceita a resposta rápida como evidência", () => {
    const resultado = montarPropostaDeChamado(
      {
        ...RASCUNHO_DA_VPN,
        afetados: "equipe",
        evidenciaDosAfetados: "Minha equipe",
        urgencia: "ha_alternativa",
        evidenciaDaUrgencia: "dá para usar a do outro andar",
      },
      AGORA,
      ["Minha equipe", "Dá para usar a do outro andar por enquanto"],
    );

    expect(resultado).toMatchObject({
      completo: true,
      rascunho: { prioridade: "media", afetados: "equipe" },
    });
  });
});

describe("foiDitoPeloFuncionario", () => {
  it("ignora acentos, caixa e pontuação", () => {
    expect(foiDitoPeloFuncionario("so eu", ["Só eu!"])).toBe(true);
  });

  it("recusa trecho vazio ou ausente", () => {
    expect(foiDitoPeloFuncionario("  ", ["Só eu"])).toBe(false);
    expect(foiDitoPeloFuncionario(undefined, ["Só eu"])).toBe(false);
  });

  it("recusa a palavra solta tirada do meio da frase", () => {
    expect(
      foiDitoPeloFuncionario("meu", ["A senha do meu SAP bloqueou de novo."]),
    ).toBe(false);
  });

  it("aceita a palavra solta quando é a resposta inteira da pessoa", () => {
    expect(foiDitoPeloFuncionario("sim", ["A impressora parou", "Sim!"])).toBe(
      true,
    );
  });
});

describe("decidirAtualizacao", () => {
  it("atualiza chamado em aberto", () => {
    expect(
      decidirAtualizacao(
        {
          codigo: "INC-20311",
          status: "aguardando_analista",
          podeSerReaberto: false,
        },
        "Piorou hoje.",
      ),
    ).toEqual({
      permitido: true,
      codigo: "INC-20311",
      texto: "Piorou hoje.",
      reabrir: false,
    });
  });

  it("reabre chamado resolvido dentro da janela", () => {
    expect(
      decidirAtualizacao(
        { codigo: "INC-20150", status: "resolvido", podeSerReaberto: true },
        "Bloqueou de novo.",
      ),
    ).toMatchObject({ permitido: true, reabrir: true });
  });

  it("recusa reabrir chamado resolvido há muito tempo", () => {
    expect(
      decidirAtualizacao(
        { codigo: "INC-19877", status: "resolvido", podeSerReaberto: false },
        "Voltou.",
      ),
    ).toMatchObject({ permitido: false });
  });
});

describe("ferramentas do assistente", () => {
  let servico: ServicoDeChamadosRemoto;
  let chamadas: ChamadaDeFerramenta[];

  const ferramentasDa = (funcionarioId: string, servicoUsado = servico) =>
    criarFerramentasDoAssistente({
      funcionarioId,
      falasDoFuncionario: [],
      servico: servicoUsado,
      agora: AGORA,
      registrar: (chamada) => chamadas.push(chamada),
    });

  beforeEach(async () => {
    ({ servico } = await criarServicoEmMemoria(AGORA));
    chamadas = [];
  });

  it("ignora um funcionarioId que o modelo tente injetar", async () => {
    const { consultar_chamados } = ferramentasDa("usr-ana");
    const entradaMaliciosa = JSON.parse('{"funcionarioId":"usr-bruno"}');

    const resultado = (await consultar_chamados.execute!(
      entradaMaliciosa,
      {},
    )) as { chamados: { codigo: string }[] };

    expect(resultado.chamados).toHaveLength(6);
    expect(resultado.chamados.map((chamado) => chamado.codigo)).not.toContain(
      "INC-20377",
    );
  });

  it("consulta sempre os chamados do funcionário da sessão", async () => {
    const { consultar_chamados } = ferramentasDa("usr-bruno");

    const resultado = (await consultar_chamados.execute!({}, {})) as {
      chamados: { codigo: string }[];
    };

    expect(resultado.chamados.map((chamado) => chamado.codigo)).toEqual([
      "INC-20377",
    ]);
  });

  it("devolve erro ao modelo, sem quebrar, quando o chamado é de outra pessoa", async () => {
    const { consultar_chamado } = ferramentasDa("usr-ana");

    const resultado = await consultar_chamado.execute!(
      { codigo: "INC-20377" },
      {},
    );

    expect(resultado).toEqual({
      erro: expect.stringMatching(/Nenhum chamado INC-20377/),
    });
    expect(chamadas).toEqual([
      expect.objectContaining({
        ferramenta: "consultar_chamado",
        sucesso: false,
      }),
    ]);
  });

  it("registra cada chamada para a transparência", async () => {
    const { buscar_central_ajuda } = ferramentasDa("usr-ana");

    await buscar_central_ajuda.execute!({ termo: "vpn erro 809" }, {});

    expect(chamadas).toEqual([
      expect.objectContaining({
        ferramenta: "buscar_central_ajuda",
        entrada: { termo: "vpn erro 809" },
        sucesso: true,
      }),
    ]);
  });

  it("prepara a reabertura consultando o chamado no serviço", async () => {
    const { propor_atualizacao } = ferramentasDa("usr-ana");

    const resultado = await propor_atualizacao.execute!(
      { codigo: "INC-20150", texto: "A senha bloqueou de novo." },
      {},
    );

    expect(resultado).toEqual({
      permitido: true,
      codigo: "INC-20150",
      texto: "A senha bloqueou de novo.",
      reabrir: true,
    });
  });

  it("transforma indisponibilidade do serviço em erro legível", async () => {
    const instavel: ServicoDeChamadosRemoto = async () => {
      throw new Error(
        JSON.stringify({
          message: "O sistema de chamados está indisponível no momento.",
        }),
      );
    };
    const { consultar_chamados } = ferramentasDa("usr-ana", instavel);

    await expect(consultar_chamados.execute!({}, {})).resolves.toEqual({
      erro: "O sistema de chamados está indisponível no momento.",
    });
  });
});
