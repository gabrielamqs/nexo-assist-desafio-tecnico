import { createHmac, timingSafeEqual } from "node:crypto";
import type { Papel } from "@/domain/types";

export const NOME_DO_COOKIE_DE_SESSAO = "nexo_sessao";
export const DURACAO_DA_SESSAO_EM_DIAS = 7;

export type Sessao = {
  usuarioId: string;
  papel: Papel;
  expiraEm: number;
};

const codificar = (valor: object) =>
  Buffer.from(JSON.stringify(valor)).toString("base64url");

const assinar = (conteudo: string, segredo: string) =>
  createHmac("sha256", segredo).update(conteudo).digest("base64url");

export const assinarSessao = (sessao: Sessao, segredo: string) => {
  const conteudo = codificar(sessao);
  return `${conteudo}.${assinar(conteudo, segredo)}`;
};

const assinaturaConfere = (
  conteudo: string,
  assinatura: string,
  segredo: string,
) => {
  const esperada = Buffer.from(assinar(conteudo, segredo));
  const recebida = Buffer.from(assinatura);

  return (
    esperada.length === recebida.length && timingSafeEqual(esperada, recebida)
  );
};

function decodificar(conteudo: string): Sessao | null {
  try {
    const dados: unknown = JSON.parse(
      Buffer.from(conteudo, "base64url").toString(),
    );

    if (typeof dados !== "object" || dados === null) return null;
    const { usuarioId, papel, expiraEm } = dados as Record<string, unknown>;

    if (typeof usuarioId !== "string" || usuarioId === "") return null;
    if (papel !== "funcionario" && papel !== "analista") return null;
    if (typeof expiraEm !== "number") return null;

    return { usuarioId, papel, expiraEm };
  } catch {
    return null;
  }
}

export function lerSessao(
  token: string | undefined,
  segredo: string,
  agora: Date = new Date(),
): Sessao | null {
  if (token === undefined) return null;

  const separador = token.lastIndexOf(".");
  if (separador <= 0) return null;

  const conteudo = token.slice(0, separador);
  const assinatura = token.slice(separador + 1);

  if (!assinaturaConfere(conteudo, assinatura, segredo)) return null;

  const sessao = decodificar(conteudo);
  if (sessao === null) return null;

  return sessao.expiraEm > agora.getTime() ? sessao : null;
}

export const criarSessaoPara = (
  usuarioId: string,
  papel: Papel,
  agora: Date = new Date(),
): Sessao => ({
  usuarioId,
  papel,
  expiraEm: agora.getTime() + DURACAO_DA_SESSAO_EM_DIAS * 24 * 60 * 60 * 1000,
});
