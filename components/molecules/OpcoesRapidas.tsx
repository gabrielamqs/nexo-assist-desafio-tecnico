import { Botao } from "@/components/atoms/Botao";

type Props = {
  opcoes: string[];
  aoEscolher: (opcao: string) => void;
};

export function OpcoesRapidas({ opcoes, aoEscolher }: Props) {
  if (opcoes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Respostas rápidas">
      {opcoes.map((opcao) => (
        <Botao
          key={opcao}
          variante="secundario"
          tamanho="compacto"
          onClick={() => aoEscolher(opcao)}
        >
          {opcao}
        </Botao>
      ))}
    </div>
  );
}
