import { Avatar } from "@/components/atoms/Avatar";
import type { Usuario } from "@/domain/types";

export function CartaoDoUsuario({ usuario }: { usuario: Usuario }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar nome={usuario.nome} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-tinta">
          {usuario.nome}
        </p>
        <p className="truncate text-xs text-tinta-fraca">{usuario.email}</p>
      </div>
    </div>
  );
}
