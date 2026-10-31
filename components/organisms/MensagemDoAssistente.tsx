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

type Props = {
  mensagem: MensagemNaTela;
  ehAUltima?: boolean;
  aoEnviar?: (texto: string) => void;
  rascunho?: AcoesSobreORascunho;
};

function Cabecalho({
  criadaEm,
  acoes,
  emAndamento = false,
  children,
}: {
  criadaEm?: string;
  acoes: AcaoDoAgent[];
  emAndamento?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm font-semibold text-tinta">Nexo Assist</span>
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

const BALAO =
  "max-w-2xl rounded-2xl rounded-tl-sm border border-borda bg-superficie px-4 py-3 text-sm whitespace-pre-line text-tinta";

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
  ehAUltima = false,
  aoEnviar,
  rascunho,
}: Props) {
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const idDosDetalhes = useId();
  const { decisao } = mensagem;

  const escolhas = decisao === null ? [] : chamadosParaEscolher(decisao);

  return (
    <article className="space-y-2">
      <Cabecalho criadaEm={mensagem.criadaEm} acoes={decisao?.acoes ?? []}>
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
        <div id={idDosDetalhes} className="max-w-2xl">
          <DetalhesDaDecisao decisao={decisao} />
        </div>
      )}

      <div className={BALAO}>
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
        <div className="max-w-2xl">
          <SelecaoDeChamado
            chamados={escolhas}
            ativa={ehAUltima && aoEnviar !== undefined}
            aoEscolher={aoEnviar ?? (() => undefined)}
          />
        </div>
      )}

      {decisao?.proposta != null && (
        <div className="max-w-2xl">
          <CartaoDeRascunho proposta={decisao.proposta} acoes={rascunho} />
        </div>
      )}

      {decisao?.proposta == null && decisao?.chamadoConsultado != null && (
        <div className="max-w-2xl">
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
      <div className={BALAO}>
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
      <div className={BALAO}>
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

export function MensagemDoAnalista({ mensagem }: { mensagem: MensagemNaTela }) {
  return (
    <article className="space-y-2">
      <header className="flex items-center gap-3">
        <span className="text-sm font-semibold text-tinta">Analista de TI</span>
        <time dateTime={mensagem.criadaEm} className="text-xs text-tinta-fraca">
          {formatarHora(new Date(mensagem.criadaEm))}
        </time>
      </header>
      <div className={BALAO}>{mensagem.conteudo}</div>
    </article>
  );
}
