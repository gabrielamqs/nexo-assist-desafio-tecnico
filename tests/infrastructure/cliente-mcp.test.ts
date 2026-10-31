import { describe, expect, it } from "vitest";
import { extrairConteudo } from "@/infrastructure/mcp/cliente";

describe("extrairConteudo", () => {
  it("prefere o conteúdo estruturado", () => {
    expect(
      extrairConteudo({
        content: [{ type: "text", text: "ignorado" }],
        structuredContent: { total: 2 },
      }),
    ).toEqual({ total: 2 });
  });

  it("interpreta o texto como JSON quando possível", () => {
    expect(
      extrairConteudo({ content: [{ type: "text", text: '{"total":3}' }] }),
    ).toEqual({ total: 3 });
  });

  it("devolve o texto puro quando não é JSON", () => {
    expect(
      extrairConteudo({ content: [{ type: "text", text: "tudo certo" }] }),
    ).toBe("tudo certo");
  });

  it("transforma resultado de erro em exceção", () => {
    expect(() =>
      extrairConteudo({
        isError: true,
        content: [
          { type: "text", text: "Nenhum chamado INC-1 foi encontrado." },
        ],
      }),
    ).toThrow("Nenhum chamado INC-1 foi encontrado.");
  });
});
