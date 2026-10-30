import { beforeEach, describe, expect, it } from "vitest";
import type { CentralDeAjuda } from "@/application/ports/central-de-ajuda";
import { criarCentralDeAjuda } from "@/infrastructure/central-de-ajuda/repositorio-sqlite";
import { criarBancoComArtigos } from "./banco-de-teste";

let central: CentralDeAjuda;

beforeEach(async () => {
  central = criarCentralDeAjuda(await criarBancoComArtigos());
});

describe("buscar", () => {
  it("acha o artigo pelo termo do título", async () => {
    const encontrados = await central.buscar("erro 809 na VPN");
    expect(encontrados[0]?.titulo).toBe("VPN com erro 809");
  });

  it("ignora acentos e caixa", async () => {
    const encontrados = await central.buscar("HORARIO do service desk");
    expect(encontrados[0]?.titulo).toBe("Horário do service desk");
  });

  it("acha pelo conteúdo quando o título não bate", async () => {
    const encontrados = await central.buscar("Microsoft Authenticator");
    expect(encontrados[0]?.titulo).toBe("Outlook não sincroniza no celular");
  });

  it("não devolve nada quando o assunto não existe na central", async () => {
    await expect(
      central.buscar("reembolso de despesas médicas"),
    ).resolves.toEqual([]);
  });

  it("ignora termos curtos demais para dizer algo", async () => {
    await expect(central.buscar("de do da")).resolves.toEqual([]);
  });

  it("respeita o limite de resultados", async () => {
    const encontrados = await central.buscar("senha rede acesso", 2);
    expect(encontrados).toHaveLength(2);
  });
});

describe("listarTodos", () => {
  it("devolve os artigos em ordem de título", async () => {
    const titulos = (await central.listarTodos()).map(
      (artigo) => artigo.titulo,
    );
    expect(titulos).toEqual([...titulos].sort());
  });
});
