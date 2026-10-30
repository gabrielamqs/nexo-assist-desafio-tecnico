import { asc } from "drizzle-orm";
import type { CentralDeAjuda } from "@/application/ports/central-de-ajuda";
import type { ArtigoDaCentralDeAjuda } from "@/domain/types";
import type { BancoDeDados } from "@/infrastructure/db/client";
import { artigos } from "@/infrastructure/db/schema";

const TAMANHO_MINIMO_DO_TERMO = 3;
const LIMITE_PADRAO = 3;

const PESO_DO_TITULO = 3;
const PESO_DA_PALAVRA_CHAVE = 2;
const PESO_DO_CONTEUDO = 1;

export const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const termosDe = (consulta: string) => [
  ...new Set(
    normalizar(consulta)
      .split(/[^a-z0-9]+/)
      .filter((termo) => termo.length >= TAMANHO_MINIMO_DO_TERMO),
  ),
];

const ocorrencias = (termo: string, texto: string) =>
  normalizar(texto).includes(termo) ? 1 : 0;

export function pontuarArtigo(
  artigo: ArtigoDaCentralDeAjuda,
  termos: string[],
): number {
  const palavrasChave = artigo.palavrasChave.join(" ");

  return termos.reduce(
    (total, termo) =>
      total +
      ocorrencias(termo, artigo.titulo) * PESO_DO_TITULO +
      ocorrencias(termo, palavrasChave) * PESO_DA_PALAVRA_CHAVE +
      ocorrencias(termo, artigo.conteudo) * PESO_DO_CONTEUDO,
    0,
  );
}

export function criarCentralDeAjuda(banco: BancoDeDados): CentralDeAjuda {
  const listarTodos = () =>
    banco.select().from(artigos).orderBy(asc(artigos.titulo));

  return {
    listarTodos,

    async buscar(termo, limite = LIMITE_PADRAO) {
      const termos = termosDe(termo);
      if (termos.length === 0) return [];

      return (await listarTodos())
        .map((artigo) => ({ artigo, pontos: pontuarArtigo(artigo, termos) }))
        .filter(({ pontos }) => pontos > 0)
        .sort((a, b) => b.pontos - a.pontos)
        .slice(0, limite)
        .map(({ artigo }) => artigo);
    },
  };
}
