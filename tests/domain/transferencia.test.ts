import { describe, expect, it } from "vitest";
import {
  avaliarTransferencia,
  type SituacaoDaConversa,
} from "@/domain/transferencia";

const situacaoTranquila: SituacaoDaConversa = {
  funcionarioPediu: false,
  prioridadeDoCaso: "media",
  temChamadoVencido: false,
  confianca: 0.9,
  mensagensNaSessao: 4,
};

const avaliar = (sobrescritas: Partial<SituacaoDaConversa>) =>
  avaliarTransferencia({ ...situacaoTranquila, ...sobrescritas });

describe("avaliarTransferencia", () => {
  it("não transfere quando o agent está seguro e nada exige uma pessoa", () => {
    expect(avaliar({})).toEqual({ deveTransferir: false, motivo: null });
  });

  it("transfere quando o funcionário pede", () => {
    expect(avaliar({ funcionarioPediu: true })).toEqual({
      deveTransferir: true,
      motivo: "pedido_do_funcionario",
    });
  });

  it("transfere em caso crítico", () => {
    expect(avaliar({ prioridadeDoCaso: "critica" })).toEqual({
      deveTransferir: true,
      motivo: "caso_critico",
    });
  });

  it("transfere quando há chamado vencido", () => {
    expect(avaliar({ temChamadoVencido: true })).toEqual({
      deveTransferir: true,
      motivo: "chamado_vencido",
    });
  });

  it("transfere ao atingir o limite de mensagens da sessão", () => {
    expect(avaliar({ mensagensNaSessao: 30 })).toEqual({
      deveTransferir: true,
      motivo: "limite_de_mensagens",
    });
  });

  it("transfere quando o agent não tem segurança sobre o que fazer", () => {
    expect(avaliar({ confianca: 0.41 })).toEqual({
      deveTransferir: true,
      motivo: "baixa_confianca",
    });
  });

  it("não transfere por confiança exatamente no limiar", () => {
    expect(avaliar({ confianca: 0.7 })).toEqual({
      deveTransferir: false,
      motivo: null,
    });
  });

  it("prioriza o pedido do funcionário sobre os outros motivos", () => {
    expect(
      avaliar({
        funcionarioPediu: true,
        prioridadeDoCaso: "critica",
        temChamadoVencido: true,
        confianca: 0.2,
      }),
    ).toEqual({ deveTransferir: true, motivo: "pedido_do_funcionario" });
  });
});
