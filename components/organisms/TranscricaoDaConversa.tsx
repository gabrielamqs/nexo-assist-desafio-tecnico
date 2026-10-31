import { BolhaDoFuncionario } from "@/components/molecules/BolhaDoFuncionario";
import { MarcoDaConversa } from "@/components/molecules/MarcoDaConversa";
import { RolarParaOFim } from "@/components/molecules/RolarParaOFim";
import type { MensagemNaTela } from "@/lib/mensagem-na-tela";
import {
  MensagemDoAnalista,
  MensagemDoAssistente,
} from "./MensagemDoAssistente";

export function TranscricaoDaConversa({
  mensagens,
}: {
  mensagens: MensagemNaTela[];
}) {
  if (mensagens.length === 0) {
    return (
      <p className="px-6 py-8 text-sm text-tinta-fraca">
        Esta conversa ainda não tem mensagens.
      </p>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      {mensagens.map((mensagem) => {
        switch (mensagem.autor) {
          case "funcionario":
            return (
              <BolhaDoFuncionario key={mensagem.id} texto={mensagem.conteudo} />
            );
          case "analista":
            return <MensagemDoAnalista key={mensagem.id} mensagem={mensagem} />;
          case "sistema":
            return (
              <MarcoDaConversa
                key={mensagem.id}
                texto={mensagem.conteudo}
                criadaEm={mensagem.criadaEm}
              />
            );
          case "agent":
            return (
              <MensagemDoAssistente key={mensagem.id} mensagem={mensagem} />
            );
        }
      })}
      <RolarParaOFim gatilho={mensagens.at(-1)?.id ?? ""} />
    </div>
  );
}
