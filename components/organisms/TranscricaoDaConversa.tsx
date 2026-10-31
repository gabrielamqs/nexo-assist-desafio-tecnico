import { Fragment } from "react";
import { BolhaDoFuncionario } from "@/components/molecules/BolhaDoFuncionario";
import { MarcoDaConversa } from "@/components/molecules/MarcoDaConversa";
import { RolarParaOFim } from "@/components/molecules/RolarParaOFim";
import { SeparadorDeDia } from "@/components/molecules/SeparadorDeDia";
import { mudouDeDia, type MensagemNaTela } from "@/lib/mensagem-na-tela";
import {
  MensagemDoAnalista,
  MensagemDoAssistente,
} from "./MensagemDoAssistente";

function conteudoDaMensagem(mensagem: MensagemNaTela) {
  switch (mensagem.autor) {
    case "funcionario":
      return <BolhaDoFuncionario texto={mensagem.conteudo} />;
    case "analista":
      return <MensagemDoAnalista mensagem={mensagem} />;
    case "sistema":
      return (
        <MarcoDaConversa
          texto={mensagem.conteudo}
          criadaEm={mensagem.criadaEm}
        />
      );
    case "agent":
      return <MensagemDoAssistente mensagem={mensagem} />;
  }
}

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
      {mensagens.map((mensagem, indice) => (
        <Fragment key={mensagem.id}>
          {mudouDeDia(mensagens[indice - 1], mensagem) && (
            <SeparadorDeDia criadaEm={mensagem.criadaEm} />
          )}
          {conteudoDaMensagem(mensagem)}
        </Fragment>
      ))}
      <RolarParaOFim gatilho={mensagens.at(-1)?.id ?? ""} />
    </div>
  );
}
