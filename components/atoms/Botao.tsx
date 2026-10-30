import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  variante?: "primario" | "secundario" | "fantasma";
  largura?: "automatica" | "total";
};

const POR_VARIANTE = {
  primario:
    "bg-primario text-tinta-invertida hover:bg-primario-escuro focus-visible:outline-primario disabled:bg-primario/50",
  secundario:
    "border border-borda bg-superficie text-tinta hover:bg-superficie-baixa focus-visible:outline-primario",
  fantasma:
    "text-tinta-media hover:bg-superficie-baixa hover:text-tinta focus-visible:outline-primario",
} as const;

export function Botao({
  variante = "primario",
  largura = "automatica",
  className = "",
  type = "button",
  ...resto
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${POR_VARIANTE[variante]} ${largura === "total" ? "w-full" : ""} ${className}`}
      {...resto}
    />
  );
}
