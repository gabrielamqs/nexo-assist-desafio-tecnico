import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import { SistemaDeChamadosIndisponivelError } from "./indisponibilidade";

export type OpcoesDeTentativa = {
  maximoDeTentativas?: number;
  esperaInicialEmMs?: number;
  esperar?: (ms: number) => Promise<void>;
};

const dormir = (ms: number) =>
  new Promise<void>((resolver) => setTimeout(resolver, ms));

export async function tentarNovamente<T>(
  operacao: () => Promise<T>,
  opcoes: OpcoesDeTentativa = {},
): Promise<T> {
  const {
    maximoDeTentativas = 3,
    esperaInicialEmMs = 200,
    esperar = dormir,
  } = opcoes;

  let ultimoErro: unknown;

  for (let tentativa = 0; tentativa < maximoDeTentativas; tentativa += 1) {
    try {
      return await operacao();
    } catch (erro) {
      if (!(erro instanceof SistemaDeChamadosIndisponivelError)) throw erro;
      ultimoErro = erro;
      const ehUltima = tentativa === maximoDeTentativas - 1;
      if (!ehUltima) await esperar(esperaInicialEmMs * 2 ** tentativa);
    }
  }

  throw ultimoErro;
}

export const comTentativas = (
  repositorio: RepositorioDeChamados,
  opcoes: OpcoesDeTentativa = {},
): RepositorioDeChamados => ({
  listarPorSolicitante: (solicitanteId) =>
    tentarNovamente(
      () => repositorio.listarPorSolicitante(solicitanteId),
      opcoes,
    ),
  buscarPorCodigo: (codigo) =>
    tentarNovamente(() => repositorio.buscarPorCodigo(codigo), opcoes),
  listarAtualizacoes: (codigo) =>
    tentarNovamente(() => repositorio.listarAtualizacoes(codigo), opcoes),
  criar: (dados) => tentarNovamente(() => repositorio.criar(dados), opcoes),
  atualizar: (codigo, dados) =>
    tentarNovamente(() => repositorio.atualizar(codigo, dados), opcoes),
  transferirParaAnalista: (codigo, resumo) =>
    tentarNovamente(
      () => repositorio.transferirParaAnalista(codigo, resumo),
      opcoes,
    ),
});
