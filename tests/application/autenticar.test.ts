import { beforeEach, describe, expect, it } from "vitest";
import type { RepositorioDeUsuarios } from "@/application/ports/usuarios";
import { autenticar } from "@/application/usecases/autenticar";
import { criarBancoDeTeste } from "../infrastructure/banco-de-teste";
import { criarRepositorioDeUsuarios } from "@/infrastructure/usuarios/repositorio-sqlite";

let repositorio: RepositorioDeUsuarios;

beforeEach(async () => {
  repositorio = criarRepositorioDeUsuarios(await criarBancoDeTeste());
});

describe("autenticar", () => {
  it("aceita um funcionário dos dados de exemplo com qualquer senha", async () => {
    const resultado = await autenticar(repositorio, {
      email: "ana.souza@nexo.com.br",
      senha: "qualquer-coisa",
    });

    expect(resultado).toEqual({
      autenticado: true,
      usuario: expect.objectContaining({
        id: "usr-ana",
        papel: "funcionario",
      }),
    });
  });

  it("reconhece o analista para o roteamento por papel", async () => {
    const resultado = await autenticar(repositorio, {
      email: "rafael.lima@nexo.com.br",
      senha: "qualquer-coisa",
    });

    expect(resultado.autenticado && resultado.usuario.papel).toBe("analista");
  });

  it("ignora caixa e espaços no e-mail", async () => {
    const resultado = await autenticar(repositorio, {
      email: "  ANA.Souza@Nexo.com.BR  ",
      senha: "x",
    });

    expect(resultado.autenticado).toBe(true);
  });

  it("recusa e-mail que não está nos dados", async () => {
    const resultado = await autenticar(repositorio, {
      email: "nao.existe@nexo.com.br",
      senha: "x",
    });

    expect(resultado).toEqual({
      autenticado: false,
      motivo: "nao_encontrado",
    });
  });

  it("exige e-mail e senha preenchidos", async () => {
    await expect(
      autenticar(repositorio, { email: "   ", senha: "x" }),
    ).resolves.toEqual({ autenticado: false, motivo: "email_em_branco" });

    await expect(
      autenticar(repositorio, { email: "ana.souza@nexo.com.br", senha: "" }),
    ).resolves.toEqual({ autenticado: false, motivo: "senha_em_branco" });
  });
});
