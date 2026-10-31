import { z } from "zod";
import { INTENCOES } from "@/domain/types";

export const MAXIMO_DE_OPCOES_RAPIDAS = 4;

export const ESQUEMA_DA_SAIDA = z.object({
  resposta: z.string().min(1),
  entendimento: z.string().catch(""),
  intencao: z.enum(INTENCOES).catch("conversa"),
  confianca: z.number().catch(0),
  justificativa: z.string().catch(""),
  opcoesRapidas: z.array(z.string()).catch([]),
});

export type SaidaEstruturada = z.infer<typeof ESQUEMA_DA_SAIDA>;

export const INSTRUCOES_DA_SAIDA = `Depois de usar as ferramentas que precisar, termine com um único objeto JSON, sem markdown e sem texto fora dele, com os campos:
- "resposta": o que dizer à pessoa;
- "entendimento": o que a pessoa quer, em uma frase;
- "intencao": uma de ${INTENCOES.map((intencao) => `"${intencao}"`).join(", ")};
- "confianca": número de 0 a 1;
- "justificativa": por que essa ação, citando a regra ou o dado usado, em palavras simples e sem nomes de ferramentas;
- "opcoesRapidas": até ${MAXIMO_DE_OPCOES_RAPIDAS} respostas curtas que a pessoa pode tocar, ou lista vazia.`;

export const normalizarSaida = (saida: SaidaEstruturada): SaidaEstruturada => ({
  ...saida,
  confianca: Math.min(Math.max(saida.confianca, 0), 1),
  opcoesRapidas: saida.opcoesRapidas
    .map((opcao) => opcao.trim())
    .filter((opcao) => opcao !== "")
    .slice(0, MAXIMO_DE_OPCOES_RAPIDAS),
});
