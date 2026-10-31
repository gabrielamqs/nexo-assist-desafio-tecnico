import type { ReactNode } from "react";
import { TrilhaDoConsole } from "@/components/organisms/TrilhaDoConsole";
import type { Usuario } from "@/domain/types";

type Props = {
  analista: Usuario;
  aguardando: number;
  fila: ReactNode;
  painel: ReactNode;
  children: ReactNode;
};

export function LayoutDoConsole({
  analista,
  aguardando,
  fila,
  painel,
  children,
}: Props) {
  return (
    <div className="flex h-dvh bg-superficie">
      <TrilhaDoConsole analista={analista} aguardando={aguardando} />

      <div className="grid min-h-0 flex-1 lg:colunas-com-fila xl:colunas-com-painel">
        <aside className="min-h-0 overflow-hidden border-r border-borda bg-superficie">
          {fila}
        </aside>

        <main className="flex min-h-0 flex-col bg-superficie-conversa">
          {children}
        </main>

        <aside className="hidden min-h-0 overflow-hidden border-l border-borda bg-superficie xl:block">
          {painel}
        </aside>
      </div>
    </div>
  );
}
