import type {
  AutorDeMensagem,
  Conversa,
  DecisaoDoAgent,
  EstadoDaConversa,
  Mensagem,
  Usuario,
} from "@/domain/types";

export type ConversaNaFila = {
  conversa: Conversa;
  funcionario: Usuario;
  ultimaMensagem: Mensagem | null;
  mensagensDoFuncionario: number;
};

export type NovoEstadoDaConversa = {
  estado: EstadoDaConversa;
  analistaId: string | null;
};

export type NovaMensagem = Pick<
  Mensagem,
  "conversaId" | "autor" | "conteudo" | "decisao"
>;

export type RepositorioDeConversas = {
  buscarAtiva(funcionarioId: string): Promise<Conversa | null>;
  criar(funcionarioId: string): Promise<Conversa>;
  buscarPorId(id: string): Promise<Conversa | null>;
  listarMensagens(conversaId: string, limite?: number): Promise<Mensagem[]>;
  contarMensagens(conversaId: string, autor?: AutorDeMensagem): Promise<number>;
  buscarMensagem(id: string): Promise<Mensagem | null>;
  adicionarMensagem(dados: NovaMensagem): Promise<Mensagem>;
  atualizarDecisao(mensagemId: string, decisao: DecisaoDoAgent): Promise<void>;
  transferirParaAnalista(conversaId: string, resumo: string): Promise<Conversa>;
  mudarEstado(
    conversaId: string,
    novoEstado: NovoEstadoDaConversa,
  ): Promise<Conversa>;
  listarParaAnalista(): Promise<ConversaNaFila[]>;
};
