import type { RepositorioDeUsuarios } from "@/application/ports/usuarios";
import type { Usuario } from "@/domain/types";

export type CredenciaisDeLogin = {
  email: string;
  senha: string;
};

export type ResultadoDaAutenticacao =
  | { autenticado: true; usuario: Usuario }
  | {
      autenticado: false;
      motivo: "email_em_branco" | "senha_em_branco" | "nao_encontrado";
    };

// O PRD pede que qualquer senha seja aceita para os funcionários dos dados de
// exemplo, então o campo é exigido mas não verificado.
export async function autenticar(
  repositorio: RepositorioDeUsuarios,
  { email, senha }: CredenciaisDeLogin,
): Promise<ResultadoDaAutenticacao> {
  if (email.trim() === "") {
    return { autenticado: false, motivo: "email_em_branco" };
  }
  if (senha === "") {
    return { autenticado: false, motivo: "senha_em_branco" };
  }

  const usuario = await repositorio.buscarPorEmail(email);

  return usuario === null
    ? { autenticado: false, motivo: "nao_encontrado" }
    : { autenticado: true, usuario };
}
