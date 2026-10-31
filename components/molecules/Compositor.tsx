"use client";

import { ArrowUp } from "lucide-react";
import type { FormEvent, KeyboardEvent, RefObject } from "react";
import { Botao } from "@/components/atoms/Botao";

type Props = {
  valor: string;
  aoMudar: (valor: string) => void;
  aoEnviar: (texto: string) => void;
  desabilitado: boolean;
  aviso?: string;
  referencia?: RefObject<HTMLTextAreaElement | null>;
};

export function Compositor({
  valor,
  aoMudar,
  aoEnviar,
  desabilitado,
  aviso,
  referencia,
}: Props) {
  const podeEnviar = !desabilitado && valor.trim() !== "";

  function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    if (podeEnviar) aoEnviar(valor.trim());
  }

  function aoPressionarTecla(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      enviar();
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="flex items-end gap-2 rounded-xl border border-borda bg-superficie p-2 focus-within:border-primario"
    >
      <label htmlFor="mensagem" className="sr-only">
        Mensagem para o Nexo Assist
      </label>
      <textarea
        id="mensagem"
        ref={referencia}
        rows={1}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        onKeyDown={aoPressionarTecla}
        disabled={desabilitado}
        placeholder={aviso ?? "Escreva para o Nexo..."}
        className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-tinta outline-none placeholder:text-tinta-fraca disabled:cursor-not-allowed"
      />
      <Botao type="submit" disabled={!podeEnviar}>
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
        Enviar
      </Botao>
    </form>
  );
}
