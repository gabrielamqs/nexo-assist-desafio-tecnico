"use server";

import {
  PropostaIndisponivelError,
  cancelarProposta,
  confirmarProposta,
} from "@/application/usecases/confirmar-proposta";
import type { Mensagem } from "@/domain/types";
import {
  repositorioDeChamados,
  repositorioDeConversas,
} from "@/infrastructure/dependencias";
import { paraMensagemNaTela } from "@/lib/mensagem-na-tela";
import { exigirUsuario } from "@/lib/sessao-servidor";
import type { ResultadoDaAcaoNoRascunho } from "./tipos";

async function concluir(
  mensagemId: string,
  executar: () => Promise<Mensagem>,
): Promise<ResultadoDaAcaoNoRascunho> {
  try {
    const novaMensagem = await executar();
    const mensagemAtualizada =
      await repositorioDeConversas().buscarMensagem(mensagemId);

    if (mensagemAtualizada === null) throw new PropostaIndisponivelError();

    return {
      ok: true,
      mensagemAtualizada: paraMensagemNaTela(mensagemAtualizada),
      novaMensagem: paraMensagemNaTela(novaMensagem),
    };
  } catch (erro) {
    if (erro instanceof PropostaIndisponivelError) {
      return { ok: false, erro: erro.message };
    }
    console.error(erro);
    return {
      ok: false,
      erro: "O sistema de chamados não respondeu. Tente confirmar de novo em instantes.",
    };
  }
}

export async function confirmarRascunho(
  mensagemId: string,
): Promise<ResultadoDaAcaoNoRascunho> {
  const funcionario = await exigirUsuario("funcionario");

  return concluir(mensagemId, async () => {
    const { mensagem } = await confirmarProposta(
      {
        conversas: repositorioDeConversas(),
        chamados: repositorioDeChamados(),
      },
      { funcionario, mensagemId },
    );
    return mensagem;
  });
}

export async function cancelarRascunho(
  mensagemId: string,
): Promise<ResultadoDaAcaoNoRascunho> {
  const funcionario = await exigirUsuario("funcionario");

  return concluir(mensagemId, () =>
    cancelarProposta(
      { conversas: repositorioDeConversas() },
      { funcionario, mensagemId },
    ),
  );
}
