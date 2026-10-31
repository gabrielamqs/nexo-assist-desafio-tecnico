import type {
  Intencao,
  Mensagem,
  RascunhoCompleto,
  Usuario,
} from "@/domain/types";

export const FERRAMENTAS_DO_ASSISTENTE = {
  consultarChamados: "consultar_chamados",
  consultarChamado: "consultar_chamado",
  buscarCentralDeAjuda: "buscar_central_ajuda",
  proporChamado: "propor_chamado",
  proporAtualizacao: "propor_atualizacao",
} as const;

export type NomeDaFerramentaDoAssistente =
  (typeof FERRAMENTAS_DO_ASSISTENTE)[keyof typeof FERRAMENTAS_DO_ASSISTENTE];

export type ChamadaDeFerramenta = {
  ferramenta: NomeDaFerramentaDoAssistente;
  entrada: Record<string, unknown>;
  saida: unknown;
  sucesso: boolean;
};

export type ResultadoDaPropostaDeChamado =
  | { completo: false; camposFaltando: string[]; orientacao: string }
  | { completo: true; rascunho: RascunhoCompleto; prazoDeResposta: string };

export type ResultadoDaPropostaDeAtualizacao =
  | { permitido: false; motivo: string }
  | { permitido: true; codigo: string; texto: string; reabrir: boolean };

export type EntradaDoAssistente = {
  funcionario: Usuario;
  historico: Mensagem[];
  agora: Date;
};

export type SaidaDoAssistente = {
  resposta: string;
  entendimento: string;
  intencao: Intencao;
  confianca: number;
  justificativa: string;
  opcoesRapidas: string[];
  chamadasDeFerramenta: ChamadaDeFerramenta[];
};

export type AcompanhamentoDaResposta = {
  aoUsarFerramenta?: (chamada: ChamadaDeFerramenta) => void;
  aoAtualizarResposta?: (respostaParcial: string) => void;
};

export type Assistente = {
  responder(
    entrada: EntradaDoAssistente,
    acompanhamento?: AcompanhamentoDaResposta,
  ): Promise<SaidaDoAssistente>;
};

export class AssistenteIndisponivelError extends Error {
  constructor(causa: unknown) {
    super("O assistente não conseguiu responder agora.", { cause: causa });
    this.name = "AssistenteIndisponivelError";
  }
}
