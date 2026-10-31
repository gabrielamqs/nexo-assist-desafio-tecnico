import type {
  AutorDeMensagem,
  Conversa,
  DecisaoDoAgent,
  Mensagem,
} from "@/domain/types";

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
};
