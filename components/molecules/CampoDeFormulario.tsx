import type { ReactNode } from "react";

type Props = {
  id: string;
  rotulo: string;
  acao?: ReactNode;
  children: ReactNode;
};

export function CampoDeFormulario({ id, rotulo, acao, children }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-tinta">
          {rotulo}
        </label>
        {acao}
      </div>
      {children}
    </div>
  );
}
