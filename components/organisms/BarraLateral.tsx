import { MessageSquare, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { MarcaNexoAssist } from "@/components/atoms/MarcaNexoAssist";
import { BotaoDeSair } from "@/components/molecules/BotaoDeSair";
import { CartaoDoUsuario } from "@/components/molecules/CartaoDoUsuario";
import type { Usuario } from "@/domain/types";
import { SECOES_DO_FUNCIONARIO, type SecaoDoFuncionario } from "@/lib/rotas";

const ICONE_DA_SECAO: Record<SecaoDoFuncionario, LucideIcon> = {
  Atendimento: MessageSquare,
  "Meu perfil": UserRound,
};

type Props = {
  usuario: Usuario;
  secaoAtiva: SecaoDoFuncionario;
};

export function BarraLateral({ usuario, secaoAtiva }: Props) {
  return (
    <aside className="hidden w-58 shrink-0 flex-col border-r border-borda bg-superficie px-3.5 pt-5 pb-3.5 md:flex">
      <div className="px-2">
        <MarcaNexoAssist />
      </div>

      <nav
        aria-label="Navegação principal"
        className="mt-6 flex flex-col gap-0.5"
      >
        {SECOES_DO_FUNCIONARIO.map(({ rotulo, rota }) => {
          const ativa = rotulo === secaoAtiva;
          const Icone = ICONE_DA_SECAO[rotulo];

          return (
            <Link
              key={rotulo}
              href={rota}
              aria-current={ativa ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                ativa
                  ? "bg-primario-suave font-semibold text-primario-texto"
                  : "font-medium text-tinta-media hover:bg-superficie-baixa"
              }`}
            >
              <Icone
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 ${ativa ? "text-primario-texto" : "text-tinta-fraca"}`}
              />
              {rotulo}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-borda px-2 pt-3.5">
        <CartaoDoUsuario usuario={usuario} />
      </div>
      <div className="mt-1">
        <BotaoDeSair />
      </div>
    </aside>
  );
}
