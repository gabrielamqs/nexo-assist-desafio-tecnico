import { describe, expect, it } from "vitest";
import { ehOutroDia, formatarDiaDaConversa } from "@/lib/formatacao";

const AGORA = new Date("2026-03-09T10:00:00-03:00");

describe("ehOutroDia", () => {
  it("compara pelo dia em Brasília, não pelo relógio de 24 horas", () => {
    const manha = new Date("2026-03-09T08:00:00-03:00");
    const noite = new Date("2026-03-09T23:30:00-03:00");
    expect(ehOutroDia(manha, noite)).toBe(false);

    const madrugadaSeguinte = new Date("2026-03-10T00:30:00-03:00");
    expect(ehOutroDia(noite, madrugadaSeguinte)).toBe(true);
  });
});

describe("formatarDiaDaConversa", () => {
  it("chama o dia de hoje de hoje", () => {
    expect(
      formatarDiaDaConversa(new Date("2026-03-09T18:00:00-03:00"), AGORA),
    ).toBe("Hoje");
  });

  it("chama o dia anterior de ontem", () => {
    expect(
      formatarDiaDaConversa(new Date("2026-03-08T23:00:00-03:00"), AGORA),
    ).toBe("Ontem");
  });

  it("escreve a data por extenso nos dias mais antigos", () => {
    expect(
      formatarDiaDaConversa(new Date("2026-03-02T09:00:00-03:00"), AGORA),
    ).toBe("2 de março");
  });
});
