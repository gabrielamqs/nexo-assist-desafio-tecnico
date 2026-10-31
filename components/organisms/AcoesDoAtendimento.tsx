"use client";

import { CornerUpLeft, Headset, Send, SquareCheck } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { assumir, devolver, encerrar, responder } from "@/app/analista/acoes";
import { ESTADO_INICIAL_DA_ACAO } from "@/app/analista/estado";
import { Aviso } from "@/components/atoms/Aviso";
import { Botao } from "@/components/atoms/Botao";

type Props = {
  conversaId: string;
  primeiroNome: string;
  podeAssumir: boolean;
  podeDevolver: boolean;
  podeEncerrar: boolean;
  podeResponder: boolean;
  aguardando: boolean;
};

export function AcoesDoAtendimento({
  conversaId,
  primeiroNome,
  podeAssumir,
  podeDevolver,
  podeEncerrar,
  podeResponder,
  aguardando,
}: Props) {
  const [estadoDaResposta, enviarResposta, enviando] = useActionState(
    responder,
    ESTADO_INICIAL_DA_ACAO,
  );
  const [erroDaAcao, setErroDaAcao] = useState<string | null>(null);
  const [emAndamento, iniciar] = useTransition();

  const executar = (acao: (id: string) => Promise<{ erro: string | null }>) => {
    setErroDaAcao(null);
    iniciar(async () => {
      const { erro } = await acao(conversaId);
      setErroDaAcao(erro);
    });
  };

  const ocupado = emAndamento || enviando;
  const erro = erroDaAcao ?? estadoDaResposta.erro;

  return (
    <div className="space-y-3 border-t border-borda px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        {aguardando && (
          <p className="mr-auto text-sm text-tinta-media">
            {primeiroNome} espera um atendente · o Nexo Assist está pausado
          </p>
        )}
        {podeAssumir && (
          <Botao onClick={() => executar(assumir)} disabled={ocupado}>
            <Headset className="h-4 w-4" aria-hidden="true" />
            Assumir atendimento
          </Botao>
        )}
        {podeDevolver && (
          <Botao
            variante="secundario"
            onClick={() => executar(devolver)}
            disabled={ocupado}
          >
            <CornerUpLeft className="h-4 w-4" aria-hidden="true" />
            Devolver ao agent
          </Botao>
        )}
        {podeEncerrar && (
          <Botao
            variante="fantasma"
            onClick={() => executar(encerrar)}
            disabled={ocupado}
          >
            <SquareCheck className="h-4 w-4" aria-hidden="true" />
            Encerrar
          </Botao>
        )}
      </div>

      {erro !== null && <Aviso tipo="erro">{erro}</Aviso>}

      <form action={enviarResposta} className="flex items-end gap-2">
        <input type="hidden" name="conversaId" value={conversaId} />
        <label htmlFor="resposta" className="sr-only">
          Resposta para {primeiroNome}
        </label>
        <textarea
          id="resposta"
          name="texto"
          rows={1}
          disabled={!podeResponder || ocupado}
          placeholder={
            podeResponder
              ? `Responder para ${primeiroNome}...`
              : "Assuma o atendimento para responder"
          }
          className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-borda bg-superficie px-3 py-2.5 text-sm text-tinta outline-none placeholder:text-tinta-fraca focus:border-primario disabled:cursor-not-allowed disabled:bg-superficie-baixa"
        />
        <Botao type="submit" disabled={!podeResponder || ocupado}>
          <Send className="h-4 w-4" aria-hidden="true" />
          Enviar
        </Botao>
      </form>
    </div>
  );
}
