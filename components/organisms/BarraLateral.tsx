import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";
import { CartaoDoUsuario } from "@/components/molecules/CartaoDoUsuario";
import type { Usuario } from "@/domain/types";

export function BarraLateral({ usuario }: { usuario: Usuario }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-borda bg-superficie-baixa md:flex">
      <div className="px-5 py-5">
        <MarcaNexoAssist />
      </div>

      <nav aria-label="Navegação principal" className="flex-1 px-3">
        <Link
          href="/chat"
          aria-current="page"
          className="flex items-center gap-2 rounded-lg bg-primario-suave px-3 py-2 text-sm font-medium text-primario"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Atendimento
        </Link>
      </nav>

      <div className="border-t border-borda p-4">
        <CartaoDoUsuario usuario={usuario} />
      </div>
    </aside>
  );
}
