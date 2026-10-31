import { ArrowLeftRight } from "lucide-react";
import { formatarHora } from "@/lib/formatacao";

type Props = {
  texto: string;
  criadaEm: string;
};

export function MarcoDaConversa({ texto, criadaEm }: Props) {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-borda" />
      <span className="inline-flex items-center gap-1.5 text-xs text-tinta-media">
        <ArrowLeftRight className="h-3 w-3" aria-hidden="true" />
        {texto}
        <time dateTime={criadaEm} className="text-tinta-fraca">
          {formatarHora(new Date(criadaEm))}
        </time>
      </span>
      <span className="h-px flex-1 bg-borda" />
    </div>
  );
}
