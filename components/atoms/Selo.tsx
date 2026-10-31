import type { ReactNode } from "react";
import {
  ROTULO_DA_PRIORIDADE,
  ROTULO_DO_ESTADO_DA_CONVERSA,
  ROTULO_DO_STATUS,
} from "@/domain/rotulos";
import type {
  EstadoDaConversa,
  Prioridade,
  StatusDeChamado,
} from "@/domain/types";

export type TomDoSelo =
  "critica" | "alta" | "media" | "baixa" | "resolvido" | "primario" | "neutro";

const TEXTO_POR_TOM: Record<TomDoSelo, string> = {
  critica: "text-critica-texto",
  alta: "text-alta-texto",
  media: "text-tinta-media",
  baixa: "text-primario-texto",
  resolvido: "text-resolvido-texto",
  primario: "text-primario-texto",
  neutro: "text-tinta-fraca",
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
  critica: "bg-critica-suave",
  alta: "bg-alta-suave",
  media: "bg-superficie-baixa",
  baixa: "bg-primario-suave",
  resolvido: "bg-resolvido-suave",
  primario: "bg-primario-suave",
  neutro: "bg-superficie-baixa",
};

type Props = {
  tom: TomDoSelo;
  forma?: "ponto" | "pilula";
  children: ReactNode;
};

export function Selo({ tom, forma = "ponto", children }: Props) {
  const formato =
    forma === "pilula" ? `rounded-full px-2.5 py-1 ${FUNDO_POR_TOM[tom]}` : "";

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

const TOM_DO_ESTADO_DA_CONVERSA: Record<EstadoDaConversa, TomDoSelo> = {
  com_agent: "neutro",
  aguardando_analista: "alta",
  com_analista: "primario",
  encerrada: "resolvido",
};

export function SeloDeEstadoDaConversa({
  estado,
}: {
  estado: EstadoDaConversa;
}) {
  return (
    <Selo tom={TOM_DO_ESTADO_DA_CONVERSA[estado]}>
      {ROTULO_DO_ESTADO_DA_CONVERSA[estado]}
    </Selo>
  );
}

export function SeloDoAtendimento({
  estado,
}: {
  estado: EstadoDaConversa | null;
}) {
  if (estado === null || estado === "com_agent") {
    return (
      <Selo tom="resolvido" forma="pilula">
        Assistente online
      </Selo>
    );
  }
  return <SeloDeEstadoDaConversa estado={estado} />;
}
