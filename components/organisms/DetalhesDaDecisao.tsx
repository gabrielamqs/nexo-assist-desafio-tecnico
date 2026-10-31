import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { MedidorDeConfianca } from "@/components/atoms/MedidorDeConfianca";
import {
  ROTULO_DA_INTENCAO,
  ROTULO_DO_MOTIVO_DE_TRANSFERENCIA,
} from "@/domain/rotulos";
import {
  CONFIANCA_MINIMA_PARA_AGIR,
  type DecisaoDoAgent,
} from "@/domain/types";

const MINIMO = `${Math.round(CONFIANCA_MINIMA_PARA_AGIR * 100)}%`;

function Item({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-4 sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-tinta-fraca uppercase sm:pt-0.5">
        {rotulo}
      </dt>
      <dd className="text-sm text-tinta sm:col-span-3">{children}</dd>
    </div>
  );
}

export function DetalhesDaDecisao({ decisao }: { decisao: DecisaoDoAgent }) {
  const {
    entendimento,
    intencao,
    confianca,
    justificativa,
    acoes,
    artigosConsultados,
    transferencia,
  } = decisao;

  return (
    <dl
      aria-label="Como o Nexo Assist decidiu"
      className="space-y-3 rounded-xl border border-borda bg-superficie-baixa p-4"
    >
      <Item rotulo="O que entendi">{entendimento || "Não registrado."}</Item>

      <Item rotulo="Decisão">{ROTULO_DA_INTENCAO[intencao]}</Item>

      <Item rotulo="Segurança">
        <MedidorDeConfianca valor={confianca} />
        <p className="mt-1 text-xs text-tinta-media">
          {confianca >= CONFIANCA_MINIMA_PARA_AGIR
            ? `Acima do mínimo de ${MINIMO} para seguir sem um analista.`
            : `Abaixo do mínimo de ${MINIMO}: o caso deve ir para um analista.`}
        </p>
      </Item>

      <Item rotulo="Por quê">{justificativa || "Não registrado."}</Item>

      <Item rotulo="O que fiz">
        {acoes.length === 0 ? (
          <span className="text-tinta-media">
            Respondi sem consultar nenhum sistema.
          </span>
        ) : (
          <ol className="space-y-1.5">
            {acoes.map((acao, indice) => (
              <li key={`${acao.tipo}-${indice}`} className="flex gap-2">
                {acao.sucesso ? (
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-resolvido"
                    aria-label="feito"
                  />
                ) : (
                  <X
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-critica"
                    aria-label="falhou"
                  />
                )}
                <span>
                  <span className={acao.sucesso ? "" : "text-critica"}>
                    {acao.descricao}
                  </span>
                  {acao.detalhe !== undefined && (
                    <span className="block text-xs text-tinta-media">
                      {acao.detalhe}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Item>

      {artigosConsultados.length > 0 && (
        <Item rotulo="Fontes">
          <ul className="space-y-0.5">
            {artigosConsultados.map((artigo) => (
              <li key={artigo.id}>Central de ajuda: {artigo.titulo}</li>
            ))}
          </ul>
        </Item>
      )}

      {transferencia.recomendada && transferencia.motivo !== null && (
        <Item rotulo="Analista">
          <span className="text-alta">
            Recomendado:{" "}
            {ROTULO_DO_MOTIVO_DE_TRANSFERENCIA[transferencia.motivo]}.
          </span>
        </Item>
      )}
    </dl>
  );
}
