import type { ComponentProps, ReactNode } from "react";

type Props = ComponentProps<"input"> & {
  icone?: ReactNode;
  acessorio?: ReactNode;
};

export function CampoDeTexto({
  icone,
  acessorio,
  className = "",
  ...resto
}: Props) {
  return (
    <div className="relative">
      {icone !== undefined && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-tinta-fraca">
          {icone}
        </span>
      )}
      <input
        className={`w-full rounded-lg border border-borda bg-papel py-2.5 text-sm text-tinta placeholder:text-tinta-fraca focus:border-azul focus:outline-2 focus:outline-offset-0 focus:outline-azul/30 ${icone === undefined ? "pl-3" : "pl-10"} ${acessorio === undefined ? "pr-3" : "pr-10"} ${className}`}
        {...resto}
      />
      {acessorio !== undefined && (
        <span className="absolute inset-y-0 right-2 flex items-center">
          {acessorio}
        </span>
      )}
    </div>
  );
}
