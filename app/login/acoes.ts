"use server";

import { redirect } from "next/navigation";
import { autenticar } from "@/application/usecases/autenticar";
import { prepararBancoDeDados } from "@/infrastructure/db/client";
import { repositorioDeUsuarios } from "@/infrastructure/dependencias";
import { ROTA_DE_LOGIN, rotaInicialPara } from "@/lib/rotas";
import { abrirSessao, encerrarSessao } from "@/lib/sessao-servidor";
import type { EstadoDoLogin } from "./estado";

const MENSAGEM_POR_MOTIVO = {
  email_em_branco: "Informe seu e-mail corporativo.",
  senha_em_branco: "Informe sua senha.",
  nao_encontrado:
    "Não encontramos esse e-mail. Use seu e-mail corporativo da Nexo.",
} as const;

export async function entrar(
  _estadoAnterior: EstadoDoLogin,
  dados: FormData,
): Promise<EstadoDoLogin> {
  await prepararBancoDeDados();

  const resultado = await autenticar(repositorioDeUsuarios(), {
    email: String(dados.get("email") ?? ""),
    senha: String(dados.get("senha") ?? ""),
  });

  if (!resultado.autenticado) {
    return { erro: MENSAGEM_POR_MOTIVO[resultado.motivo] };
  }

  await abrirSessao(resultado.usuario, dados.get("manterConectado") === "on");
  redirect(rotaInicialPara(resultado.usuario.papel));
}

export async function sair() {
  await encerrarSessao();
  redirect(ROTA_DE_LOGIN);
}
