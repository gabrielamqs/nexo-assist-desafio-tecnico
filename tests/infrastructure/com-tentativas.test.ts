import { describe, expect, it, vi } from "vitest";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import {
  comTentativas,
  tentarNovamente,
} from "@/infrastructure/ticket-repo/com-tentativas";
import { SistemaDeChamadosIndisponivelError } from "@/infrastructure/ticket-repo/indisponibilidade";

const semEspera = async () => {};

const falharVezes = <T>(vezes: number, resultado: T) => {
  let restantes = vezes;
  return async () => {
    if (restantes > 0) {
      restantes -= 1;
      throw new SistemaDeChamadosIndisponivelError();
    }
    return resultado;
  };
};

describe("tentarNovamente", () => {
  it("devolve o resultado quando o sistema responde de primeira", async () => {
    const operacao = vi.fn(falharVezes(0, "ok"));

    await expect(
      tentarNovamente(operacao, { esperar: semEspera }),
    ).resolves.toBe("ok");
    expect(operacao).toHaveBeenCalledTimes(1);
  });

  it("insiste enquanto o sistema de chamados está indisponível", async () => {
    const operacao = vi.fn(falharVezes(2, "ok"));

    await expect(
      tentarNovamente(operacao, { esperar: semEspera }),
    ).resolves.toBe("ok");
    expect(operacao).toHaveBeenCalledTimes(3);
  });

  it("desiste depois do número máximo de tentativas", async () => {
    const operacao = vi.fn(falharVezes(5, "ok"));

    await expect(
      tentarNovamente(operacao, { esperar: semEspera }),
    ).rejects.toBeInstanceOf(SistemaDeChamadosIndisponivelError);
    expect(operacao).toHaveBeenCalledTimes(3);
  });

  it("espera mais a cada tentativa", async () => {
    const esperas: number[] = [];
    const esperar = async (ms: number) => {
      esperas.push(ms);
    };

    await tentarNovamente(falharVezes(2, "ok"), {
      esperar,
      esperaInicialEmMs: 100,
    });

    expect(esperas).toEqual([100, 200]);
  });

  it("não insiste em erros que não são de indisponibilidade", async () => {
    const operacao = vi.fn(async () => {
      throw new TypeError("erro de programação");
    });

    await expect(
      tentarNovamente(operacao, { esperar: semEspera }),
    ).rejects.toBeInstanceOf(TypeError);
    expect(operacao).toHaveBeenCalledTimes(1);
  });
});

describe("comTentativas", () => {
  it("aplica as tentativas às operações do repositório", async () => {
    const buscarPorCodigo = vi.fn(falharVezes(1, null));
    const repositorio = { buscarPorCodigo } as unknown as RepositorioDeChamados;

    const protegido = comTentativas(repositorio, { esperar: semEspera });

    await expect(protegido.buscarPorCodigo("INC-20311")).resolves.toBeNull();
    expect(buscarPorCodigo).toHaveBeenCalledTimes(2);
  });
});
