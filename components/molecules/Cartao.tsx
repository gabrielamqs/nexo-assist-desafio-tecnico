import type { ReactNode } from "react";

type Props = {
  cabecalho: ReactNode;
  selo?: ReactNode;
  rodape?: ReactNode;
  children: ReactNode;
};

export function Cartao({ cabecalho, selo, rodape, children }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-borda bg-superficie">
      <header className="flex items-center justify-between gap-3 border-b border-borda bg-superficie-baixa px-4 py-2 text-xs text-tinta-fraca">
        <span>{cabecalho}</span>
        {selo}
      </header>
      <div className="space-y-3 p-4">{children}</div>
      {rodape !== undefined && (
        <footer className="flex flex-wrap items-center gap-2 border-t border-borda px-4 py-3">
          {rodape}
        </footer>
      )}
    </section>
  );
}

export function CampoDoCartao({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-tinta-fraca">{rotulo}</dt>
      <dd className="mt-0.5 text-sm text-tinta">{children}</dd>
    </div>
  );
}
