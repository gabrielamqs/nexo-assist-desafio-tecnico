import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Papel, Usuario } from "@/domain/types";
import { prepararBancoDeDados } from "@/infrastructure/db/client";
import { repositorioDeUsuarios } from "@/infrastructure/dependencias";
import { emProducao, segredoDeSessao } from "./env";
import { ROTA_DE_LOGIN, rotaInicialPara } from "./rotas";
import {
  DURACAO_DA_SESSAO_EM_DIAS,
  NOME_DO_COOKIE_DE_SESSAO,
  assinarSessao,
  criarSessaoPara,
  lerSessao,
  type Sessao,
} from "./sessao";

export async function abrirSessao(usuario: Usuario, manterConectado = false) {
  const sessao = criarSessaoPara(usuario.id, usuario.papel);
  const armazem = await cookies();

  armazem.set(
    NOME_DO_COOKIE_DE_SESSAO,
    assinarSessao(sessao, segredoDeSessao()),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: emProducao(),
      path: "/",
      ...(manterConectado
        ? { maxAge: DURACAO_DA_SESSAO_EM_DIAS * 24 * 60 * 60 }
        : {}),
    },
  );
}

export async function sessaoAtual(): Promise<Sessao | null> {
  await connection();
  const armazem = await cookies();
  const token = armazem.get(NOME_DO_COOKIE_DE_SESSAO)?.value;

  return lerSessao(token, segredoDeSessao());
}

export async function usuarioAtual(): Promise<Usuario | null> {
  const sessao = await sessaoAtual();
  if (sessao === null) return null;

  await prepararBancoDeDados();
  return repositorioDeUsuarios().buscarPorId(sessao.usuarioId);
}

export async function exigirUsuario(papel: Papel): Promise<Usuario> {
  const usuario = await usuarioAtual();

  if (usuario === null) redirect(ROTA_DE_LOGIN);
  if (usuario.papel !== papel) redirect(rotaInicialPara(usuario.papel));

  return usuario;
}
