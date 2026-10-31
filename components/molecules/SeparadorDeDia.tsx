import { formatarDiaDaConversa } from "@/lib/formatacao";

type Props = {
  criadaEm: string;
  variante?: "chat" | "console";
};

export function SeparadorDeDia({ criadaEm, variante = "chat" }: Props) {
  const dia = formatarDiaDaConversa(new Date(criadaEm), new Date());

  if (variante === "console") {
    return (
      <div className="flex items-center justify-center" role="separator">
        <span className="rounded-full bg-superficie/80 px-3 py-1 text-xs font-medium text-tinta-fraca">
          {dia}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-borda" />
      <span className="text-xs font-medium text-tinta-fraca">{dia}</span>
      <span className="h-px flex-1 bg-borda" />
    </div>
  );
}
