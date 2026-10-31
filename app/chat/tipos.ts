import type { MensagemNaTela } from "@/lib/mensagem-na-tela";

export type ResultadoDaAcaoNoRascunho =
  | {
      ok: true;
      mensagemAtualizada: MensagemNaTela;
      novaMensagem: MensagemNaTela;
    }
  | { ok: false; erro: string };
