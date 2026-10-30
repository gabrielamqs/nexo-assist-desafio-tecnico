import { describe, expect, it } from "vitest";
import { podeSerReaberto } from "@/domain/chamados";
import { estaVencido } from "@/domain/prazos";
import { PREFIXO_POR_TIPO } from "@/domain/types";
import {
  ARTIGOS_DE_EXEMPLO,
  USUARIOS_DE_EXEMPLO,
  construirChamadosDeExemplo,
} from "@/infrastructure/db/dados-exemplo";

const AGORA = new Date("2026-03-09T14:00:00-03:00");
const chamados = construirChamadosDeExemplo(AGORA);

describe("central de ajuda", () => {
  it("tem de 5 a 10 artigos, como pede o Anexo B", () => {
    expect(ARTIGOS_DE_EXEMPLO.length).toBeGreaterThanOrEqual(5);
    expect(ARTIGOS_DE_EXEMPLO.length).toBeLessThanOrEqual(10);
  });

  it("não repete identificador de artigo", () => {
    const ids = new Set(ARTIGOS_DE_EXEMPLO.map((artigo) => artigo.id));
    expect(ids.size).toBe(ARTIGOS_DE_EXEMPLO.length);
  });
});

describe("usuários", () => {
  it("tem funcionários e pelo menos um analista", () => {
    const papeis = USUARIOS_DE_EXEMPLO.map((usuario) => usuario.papel);
    expect(papeis).toContain("funcionario");
    expect(papeis).toContain("analista");
  });

  it("usa e-mail corporativo da Nexo", () => {
    for (const usuario of USUARIOS_DE_EXEMPLO) {
      expect(usuario.email).toMatch(/@nexo\.com\.br$/);
    }
  });
});

describe("chamados de exemplo", () => {
  it("não repete código", () => {
    const codigos = new Set(chamados.map((chamado) => chamado.codigo));
    expect(codigos.size).toBe(chamados.length);
  });

  it("usa o prefixo do tipo em cada código", () => {
    for (const chamado of chamados) {
      expect(chamado.codigo.startsWith(PREFIXO_POR_TIPO[chamado.tipo])).toBe(
        true,
      );
    }
  });

  it("aponta para funcionários que existem", () => {
    const ids = new Set(USUARIOS_DE_EXEMPLO.map((usuario) => usuario.id));
    for (const chamado of chamados) {
      expect(ids.has(chamado.solicitanteId)).toBe(true);
    }
  });

  it("cobre as situações exigidas pelo Anexo B", () => {
    const emAberto = chamados.filter(
      (chamado) => chamado.status !== "resolvido",
    );
    const vencidos = emAberto.filter((chamado) => estaVencido(chamado, AGORA));
    const noPrazo = emAberto.filter((chamado) => !estaVencido(chamado, AGORA));
    const resolvidosRecentemente = chamados.filter((chamado) =>
      podeSerReaberto(chamado, AGORA),
    );
    const solicitantes = new Set(
      chamados.map((chamado) => chamado.solicitanteId),
    );

    expect(vencidos.length).toBeGreaterThan(0);
    expect(noPrazo.length).toBeGreaterThan(0);
    expect(resolvidosRecentemente.length).toBeGreaterThan(0);
    expect(solicitantes.size).toBeGreaterThan(1);
  });

  it("tem um chamado resolvido fora da janela de reabertura", () => {
    const antigos = chamados.filter(
      (chamado) =>
        chamado.status === "resolvido" && !podeSerReaberto(chamado, AGORA),
    );

    expect(antigos.length).toBeGreaterThan(0);
  });
});
