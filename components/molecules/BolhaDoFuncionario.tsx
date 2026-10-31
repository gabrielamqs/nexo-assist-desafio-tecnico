const POR_VARIANTE = {
  chat: "ml-auto rounded-br bg-superficie-escura text-tinta-invertida",
  console: "sombra-de-controle rounded-tl bg-superficie text-tinta",
} as const;

type Props = {
  texto: string;
  variante?: keyof typeof POR_VARIANTE;
};

export function BolhaDoFuncionario({ texto, variante = "chat" }: Props) {
  return (
    <p
      className={`w-fit max-w-lg rounded-xl px-4 py-2.5 text-sm whitespace-pre-line ${POR_VARIANTE[variante]}`}
    >
      {texto}
    </p>
  );
}
