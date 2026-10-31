import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";
import { BarraLateral } from "@/components/organisms/BarraLateral";
import type { Usuario } from "@/domain/types";
import type { SecaoDoFuncionario } from "@/lib/rotas";

type Props = {
  usuario: Usuario;
  secao: SecaoDoFuncionario;
  selo?: ReactNode;
  children: ReactNode;
};

export function LayoutDoAtendimento({ usuario, secao, selo, children }: Props) {
  return (
    <div className="flex h-dvh bg-superficie">
      <BarraLateral usuario={usuario} secaoAtiva={secao} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-borda px-4 py-3 sm:px-8">
          <div className="md:hidden">
            <MarcaNexoAssist />
          </div>
          <nav
            aria-label="Você está em"
            className="hidden items-center gap-2 text-sm text-tinta-fraca md:flex"
          >
            Service desk de TI
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-semibold text-tinta">{secao}</span>
          </nav>
          {selo}
        </header>

        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
