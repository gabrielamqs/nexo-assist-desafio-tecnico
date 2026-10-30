import { describe, expect, it } from "vitest";
import { definirPrioridade } from "@/domain/prioridade";

describe("definirPrioridade", () => {
  it("é crítica quando algo está parado para a empresa", () => {
    expect(
      definirPrioridade({ impacto: "empresa", urgencia: "trabalho_parado" }),
    ).toBe("critica");
  });

  it("é crítica quando algo está parado para uma equipe", () => {
    expect(
      definirPrioridade({ impacto: "equipe", urgencia: "trabalho_parado" }),
    ).toBe("critica");
  });

  it("é alta quando impede uma pessoa de trabalhar", () => {
    expect(
      definirPrioridade({ impacto: "pessoa", urgencia: "trabalho_parado" }),
    ).toBe("alta");
  });

  it("é alta quando há compromisso no mesmo dia", () => {
    expect(
      definirPrioridade({ impacto: "pessoa", urgencia: "compromisso_no_dia" }),
    ).toBe("alta");
  });

  it("é média quando atrapalha mas há alternativa", () => {
    expect(
      definirPrioridade({ impacto: "pessoa", urgencia: "ha_alternativa" }),
    ).toBe("media");
  });

  it("é baixa para pedidos sem urgência", () => {
    expect(
      definirPrioridade({ impacto: "pessoa", urgencia: "sem_urgencia" }),
    ).toBe("baixa");
  });

  it("não escala para crítica quando o impacto é desconhecido", () => {
    expect(
      definirPrioridade({
        impacto: "desconhecido",
        urgencia: "trabalho_parado",
      }),
    ).toBe("alta");
  });
});
