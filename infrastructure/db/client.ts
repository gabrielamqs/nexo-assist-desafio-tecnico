import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { ambiente, bancoEhRemoto } from "@/lib/env";
import * as schema from "./schema";

export type BancoDeDados = LibSQLDatabase<typeof schema>;

export const PASTA_DAS_MIGRATIONS = "./infrastructure/db/migrations";

function garantirPastaDoArquivo(url: string) {
  if (!url.startsWith("file:")) return;
  const caminho = url.slice("file:".length);
  if (caminho === "" || caminho.startsWith(":")) return;
  mkdirSync(dirname(caminho), { recursive: true });
}

export function criarBancoDeDados(
  url?: string,
  authToken?: string,
): BancoDeDados {
  const configuracao =
    url === undefined
      ? {
          url: ambiente().DATABASE_URL,
          authToken: ambiente().DATABASE_AUTH_TOKEN,
        }
      : { url, authToken };

  garantirPastaDoArquivo(configuracao.url);
  return drizzle(createClient(configuracao), { schema });
}

export const migrar = (banco: BancoDeDados) =>
  migrate(banco, { migrationsFolder: PASTA_DAS_MIGRATIONS });

const chaveGlobal = Symbol.for("nexo-assist.banco-de-dados");

type GlobalComBanco = typeof globalThis & {
  [chaveGlobal]?: { banco: BancoDeDados; preparo?: Promise<BancoDeDados> };
};

const estadoGlobal = (): NonNullable<GlobalComBanco[typeof chaveGlobal]> => {
  const alvo = globalThis as GlobalComBanco;
  alvo[chaveGlobal] ??= { banco: criarBancoDeDados() };
  return alvo[chaveGlobal];
};

export const banco = (): BancoDeDados => estadoGlobal().banco;

export function prepararBancoDeDados(): Promise<BancoDeDados> {
  const estado = estadoGlobal();
  estado.preparo ??= (async () => {
    // Banco remoto é migrado e semeado uma vez por `npm run db:seed`: em serverless, boots concorrentes correriam entre si.
    if (bancoEhRemoto()) return estado.banco;

    await migrar(estado.banco);
    const { semearBancoDeDados } = await import("./seed");
    await semearBancoDeDados(estado.banco);
    return estado.banco;
  })();
  return estado.preparo;
}
