import { formatarDiaDaConversa } from "@/lib/formatacao";

export function SeparadorDeDia({ criadaEm }: { criadaEm: string }) {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-borda" />
      <span className="text-xs font-medium text-tinta-fraca">
        {formatarDiaDaConversa(new Date(criadaEm), new Date())}
      </span>
      <span className="h-px flex-1 bg-borda" />
    </div>
  );
}
