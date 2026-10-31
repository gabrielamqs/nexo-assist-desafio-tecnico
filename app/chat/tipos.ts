import type { EstadoDaConversa } from "@/domain/types";
import type { MensagemNaTela } from "@/lib/mensagem-na-tela";

export type NovidadesDoChat = {
  estado: EstadoDaConversa;
  mensagens: MensagemNaTela[];
  mensagensEnviadas: number;
};

export type ResultadoDaAcaoNoRascunho =
  | {
      ok: true;
      mensagemAtualizada: MensagemNaTela;
      novaMensagem: MensagemNaTela;
    }
  | { ok: false; erro: string };
