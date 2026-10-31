import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type {
  Conversa,
  EstadoDaConversa,
  Mensagem,
  Usuario,
} from "@/domain/types";

export type ConversaCarregada = {
  conversa: Conversa | null;
  mensagens: Mensagem[];
  mensagensEnviadas: number;
};

export async function carregarConversa(
  { conversas }: { conversas: RepositorioDeConversas },
  funcionario: Usuario,
): Promise<ConversaCarregada> {
  const conversa = await conversas.buscarAtiva(funcionario.id);
  if (conversa === null) {
    return { conversa: null, mensagens: [], mensagensEnviadas: 0 };
  }

  const [mensagens, mensagensEnviadas] = await Promise.all([
    conversas.listarMensagens(conversa.id),
    conversas.contarMensagens(conversa.id, "funcionario"),
  ]);

  return { conversa, mensagens, mensagensEnviadas };
}

export type PedidoDeNovidades = {
  conversaId: string;
  desdeMensagemId: string | null;
};

export type NovidadesDaConversa = {
  estado: EstadoDaConversa;
  mensagens: Mensagem[];
  mensagensEnviadas: number;
};

const depoisDe = (mensagens: Mensagem[], id: string | null) => {
  if (id === null) return mensagens;
  const indice = mensagens.findIndex((mensagem) => mensagem.id === id);
  return indice === -1 ? mensagens : mensagens.slice(indice + 1);
};

export async function novidadesDaConversa(
  { conversas }: { conversas: RepositorioDeConversas },
  funcionario: Usuario,
  { conversaId, desdeMensagemId }: PedidoDeNovidades,
): Promise<NovidadesDaConversa | null> {
  const conversa = await conversas.buscarPorId(conversaId);
  if (conversa === null || conversa.funcionarioId !== funcionario.id) {
    return null;
  }

  const [mensagens, mensagensEnviadas] = await Promise.all([
    conversas.listarMensagens(conversa.id),
    conversas.contarMensagens(conversa.id, "funcionario"),
  ]);

  return {
    estado: conversa.estado,
    mensagens: depoisDe(mensagens, desdeMensagemId),
    mensagensEnviadas,
  };
}
