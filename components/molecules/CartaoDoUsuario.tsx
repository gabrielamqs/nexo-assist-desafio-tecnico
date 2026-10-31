import { LogOut } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Botao } from "@/components/atoms/Botao";
import type { Usuario } from "@/domain/types";

export function CartaoDoUsuario({ usuario }: { usuario: Usuario }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar nome={usuario.nome} />
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
