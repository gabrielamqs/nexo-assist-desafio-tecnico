import type { Papel } from "@/domain/types";

export const ROTA_DE_LOGIN = "/login";

export const ROTA_INICIAL_POR_PAPEL: Record<Papel, string> = {
  funcionario: "/chat",
  analista: "/analista",
};

export const rotaInicialPara = (papel: Papel) => ROTA_INICIAL_POR_PAPEL[papel];

export const SECOES_DO_FUNCIONARIO = [
  { rotulo: "Atendimento", rota: "/chat" },
  { rotulo: "Meu perfil", rota: "/perfil" },
] as const;

export type SecaoDoFuncionario =
  (typeof SECOES_DO_FUNCIONARIO)[number]["rotulo"];
