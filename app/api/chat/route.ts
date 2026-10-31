import { z } from "zod";
import { acoesDasFerramentas } from "@/application/acoes-do-agent";
import { AssistenteIndisponivelError } from "@/application/ports/assistente";
import { novidadesDaConversa } from "@/application/usecases/carregar-conversa";
import {
  LimiteDeMensagensAtingidoError,
  responderMensagem,
} from "@/application/usecases/responder-mensagem";
import type { NovidadesDoChat } from "@/app/chat/tipos";
import {
  assistente,
  repositorioDeChamados,
  repositorioDeConversas,
} from "@/infrastructure/dependencias";
import { paraMensagemNaTela, type EventoDoChat } from "@/lib/mensagem-na-tela";
import { usuarioAtual } from "@/lib/sessao-servidor";

const MAXIMO_DE_CARACTERES = 2000;

const corpoDaRequisicao = z.object({
  texto: z.string().trim().min(1).max(MAXIMO_DE_CARACTERES),
});

const MENSAGEM_DE_FALHA =
  "Não consegui responder agora. O serviço pode estar instável; tente de novo em instantes.";

export async function GET(requisicao: Request): Promise<Response> {
  const funcionario = await usuarioAtual();
  if (funcionario?.papel !== "funcionario") {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const parametros = new URL(requisicao.url).searchParams;
  const conversaId = parametros.get("conversa");
  if (conversaId === null) {
    return Response.json({ erro: "Conversa não informada." }, { status: 400 });
  }

  const novidades = await novidadesDaConversa(
    { conversas: repositorioDeConversas() },
    funcionario,
    { conversaId, desdeMensagemId: parametros.get("desde") },
  );

  if (novidades === null) {
    return Response.json({ erro: "Conversa não encontrada." }, { status: 404 });
  }

  const corpo: NovidadesDoChat = {
    estado: novidades.estado,
    mensagens: novidades.mensagens.map(paraMensagemNaTela),
    mensagensEnviadas: novidades.mensagensEnviadas,
  };

  return Response.json(corpo, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(requisicao: Request): Promise<Response> {
  const funcionario = await usuarioAtual();
  if (funcionario?.papel !== "funcionario") {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const corpo = corpoDaRequisicao.safeParse(
    await requisicao.json().catch(() => null),
  );
  if (!corpo.success) {
    return Response.json({ erro: "Mensagem inválida." }, { status: 400 });
  }

  const codificador = new TextEncoder();
  const conversas = repositorioDeConversas();

  const fluxo = new ReadableStream<Uint8Array>({
    async start(controle) {
      const enviar = (evento: EventoDoChat) =>
        controle.enqueue(codificador.encode(`${JSON.stringify(evento)}\n`));

      try {
        const resultado = await responderMensagem(
          {
            conversas,
            chamados: repositorioDeChamados(),
            assistente: assistente(),
          },
          { funcionario, texto: corpo.data.texto },
          {
            aoUsarFerramenta: (chamada) => {
              for (const acao of acoesDasFerramentas([chamada])) {
                enviar({ tipo: "acao", acao });
              }
            },
            aoAtualizarResposta: (texto) => enviar({ tipo: "parcial", texto }),
          },
        );

        const mensagensEnviadas = await conversas.contarMensagens(
          resultado.conversa.id,
          "funcionario",
        );
        const mensagemDoFuncionario = paraMensagemNaTela(
          resultado.mensagemDoFuncionario,
        );

        const conversaId = resultado.conversa.id;
        const estado = resultado.conversa.estado;

        enviar(
          resultado.situacao === "respondida"
            ? {
                tipo: "respondida",
                conversaId,
                estado,
                mensagemDoFuncionario,
                resposta: paraMensagemNaTela(resultado.resposta),
                mensagensEnviadas,
                transferencia:
                  resultado.transferencia === null
                    ? null
                    : paraMensagemNaTela(resultado.transferencia.aviso),
              }
            : {
                tipo: "com_analista",
                conversaId,
                estado,
                mensagemDoFuncionario,
                mensagensEnviadas,
              },
        );
      } catch (erro) {
        if (erro instanceof LimiteDeMensagensAtingidoError) {
          enviar({ tipo: "limite" });
        } else {
          if (!(erro instanceof AssistenteIndisponivelError)) {
            console.error(erro);
          }
          enviar({ tipo: "erro", mensagem: MENSAGEM_DE_FALHA });
        }
      } finally {
        controle.close();
      }
    },
  });

  return new Response(fluxo, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
