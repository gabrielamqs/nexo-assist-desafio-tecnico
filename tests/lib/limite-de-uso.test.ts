import { beforeEach, describe, expect, it } from "vitest";
import {
  JANELA_DO_LIMITE_EM_MS,
  MAXIMO_DE_MENSAGENS_POR_JANELA,
  esquecerUsos,
  registrarUso,
} from "@/lib/limite-de-uso";

const gastarAJanela = (chave: string, agora: number) => {
  for (let uso = 0; uso < MAXIMO_DE_MENSAGENS_POR_JANELA; uso += 1) {
    expect(registrarUso(chave, agora)).toBe(true);
  }
};

describe("registrarUso", () => {
  beforeEach(esquecerUsos);

  it("deixa passar até o máximo da janela", () => {
    gastarAJanela("usr-ana", 1_000);
  });

  it("barra o uso seguinte dentro da mesma janela", () => {
    gastarAJanela("usr-ana", 1_000);
    expect(registrarUso("usr-ana", 1_500)).toBe(false);
  });

  it("libera de novo quando a janela vence", () => {
    gastarAJanela("usr-ana", 1_000);
    expect(registrarUso("usr-ana", 1_000 + JANELA_DO_LIMITE_EM_MS)).toBe(true);
  });

  it("conta cada pessoa separadamente", () => {
    gastarAJanela("usr-ana", 1_000);

    expect(registrarUso("usr-ana", 1_000)).toBe(false);
    expect(registrarUso("usr-bruno", 1_000)).toBe(true);
  });
});
