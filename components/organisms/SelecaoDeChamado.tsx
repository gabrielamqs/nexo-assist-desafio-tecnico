import { SeloDeStatus } from "@/components/atoms/Selo";
import type { ResumoDeChamado } from "@/domain/types";
import { formatarDiaCurto } from "@/lib/formatacao";

type Props = {
  chamados: ResumoDeChamado[];
  ativa: boolean;
  aoEscolher: (texto: string) => void;
};

export function SelecaoDeChamado({ chamados, ativa, aoEscolher }: Props) {
  return (
    <ul
      aria-label="Escolha um chamado"
      className="divide-y divide-borda overflow-hidden rounded-xl border border-borda bg-superficie"
    >
      {chamados.map((chamado) => (
        <li key={chamado.codigo}>
          <button
            type="button"
            disabled={!ativa}
            onClick={() => aoEscolher(`${chamado.codigo} · ${chamado.titulo}`)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors enabled:hover:bg-primario-suave disabled:cursor-default"
          >
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-tinta-fraca"
            />
            <span className="w-20 shrink-0 font-mono text-xs text-tinta-fraca">
              {chamado.codigo}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-tinta">
              {chamado.titulo}
            </span>
            <SeloDeStatus status={chamado.status} />
            <span className="hidden w-12 shrink-0 text-right text-xs text-tinta-fraca sm:block">
              {formatarDiaCurto(new Date(chamado.atualizadoEm))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
