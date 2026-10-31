import type { ReactNode } from "react";

const ESTILO_POR_TIPO = {
  erro: "border-critica/20 bg-critica-suave text-critica-texto",
  atencao: "border-alta/20 bg-alta-suave text-alta-texto",
  informacao: "border-primario/20 bg-primario-suave text-primario-texto",
} as const;

type Props = {
  tipo: keyof typeof ESTILO_POR_TIPO;
  children: ReactNode;
};

export function Aviso({ tipo, children }: Props) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${ESTILO_POR_TIPO[tipo]}`}
    >
      {children}
    </p>
  );
}
