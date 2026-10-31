const iniciais = (nome: string) =>
  nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase();

type Props = {
  nome: string;
  tamanho?: "normal" | "compacto";
};

export function Avatar({ nome, tamanho = "normal" }: Props) {
  const medida = tamanho === "compacto" ? "h-8 w-8 text-xs" : "h-9 w-9 text-xs";

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-primario-suave font-semibold text-primario-texto ${medida}`}
    >
      {iniciais(nome)}
    </span>
  );
}
