import { NextResponse } from "next/server";
import { ROTA_DE_LOGIN } from "@/lib/rotas";
import { NOME_DO_COOKIE_DE_SESSAO } from "@/lib/sessao";

export function POST(requisicao: Request): NextResponse {
  const resposta = NextResponse.redirect(
    new URL(ROTA_DE_LOGIN, requisicao.url),
    303,
  );
  resposta.cookies.delete(NOME_DO_COOKIE_DE_SESSAO);
  return resposta;
}
