import type { ReactNode } from "react";

type Props = {
  apresentacao: ReactNode;
  children: ReactNode;
};

export function TelaDividida({ apresentacao, children }: Props) {
  return (
    <main className="grid min-h-dvh lg:h-dvh lg:grid-cols-2">
      <section className="hidden lg:block lg:overflow-y-auto">
        {apresentacao}
      </section>
      <section className="flex flex-col bg-superficie lg:overflow-y-auto">
        {children}
      </section>
    </main>
  );
}
