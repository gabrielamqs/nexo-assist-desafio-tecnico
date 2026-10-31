import type { RepositorioDeConversas } from "@/application/ports/conversas";
import type { Conversa, Mensagem, Usuario } from "@/domain/types";

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
