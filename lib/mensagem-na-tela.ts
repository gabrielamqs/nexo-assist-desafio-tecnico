import type {
  AcaoDoAgent,
  AutorDeMensagem,
  DecisaoDoAgent,
  Mensagem,
} from "@/domain/types";

export type MensagemNaTela = {
  id: string;
  autor: AutorDeMensagem;
  conteudo: string;
  criadaEm: string;
  decisao: DecisaoDoAgent | null;
};

const normalizarDecisao = (decisao: DecisaoDoAgent): DecisaoDoAgent => ({
  ...decisao,
  chamadosListados: decisao.chamadosListados ?? [],
  chamadoConsultado: decisao.chamadoConsultado ?? null,
  artigosConsultados: decisao.artigosConsultados ?? [],
});

export const paraMensagemNaTela = (mensagem: Mensagem): MensagemNaTela => ({
  id: mensagem.id,
  autor: mensagem.autor,
  conteudo: mensagem.conteudo,
  criadaEm: mensagem.criadaEm.toISOString(),
  decisao:
    mensagem.decisao === null ? null : normalizarDecisao(mensagem.decisao),
});

export type EventoDoChat =
  | { tipo: "acao"; acao: AcaoDoAgent }
  | { tipo: "parcial"; texto: string }
  | {
      tipo: "respondida";
      mensagemDoFuncionario: MensagemNaTela;
      resposta: MensagemNaTela;
      mensagensEnviadas: number;
    }
  | {
      tipo: "com_analista";
      mensagemDoFuncionario: MensagemNaTela;
      mensagensEnviadas: number;
    }
  | { tipo: "limite" }
  | { tipo: "erro"; mensagem: string };

export async function* lerEventosDoChat(
  corpo: ReadableStream<Uint8Array>,
): AsyncGenerator<EventoDoChat> {
  const leitor = corpo.getReader();
  const decodificador = new TextDecoder();
  let pendente = "";

  while (true) {
    const { value, done } = await leitor.read();
    if (done) break;

    pendente += decodificador.decode(value, { stream: true });
    const linhas = pendente.split("\n");
    pendente = linhas.pop() ?? "";

    for (const linha of linhas) {
      if (linha.trim() !== "") yield JSON.parse(linha) as EventoDoChat;
    }
  }

  if (pendente.trim() !== "") yield JSON.parse(pendente) as EventoDoChat;
}
