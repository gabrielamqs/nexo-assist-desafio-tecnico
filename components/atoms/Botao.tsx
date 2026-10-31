import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  variante?: "primario" | "secundario" | "fantasma";
  tamanho?: "normal" | "compacto";
  largura?: "automatica" | "total";
};

const POR_VARIANTE = {
  primario:
    "bg-primario text-tinta-invertida hover:bg-primario-escuro focus-visible:outline-primario disabled:bg-primario/50",
  secundario:
    "border border-borda bg-superficie text-tinta hover:border-primario/40 hover:bg-primario-suave hover:text-primario focus-visible:outline-primario disabled:opacity-50",
  fantasma:
    "text-tinta-media hover:bg-superficie-baixa hover:text-tinta focus-visible:outline-primario disabled:opacity-50",
} as const;

const POR_TAMANHO = {
  normal: "px-4 py-2.5",
  compacto: "px-3 py-1.5",
} as const;

export function Botao({
  variante = "primario",
  tamanho = "normal",
  largura = "automatica",
  className = "",
  type = "button",
  ...resto
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${POR_VARIANTE[variante]} ${POR_TAMANHO[tamanho]} ${largura === "total" ? "w-full" : ""} ${className}`}
      {...resto}
    />
  );
}
