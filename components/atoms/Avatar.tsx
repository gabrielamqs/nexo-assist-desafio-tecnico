const iniciais = (nome: string) =>
  nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0] ?? "")
    .join("")
    .toUpperCase();

const TONS = [
  "bg-avatar-azul text-avatar-azul-texto",
  "bg-avatar-terra text-avatar-terra-texto",
  "bg-avatar-verde text-avatar-verde-texto",
] as const;

const MEDIDAS = {
  normal: "h-9 w-9 text-xs",
  grande: "h-11.5 w-11.5 text-sm",
} as const;

const tomDe = (nome: string) => {
  const soma = [...nome].reduce(
    (total, letra) => total + letra.charCodeAt(0),
    0,
  );
  return TONS[soma % TONS.length] ?? TONS[0];
};

type Props = {
  nome: string;
  tamanho?: keyof typeof MEDIDAS;
};

export function Avatar({ nome, tamanho = "normal" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${tomDe(nome)} ${MEDIDAS[tamanho]}`}
    >
      {iniciais(nome)}
    </span>
  );
}
