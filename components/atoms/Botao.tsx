import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  variante?: "primario" | "secundario" | "fantasma";
  largura?: "automatica" | "total";
};

const POR_VARIANTE = {
  primario:
    "bg-azul text-white hover:bg-azul-escuro focus-visible:outline-azul disabled:bg-azul/50",
  secundario:
    "border border-borda bg-papel text-tinta hover:bg-fundo focus-visible:outline-azul",
  fantasma:
    "text-tinta-media hover:bg-fundo hover:text-tinta focus-visible:outline-azul",
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
