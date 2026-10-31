import { LogOut } from "lucide-react";

export function BotaoDeSair({
  apenasIcone = false,
}: {
  apenasIcone?: boolean;
}) {
  return (
    <form action="/sair" method="post" className={apenasIcone ? "" : "w-full"}>
      <button
        type="submit"
        className={`inline-flex items-center gap-2.5 rounded-lg text-sm font-medium text-tinta-media transition-colors hover:bg-superficie-baixa hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
          apenasIcone ? "p-2" : "w-full px-2.5 py-2"
        }`}
      >
        <LogOut
          className="h-4 w-4 shrink-0 text-tinta-fraca"
          aria-hidden="true"
        />
        {apenasIcone ? <span className="sr-only">Sair</span> : "Sair"}
      </button>
    </form>
  );
}
