"use server";

import { revalidatePath } from "next/cache";
import {
  ConversaIndisponivelError,
  assumirAtendimento,
  devolverAoAgent,
  encerrarAtendimento,
  responderComoAnalista,
} from "@/application/usecases/console-do-analista";
import { repositorioDeConversas } from "@/infrastructure/dependencias";
import { exigirUsuario } from "@/lib/sessao-servidor";
import type { EstadoDaAcaoDoAnalista } from "./estado";

const ROTA_DO_CONSOLE = "/analista";

async function executar(
  acao: (analista: Awaited<ReturnType<typeof exigirUsuario>>) => Promise<void>,
): Promise<EstadoDaAcaoDoAnalista> {
  const analista = await exigirUsuario("analista");

  try {
    await acao(analista);
    revalidatePath(ROTA_DO_CONSOLE);
    return { erro: null };
  } catch (erro) {
    if (erro instanceof ConversaIndisponivelError) {
      return { erro: erro.message };
    }
    console.error(erro);
    return { erro: "Não consegui concluir agora. Tente de novo em instantes." };
  }
}

export async function assumir(conversaId: string) {
  return executar(async (analista) => {
    await assumirAtendimento(
      { conversas: repositorioDeConversas() },
      { analista, conversaId },
    );
  });
}

export async function devolver(conversaId: string) {
  return executar(async (analista) => {
    await devolverAoAgent(
      { conversas: repositorioDeConversas() },
      { analista, conversaId },
    );
  });
}

export async function encerrar(conversaId: string) {
  return executar(async (analista) => {
    await encerrarAtendimento(
      { conversas: repositorioDeConversas() },
      { analista, conversaId },
    );
  });
}

export async function responder(
  _estadoAnterior: EstadoDaAcaoDoAnalista,
  dados: FormData,
): Promise<EstadoDaAcaoDoAnalista> {
  const conversaId = String(dados.get("conversaId") ?? "");
  const texto = String(dados.get("texto") ?? "");

  return executar(async (analista) => {
    await responderComoAnalista(
      { conversas: repositorioDeConversas() },
      { analista, conversaId, texto },
    );
  });
}
