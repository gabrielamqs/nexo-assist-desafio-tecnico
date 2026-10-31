"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { AcoesDoAgent } from "@/components/molecules/AcoesDoAgent";
import { OpcoesRapidas } from "@/components/molecules/OpcoesRapidas";
import type { AcaoDoAgent, DecisaoDoAgent } from "@/domain/types";
import { formatarHora } from "@/lib/formatacao";
import type { MensagemNaTela } from "@/lib/mensagem-na-tela";
import { CartaoDeChamado } from "./CartaoDeChamado";
import { CartaoDeRascunho, type AcoesSobreORascunho } from "./CartaoDeRascunho";
import { DetalhesDaDecisao } from "./DetalhesDaDecisao";
import { SelecaoDeChamado } from "./SelecaoDeChamado";

export type VarianteDaMensagem = "chat" | "console";

type Props = {
  mensagem: MensagemNaTela;
  variante?: VarianteDaMensagem;
  ehAUltima?: boolean;
  aoEnviar?: (texto: string) => void;
  rascunho?: AcoesSobreORascunho;
};

const BALAO_POR_VARIANTE: Record<VarianteDaMensagem, string> = {
  chat: "rounded-tl border border-borda bg-superficie",
  console: "sombra-de-controle rounded-tr bg-bolha-do-agent",
};

const balaoDa = (variante: VarianteDaMensagem) =>
  `max-w-xl rounded-xl px-4 py-3 text-sm whitespace-pre-line text-tinta ${BALAO_POR_VARIANTE[variante]}`;

function EtiquetaDeIA() {
  return (
    <span className="rounded bg-primario-suave px-1.5 py-0.5 text-xs font-semibold text-primario-texto">
      IA
    </span>
  );
}

function Cabecalho({
  criadaEm,
  acoes,
  emAndamento = false,
  variante = "chat",
  children,
}: {
  criadaEm?: string;
  acoes: AcaoDoAgent[];
  emAndamento?: boolean;
  variante?: VarianteDaMensagem;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm font-semibold text-tinta">Nexo Assist</span>
      {variante === "console" && <EtiquetaDeIA />}
      {criadaEm !== undefined && (
        <time dateTime={criadaEm} className="text-xs text-tinta-fraca">
          {formatarHora(new Date(criadaEm))}
        </time>
      )}
      <AcoesDoAgent acoes={acoes} emAndamento={emAndamento} />
      {children}
    </header>
  );
}

function chamadosParaEscolher(decisao: DecisaoDoAgent) {
  if (
    decisao.intencao !== "consultar_chamado" ||
    decisao.proposta !== null ||
    decisao.chamadoConsultado !== null
  ) {
    return [];
  }
  const emAberto = decisao.chamadosListados.filter(
    (chamado) => chamado.status !== "resolvido",
  );
  return emAberto.length > 1 ? emAberto : [];
}

export function MensagemDoAssistente({
  mensagem,
  variante = "chat",
  ehAUltima = false,
  aoEnviar,
  rascunho,
}: Props) {
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const idDosDetalhes = useId();
  const { decisao } = mensagem;

  const escolhas = decisao === null ? [] : chamadosParaEscolher(decisao);

  return (
    <article
      className={`flex flex-col gap-2 ${variante === "console" ? "items-end" : "items-start"}`}
    >
      <Cabecalho
        criadaEm={mensagem.criadaEm}
        acoes={decisao?.acoes ?? []}
        variante={variante}
      >
        {decisao !== null && (
          <button
            type="button"
            aria-expanded={detalhesAbertos}
            aria-controls={idDosDetalhes}
            onClick={() => setDetalhesAbertos((aberto) => !aberto)}
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-primario-texto hover:underline focus-visible:outline-2 focus-visible:outline-primario"
          >
            Como decidi
            <ChevronDown
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform ${detalhesAbertos ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </Cabecalho>

      {detalhesAbertos && decisao !== null && (
        <div id={idDosDetalhes} className="max-w-xl">
          <DetalhesDaDecisao decisao={decisao} />
        </div>
      )}

      <div className={balaoDa(variante)}>
        {mensagem.conteudo}
        {ehAUltima &&
          aoEnviar !== undefined &&
          decisao !== null &&
          escolhas.length === 0 && (
            <div className="mt-3 empty:hidden">
              <OpcoesRapidas
                opcoes={decisao.opcoesRapidas}
                aoEscolher={aoEnviar}
              />
            </div>
          )}
      </div>

      {escolhas.length > 0 && (
        <div>
          <SelecaoDeChamado
            chamados={escolhas}
            ativa={ehAUltima && aoEnviar !== undefined}
            aoEscolher={aoEnviar ?? (() => undefined)}
          />
        </div>
      )}

      {decisao?.proposta != null && (
        <div>
          <CartaoDeRascunho proposta={decisao.proposta} acoes={rascunho} />
        </div>
      )}

      {decisao?.proposta == null && decisao?.chamadoConsultado != null && (
        <div>
          <CartaoDeChamado chamado={decisao.chamadoConsultado} />
        </div>
      )}
    </article>
  );
}

export function MensagemEmAndamento({
  acoes,
  parcial,
}: {
  acoes: AcaoDoAgent[];
  parcial: string;
}) {
  return (
    <article className="space-y-2" aria-live="polite" aria-busy="true">
      <Cabecalho acoes={acoes} emAndamento />
      <div className={balaoDa("chat")}>
        {parcial === "" ? (
          <span className="inline-flex gap-1" aria-label="Escrevendo">
            {[0, 1, 2].map((ponto) => (
              <span
                key={ponto}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-tinta-fraca"
              />
            ))}
          </span>
        ) : (
          parcial
        )}
      </div>
    </article>
  );
}

export function MensagemDeBoasVindas({
  primeiroNome,
  sugestoes,
  aoEscolher,
}: {
  primeiroNome: string;
  sugestoes: string[];
  aoEscolher: (texto: string) => void;
}) {
  return (
    <article className="space-y-2">
      <Cabecalho acoes={[]} />
      <div className={balaoDa("chat")}>
        Olá, {primeiroNome}! Me conte o que está acontecendo, com as suas
        palavras. Eu consulto seus chamados, procuro na central de ajuda e chamo
        um analista quando for preciso.
        <div className="mt-3">
          <OpcoesRapidas opcoes={sugestoes} aoEscolher={aoEscolher} />
        </div>
      </div>
    </article>
  );
}

export function MensagemDoAnalista({
  mensagem,
  nome = "Analista de TI",
  variante = "chat",
}: {
  mensagem: MensagemNaTela;
  nome?: string;
  variante?: VarianteDaMensagem;
}) {
  return (
    <article
      className={`flex flex-col gap-2 ${variante === "console" ? "items-end" : "items-start"}`}
    >
      <header className="flex items-center gap-3">
        <span className="text-sm font-semibold text-tinta">{nome}</span>
        <time dateTime={mensagem.criadaEm} className="text-xs text-tinta-fraca">
          {formatarHora(new Date(mensagem.criadaEm))}
        </time>
      </header>
      <div
        className={`max-w-xl rounded-xl px-4 py-3 text-sm whitespace-pre-line text-tinta ${
          variante === "console"
            ? "rounded-tr bg-bolha-do-analista sombra-de-controle"
            : "rounded-tl border border-borda bg-superficie"
        }`}
      >
        {mensagem.conteudo}
      </div>
    </article>
  );
}
