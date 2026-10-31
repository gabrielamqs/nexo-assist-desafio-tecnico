import { carregarConversa } from "@/application/usecases/carregar-conversa";
import { ConversaComAssistente } from "@/components/organisms/ConversaComAssistente";
import { LayoutDoAtendimento } from "@/components/templates/LayoutDoAtendimento";
import { repositorioDeConversas } from "@/infrastructure/dependencias";
import { paraMensagemNaTela } from "@/lib/mensagem-na-tela";
import { exigirUsuario } from "@/lib/sessao-servidor";

export const instant = false;

export default async function PaginaDoChat() {
  const funcionario = await exigirUsuario("funcionario");
  const { conversa, mensagens, mensagensEnviadas } = await carregarConversa(
    { conversas: repositorioDeConversas() },
    funcionario,
  );

  return (
    <LayoutDoAtendimento usuario={funcionario}>
      <ConversaComAssistente
        key={`${funcionario.id}:${conversa?.id ?? "nova"}`}
        primeiroNome={funcionario.nome.split(" ")[0] ?? funcionario.nome}
        mensagensIniciais={mensagens.map(paraMensagemNaTela)}
        mensagensEnviadasIniciais={mensagensEnviadas}
        comAnalistaInicial={
          conversa !== null && conversa.estado !== "com_agent"
        }
      />
    </LayoutDoAtendimento>
  );
}
