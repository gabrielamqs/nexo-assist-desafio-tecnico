import { taxaDeFalhaDoServicoDeChamados } from "@/lib/env";
import { criarCentralDeAjuda } from "./central-de-ajuda/repositorio-sqlite";
import { banco } from "./db/client";
import { criarServidorMcp } from "./mcp/servidor";
import { comTentativas } from "./ticket-repo/com-tentativas";
import { criarVerificacaoDeDisponibilidade } from "./ticket-repo/indisponibilidade";
import { criarRepositorioDeChamados } from "./ticket-repo/repositorio-sqlite";
import { criarRepositorioDeUsuarios } from "./usuarios/repositorio-sqlite";

const memoizar = <T>(criar: () => T) => {
  let instancia: T | undefined;
  return () => (instancia ??= criar());
};

export const repositorioDeChamados = memoizar(() =>
  comTentativas(
    criarRepositorioDeChamados({
      banco: banco(),
      verificarDisponibilidade: criarVerificacaoDeDisponibilidade(
        taxaDeFalhaDoServicoDeChamados(),
      ),
    }),
  ),
);

export const centralDeAjuda = memoizar(() => criarCentralDeAjuda(banco()));

export const repositorioDeUsuarios = memoizar(() =>
  criarRepositorioDeUsuarios(banco()),
);

export const servidorMcp = memoizar(() =>
  criarServidorMcp({
    repositorioDeChamados: repositorioDeChamados(),
    centralDeAjuda: centralDeAjuda(),
  }),
);
