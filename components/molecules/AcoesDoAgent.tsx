import { Check, LoaderCircle, X } from "lucide-react";
import type { AcaoDoAgent } from "@/domain/types";

type Props = {
  acoes: AcaoDoAgent[];
  emAndamento?: boolean;
};

export function AcoesDoAgent({ acoes, emAndamento = false }: Props) {
  if (acoes.length === 0 && !emAndamento) return null;

  return (
    <ul
      aria-label="Ações do Nexo Assist"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
    >
      {acoes.map((acao, indice) => (
        <li
          key={`${acao.tipo}-${indice}`}
          className={`inline-flex items-center gap-1 ${acao.sucesso ? "text-tinta-fraca" : "text-critica-texto"}`}
        >
          {acao.sucesso ? (
            <Check
              className="h-3 w-3 text-resolvido-texto"
              aria-hidden="true"
            />
          ) : (
            <X className="h-3 w-3" aria-hidden="true" />
          )}
          {acao.descricao}
        </li>
      ))}
      {emAndamento && (
        <li className="inline-flex items-center gap-1 text-tinta-fraca">
          <LoaderCircle className="h-3 w-3 animate-spin" aria-hidden="true" />
          pensando
        </li>
      )}
    </ul>
  );
}
