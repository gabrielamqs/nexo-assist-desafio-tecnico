import { SimboloNexo } from "./SimboloNexo";

const MEDIDA_DA_MARCA = { normal: "h-5 w-5", grande: "h-6 w-6" } as const;
const MEDIDA_DO_NOME = { normal: "text-base", grande: "text-lg" } as const;

type Props = {
  tom?: "claro" | "escuro";
  tamanho?: keyof typeof MEDIDA_DA_MARCA;
};

export function MarcaNexoAssist({ tom = "escuro", tamanho = "normal" }: Props) {
  const cor = tom === "claro" ? "text-tinta-invertida" : "text-tinta";
  const corDaMarca = tom === "claro" ? "text-tinta-invertida" : "text-primario";

  return (
    <span className={`inline-flex items-center gap-2.5 ${cor}`}>
      <SimboloNexo className={`${MEDIDA_DA_MARCA[tamanho]} ${corDaMarca}`} />
      <span className={`${MEDIDA_DO_NOME[tamanho]} font-bold tracking-tight`}>
        Nexo Assist
      </span>
    </span>
  );
}
