import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

type Props = ComponentProps<"button"> & {
  variante?: "primario" | "secundario" | "fantasma";
  tamanho?: "normal" | "compacto";
  largura?: "automatica" | "total";
  carregando?: boolean;
};

const POR_VARIANTE = {
  primario:
    "bg-primario-acao text-tinta-invertida hover:bg-primario-hover focus-visible:outline-primario disabled:bg-primario-acao/50",
  secundario:
    "border border-borda bg-superficie text-tinta hover:border-primario/40 hover:bg-primario-suave hover:text-primario-texto focus-visible:outline-primario disabled:opacity-50",
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
  carregando = false,
  className = "",
  type = "button",
  disabled = false,
  children,
  ...resto
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${POR_VARIANTE[variante]} ${POR_TAMANHO[tamanho]} ${largura === "total" ? "w-full" : ""} ${className}`}
      {...resto}
    >
      {carregando && (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
