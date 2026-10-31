import { CONFIANCA_MINIMA_PARA_AGIR } from "@/domain/types";

export function MedidorDeConfianca({ valor }: { valor: number }) {
  const porcentagem = Math.round(valor * 100);
  const suficiente = valor >= CONFIANCA_MINIMA_PARA_AGIR;

  return (
    <div className="flex items-center gap-3">
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentagem}
        aria-label="Grau de segurança da decisão"
        className="relative h-1.5 w-32 overflow-hidden rounded-full bg-borda"
      >
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${suficiente ? "bg-resolvido" : "bg-alta"}`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${suficiente ? "text-resolvido" : "text-alta"}`}
      >
        {porcentagem}%
      </span>
    </div>
  );
}
