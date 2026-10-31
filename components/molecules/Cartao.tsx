import type { ReactNode } from "react";

type Props = {
  cabecalho: ReactNode;
  selo?: ReactNode;
  rodape?: ReactNode;
  children: ReactNode;
};

export function Cartao({ cabecalho, selo, rodape, children }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-borda-forte bg-superficie sombra-de-cartao">
      <div className="space-y-1.5 px-4.5 pt-4 pb-3.5">
        <header className="flex items-center justify-between gap-3 text-xs text-tinta-fraca">
          <span>{cabecalho}</span>
          {selo}
        </header>
        {children}
      </div>
      {rodape !== undefined && (
        <footer className="flex flex-wrap items-center gap-1.5 border-t border-borda bg-superficie-baixa px-3.5 py-2">
          {rodape}
        </footer>
      )}
    </section>
  );
}

export function GradeDoCartao({ children }: { children: ReactNode }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-borda pt-3 sm:grid-cols-4">
      {children}
    </dl>
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
      <dd className="mt-1 text-sm font-medium text-tinta">{children}</dd>
    </div>
  );
}
