import type {
  AtualizacaoDeChamado,
  AutorDeMensagem,
  Chamado,
  Prioridade,
  StatusDeChamado,
} from "@/domain/types";

export type DadosDeNovoChamado = Pick<
  Chamado,
  | "tipo"
  | "titulo"
  | "descricao"
  | "categoria"
  | "prioridade"
  | "solicitanteId"
  | "afetados"
>;

export type DadosDeAtualizacao = {
  autor: AutorDeMensagem;
  texto: string;
  status?: StatusDeChamado;
  prioridade?: Prioridade;
};

export type RepositorioDeChamados = {
  listarPorSolicitante(solicitanteId: string): Promise<Chamado[]>;
  buscarPorCodigo(codigo: string): Promise<Chamado | null>;
  listarAtualizacoes(codigo: string): Promise<AtualizacaoDeChamado[]>;
  criar(dados: DadosDeNovoChamado): Promise<Chamado>;
  atualizar(codigo: string, dados: DadosDeAtualizacao): Promise<Chamado>;
  transferirParaAnalista(codigo: string, resumo: string): Promise<Chamado>;
};

export class ChamadoNaoEncontradoError extends Error {
  constructor(readonly codigo: string) {
    super(`Chamado ${codigo} não encontrado.`);
    this.name = "ChamadoNaoEncontradoError";
  }
}
