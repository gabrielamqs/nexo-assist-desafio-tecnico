import type { ReactNode } from "react";
import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";
import { CartaoDoUsuario } from "@/components/molecules/CartaoDoUsuario";
import type { Usuario } from "@/domain/types";

type Props = {
  analista: Usuario;
  fila: ReactNode;
  painel: ReactNode;
  children: ReactNode;
};

export function LayoutDoConsole({ analista, fila, painel, children }: Props) {
  return (
    <div className="flex h-dvh flex-col bg-superficie">
      <header className="flex items-center justify-between gap-4 border-b border-borda px-4 py-3 sm:px-6">
        <MarcaNexoAssist />
        <span className="hidden text-sm text-tinta-media sm:block">
          Console do analista
        </span>
        <div className="w-64">
          <CartaoDoUsuario usuario={analista} />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:colunas-com-fila xl:colunas-com-painel">
        <aside className="min-h-0 overflow-hidden border-r border-borda bg-superficie-baixa">
          {fila}
        </aside>

        <main className="flex min-h-0 flex-col">{children}</main>

        <aside className="hidden min-h-0 overflow-hidden border-l border-borda bg-superficie-baixa xl:block">
          {painel}
        </aside>
      </div>
    </div>
  );
}
