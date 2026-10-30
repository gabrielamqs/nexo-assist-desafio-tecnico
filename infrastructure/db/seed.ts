import { sql } from "drizzle-orm";
import type { BancoDeDados } from "./client";
import {
  ARTIGOS_DE_EXEMPLO,
  USUARIOS_DE_EXEMPLO,
  construirChamadosDeExemplo,
} from "./dados-exemplo";
import { artigos, chamados, usuarios } from "./schema";

async function estaVazio(banco: BancoDeDados): Promise<boolean> {
  const [linha] = await banco
    .select({ total: sql<number>`count(*)` })
    .from(usuarios);
  return (linha?.total ?? 0) === 0;
}

export async function semearBancoDeDados(
  banco: BancoDeDados,
  agora = new Date(),
): Promise<boolean> {
  if (!(await estaVazio(banco))) return false;

  await banco.insert(usuarios).values(USUARIOS_DE_EXEMPLO);
  await banco.insert(artigos).values(ARTIGOS_DE_EXEMPLO);
  await banco.insert(chamados).values(construirChamadosDeExemplo(agora));

  return true;
}
