import { criarBancoDeDados, migrar } from "@/infrastructure/db/client";
import {
  ARTIGOS_DE_EXEMPLO,
  USUARIOS_DE_EXEMPLO,
} from "@/infrastructure/db/dados-exemplo";
import { artigos, usuarios } from "@/infrastructure/db/schema";

export async function criarBancoDeTeste() {
  const banco = criarBancoDeDados(":memory:");
  await migrar(banco);
  await banco.insert(usuarios).values(USUARIOS_DE_EXEMPLO);
  return banco;
}

export async function criarBancoComArtigos() {
  const banco = await criarBancoDeTeste();
  await banco.insert(artigos).values(ARTIGOS_DE_EXEMPLO);
  return banco;
}
