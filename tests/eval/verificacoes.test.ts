import { describe, expect, it } from "vitest";
import type { DecisaoDoAgent, RascunhoCompleto } from "@/domain/types";
import {
  chamaAnalista,
  diz,
  naoDiz,
  propoeAtualizar,
  propoeCriar,
  propoeReabrir,
  reprovadas,
  VERIFICACOES_DE_TODA_RODADA,
  type Rodada,
  type Verificacao,
} from "./verificacoes";

const DECISAO: DecisaoDoAgent = {
  entendimento: "A pessoa quer trocar a senha da rede.",
  intencao: "tirar_duvida",
  acoes: [],
  confianca: 0.95,
  justificativa: "O artigo da central de ajuda resolve o caso.",
  opcoesRapidas: [],
  proposta: null,
  transferencia: { recomendada: false, motivo: null },
  chamadosListados: [],
  chamadoConsultado: null,
  artigosConsultados: [],
};

const RASCUNHO: RascunhoCompleto = {
  tipo: "incidente",
  titulo: "Impressora do 4º andar sem conexão",
  descricao: "A impressora sumiu da lista desde hoje de manhã.",
  categoria: "Hardware",
  prioridade: "media",
  afetados: "pessoa",
};

const rodada = (
  resposta: string,
  decisao: Partial<DecisaoDoAgent> = {},
): Rodada => ({
  pergunta: "a impressora do meu andar parou",
  resposta,
  decisao: { ...DECISAO, ...decisao },
});

const aprova = (verificacao: Verificacao, umaRodada: Rodada) =>
  verificacao.aprovada(umaRodada);

describe("verificações de toda rodada", () => {
  it("aceita uma pergunta por mensagem e recusa duas", () => {
    expect(
      reprovadas(VERIFICACOES_DE_TODA_RODADA, rodada("Só você foi afetado?")),
    ).toEqual([]);

    expect(
      reprovadas(
        VERIFICACOES_DE_TODA_RODADA,
        rodada("Só você foi afetado? Tem compromisso hoje?"),
      ),
    ).toContain("pergunta uma coisa por vez");
  });

  it("recusa a resposta que afirma ter aberto ou alterado o chamado", () => {
    expect(
      reprovadas(
        VERIFICACOES_DE_TODA_RODADA,
        rodada("Pronto, abri o chamado."),
      ),
    ).toContain("não diz que já abriu ou alterou um chamado");

    expect(
      reprovadas(
        VERIFICACOES_DE_TODA_RODADA,
        rodada("Preparei o rascunho para abrir um chamado. Confere?"),
      ),
    ).toEqual([]);
  });

  it("recusa markdown e exige a explicação da decisão", () => {
    expect(
      reprovadas(
        VERIFICACOES_DE_TODA_RODADA,
        rodada("Faça assim:\n- reinicie"),
      ),
    ).toContain("responde em texto corrido, sem markdown");

    expect(
      reprovadas(
        VERIFICACOES_DE_TODA_RODADA,
        rodada("Tudo certo.", {
          justificativa: "   ",
        }),
      ),
    ).toContain("explica o que entendeu e por que decidiu assim");
  });
});

describe("verificações de caso", () => {
  it("compara só os campos esperados do rascunho", () => {
    const comRascunho = rodada("Confere o rascunho?", {
      proposta: {
        tipo: "criar",
        rascunho: RASCUNHO,
        prazoDeResposta: "2026-03-12T13:00:00.000Z",
        situacao: "pendente",
      },
    });

    expect(
      aprova(
        propoeCriar({ tipo: "incidente", prioridade: "media" }),
        comRascunho,
      ),
    ).toBe(true);
    expect(aprova(propoeCriar({ prioridade: "critica" }), comRascunho)).toBe(
      false,
    );
  });

  it("separa atualização de reabertura", () => {
    const reabertura = rodada("Confere a reabertura?", {
      proposta: {
        tipo: "atualizar",
        codigo: "INC-20150",
        texto: "A senha bloqueou de novo.",
        reabrir: true,
        situacao: "pendente",
      },
    });

    expect(aprova(propoeReabrir("INC-20150"), reabertura)).toBe(true);
    expect(aprova(propoeAtualizar("INC-20150"), reabertura)).toBe(false);
  });

  it("compara o texto da resposta sem acento e sem caixa", () => {
    const resposta = rodada(
      "Não encontrei o INC-20455 entre os seus chamados.",
    );

    expect(aprova(diz("inc-20455"), resposta)).toBe(true);
    expect(aprova(naoDiz("notas fiscais", "Carla"), resposta)).toBe(true);
    expect(aprova(naoDiz("encontrei"), resposta)).toBe(false);
  });

  it("exige o motivo certo da transferência", () => {
    const critico = rodada("Vou chamar um analista.", {
      transferencia: { recomendada: true, motivo: "caso_critico" },
    });

    expect(aprova(chamaAnalista("caso_critico"), critico)).toBe(true);
    expect(aprova(chamaAnalista("chamado_vencido"), critico)).toBe(false);
  });
});
