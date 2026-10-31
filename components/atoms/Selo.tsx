import type { ReactNode } from "react";
import { ROTULO_DA_PRIORIDADE, ROTULO_DO_STATUS } from "@/domain/rotulos";
import type { Prioridade, StatusDeChamado } from "@/domain/types";

export type TomDoSelo =
  "critica" | "alta" | "media" | "baixa" | "resolvido" | "primario" | "neutro";

const TEXTO_POR_TOM: Record<TomDoSelo, string> = {
  critica: "text-critica",
  alta: "text-alta",
  media: "text-media",
  baixa: "text-baixa",
  resolvido: "text-resolvido",
  primario: "text-primario",
  neutro: "text-tinta-media",
};

const PONTO_POR_TOM: Record<TomDoSelo, string> = {
  critica: "bg-critica",
  alta: "bg-alta",
  media: "bg-media",
  baixa: "bg-baixa",
  resolvido: "bg-resolvido",
  primario: "bg-primario",
  neutro: "bg-tinta-fraca",
};

const FUNDO_POR_TOM: Record<TomDoSelo, string> = {
  critica: "border-critica/20 bg-critica/10",
  alta: "border-alta/20 bg-alta/10",
  media: "border-media/20 bg-media/10",
  baixa: "border-baixa/20 bg-baixa/10",
  resolvido: "border-resolvido/20 bg-resolvido/10",
  primario: "border-primario/20 bg-primario-suave",
  neutro: "border-borda bg-superficie-baixa",
};

type Props = {
  tom: TomDoSelo;
  forma?: "ponto" | "pilula";
  children: ReactNode;
};

export function Selo({ tom, forma = "ponto", children }: Props) {
  const formato =
    forma === "pilula"
      ? `rounded-full border px-2 py-0.5 ${FUNDO_POR_TOM[tom]}`
      : "";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${TEXTO_POR_TOM[tom]} ${formato}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${PONTO_POR_TOM[tom]}`}
      />
      {children}
    </span>
  );
}

const TOM_DA_PRIORIDADE: Record<Prioridade, TomDoSelo> = {
  critica: "critica",
  alta: "alta",
  media: "media",
  baixa: "baixa",
};

const TOM_DO_STATUS: Record<StatusDeChamado, TomDoSelo> = {
  aberto: "primario",
  em_andamento: "primario",
  aguardando_analista: "media",
  aprovado: "resolvido",
  resolvido: "resolvido",
};

export function SeloDePrioridade({ prioridade }: { prioridade: Prioridade }) {
  return (
    <Selo tom={TOM_DA_PRIORIDADE[prioridade]}>
      {ROTULO_DA_PRIORIDADE[prioridade]}
    </Selo>
  );
}

export function SeloDeStatus({ status }: { status: StatusDeChamado }) {
  return <Selo tom={TOM_DO_STATUS[status]}>{ROTULO_DO_STATUS[status]}</Selo>;
}
