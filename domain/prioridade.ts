import type { Impacto, Prioridade, Urgencia } from "./types";

export type ClassificacaoDeImpacto = {
  impacto: Impacto;
  urgencia: Urgencia;
};

const afetaMaisDeUmaPessoa = (impacto: Impacto) =>
  impacto === "empresa" || impacto === "equipe";

export function definirPrioridade({
  impacto,
  urgencia,
}: ClassificacaoDeImpacto): Prioridade {
  if (urgencia === "trabalho_parado") {
    return afetaMaisDeUmaPessoa(impacto) ? "critica" : "alta";
  }
  if (urgencia === "compromisso_no_dia") return "alta";
  if (urgencia === "ha_alternativa") return "media";
  return "baixa";
}
