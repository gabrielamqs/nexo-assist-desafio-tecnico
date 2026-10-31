import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";
import { Selo, SeloDeEstadoDaConversa } from "@/components/atoms/Selo";
import { BarraLateral } from "@/components/organisms/BarraLateral";
import type { EstadoDaConversa, Usuario } from "@/domain/types";

type Props = {
  usuario: Usuario;
  estadoDaConversa: EstadoDaConversa | null;
  children: ReactNode;
};

export function LayoutDoAtendimento({
  usuario,
  estadoDaConversa,
  children,
}: Props) {
  return (
    <div className="flex h-dvh bg-superficie">
      <BarraLateral usuario={usuario} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-borda px-4 py-3 sm:px-6">
          <div className="md:hidden">
            <MarcaNexoAssist />
          </div>
          <nav
            aria-label="Você está em"
            className="hidden items-center gap-1 text-sm text-tinta-fraca md:flex"
          >
            Service desk de TI
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-medium text-tinta">Atendimento</span>
          </nav>
          {estadoDaConversa === null || estadoDaConversa === "com_agent" ? (
            <Selo tom="resolvido" forma="pilula">
              Assistente online
            </Selo>
          ) : (
            <SeloDeEstadoDaConversa estado={estadoDaConversa} />
          )}
        </header>

        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
