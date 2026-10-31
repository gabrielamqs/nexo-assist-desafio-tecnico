import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/atoms/Avatar";
import { SimboloNexo } from "@/components/atoms/SimboloNexo";
import { BotaoDeSair } from "@/components/molecules/BotaoDeSair";
import type { Usuario } from "@/domain/types";

type Props = {
  analista: Usuario;
  aguardando: number;
};

export function TrilhaDoConsole({ analista, aguardando }: Props) {
  return (
    <nav
      aria-label="Navegação do console"
      className="hidden w-16 shrink-0 flex-col items-center gap-1.5 border-r border-borda bg-superficie-baixa py-4 md:flex"
    >
      <span className="flex h-10 w-10 items-center justify-center pb-2">
        <SimboloNexo className="h-5.5 w-5.5 text-primario" />
      </span>

      <Link
        href="/analista"
        aria-current="page"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-superficie text-tinta sombra-de-controle"
      >
        <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
        <span className="sr-only">Conversas</span>
        {aguardando > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primario-acao px-1 text-xs font-bold text-tinta-invertida ring-2 ring-superficie-baixa">
            {aguardando}
          </span>
        )}
      </Link>

      <span className="flex-1" />

      <span className="relative">
        <Avatar nome={analista.nome} />
        <span
          aria-hidden="true"
          className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-resolvido ring-2 ring-superficie-baixa"
        />
      </span>

      <BotaoDeSair apenasIcone />
    </nav>
  );
}
