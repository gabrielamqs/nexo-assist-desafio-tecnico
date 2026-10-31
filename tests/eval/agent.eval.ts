import { describe, expect, it } from "vitest";
import { CASOS_DE_AVALIACAO, CRITERIOS, type Criterio } from "./casos";
import { executarCaso, relatorio } from "./executar";

const casosDe = (criterio: Criterio) =>
  CASOS_DE_AVALIACAO.filter((caso) => caso.criterio === criterio);

for (const criterio of Object.values(CRITERIOS)) {
  describe(criterio, () => {
    for (const caso of casosDe(criterio)) {
      const rodar = caso.falhaConhecida === undefined ? it : it.fails;
      const aviso =
        caso.falhaConhecida === undefined
          ? ""
          : ` [falha conhecida: ${caso.falhaConhecida}]`;

      rodar(`${caso.id}: ${caso.objetivo}${aviso}`, async () => {
        const resultado = await executarCaso(caso);
        expect(resultado.falhas, relatorio(resultado)).toEqual([]);
      });
    }
  });
}
