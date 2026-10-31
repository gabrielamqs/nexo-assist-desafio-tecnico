import { carregarConversa } from "@/application/usecases/carregar-conversa";
import { SeloDoAtendimento } from "@/components/atoms/Selo";
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
    <LayoutDoAtendimento
      usuario={funcionario}
      secao="Atendimento"
      selo={<SeloDoAtendimento estado={conversa?.estado ?? null} />}
    >
      <ConversaComAssistente
        key={`${funcionario.id}:${conversa?.id ?? "nova"}`}
        primeiroNome={funcionario.nome.split(" ")[0] ?? funcionario.nome}
        conversaIdInicial={conversa?.id ?? null}
        estadoInicial={conversa?.estado ?? null}
        mensagensIniciais={mensagens.map(paraMensagemNaTela)}
        mensagensEnviadasIniciais={mensagensEnviadas}
      />
    </LayoutDoAtendimento>
  );
}
