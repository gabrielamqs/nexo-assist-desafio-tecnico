import { LogOut } from "lucide-react";
import { Botao } from "@/components/atoms/Botao";
import type { Usuario } from "@/domain/types";

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase();

export function CartaoDoUsuario({ usuario }: { usuario: Usuario }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primario-suave text-xs font-semibold text-primario">
        {iniciais(usuario.nome)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-tinta">
          {usuario.nome}
        </p>
        <p className="truncate text-xs text-tinta-fraca">{usuario.email}</p>
      </div>
      <form action="/sair" method="post">
        <Botao variante="fantasma" type="submit" className="px-2">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Sair</span>
        </Botao>
      </form>
    </div>
  );
}
