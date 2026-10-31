"use client";

import { CornerDownLeft } from "lucide-react";
import { Botao } from "@/components/atoms/Botao";
import { Selo, SeloDePrioridade } from "@/components/atoms/Selo";
import { CampoDoCartao, Cartao } from "@/components/molecules/Cartao";
import { ROTULO_DO_IMPACTO, ROTULO_DO_TIPO } from "@/domain/rotulos";
import type { PropostaRegistrada } from "@/domain/types";
import { formatarDataHoraCurta } from "@/lib/formatacao";

export type AcoesSobreORascunho = {
  ocupado: boolean;
  erro: string | null;
  aoConfirmar: () => void;
  aoEditar: () => void;
  aoCancelar: () => void;
};

type Props = {
  proposta: PropostaRegistrada;
  acoes?: AcoesSobreORascunho;
};

function SeloDaSituacao({ proposta }: { proposta: PropostaRegistrada }) {
  switch (proposta.situacao) {
    case "pendente":
      return <Selo tom="alta">Aguardando confirmação</Selo>;
    case "confirmada":
      return <Selo tom="resolvido">{proposta.codigoDoChamado}</Selo>;
    case "cancelada":
      return <Selo tom="neutro">Descartado</Selo>;
  }
}

function cabecalhoDa(proposta: PropostaRegistrada) {
  if (proposta.tipo === "criar") return "Novo chamado · Rascunho";
  return proposta.reabrir
    ? `Reabertura do ${proposta.codigo}`
    : `Atualização do ${proposta.codigo}`;
}

export function CartaoDeRascunho({ proposta, acoes }: Props) {
  const pendente = proposta.situacao === "pendente" && acoes !== undefined;

  return (
    <Cartao
      cabecalho={cabecalhoDa(proposta)}
      selo={<SeloDaSituacao proposta={proposta} />}
      rodape={
        pendente && acoes !== undefined ? (
          <>
            <Botao onClick={acoes.aoConfirmar} carregando={acoes.ocupado}>
              {acoes.ocupado ? "Confirmando..." : "Confirmar"}
              {!acoes.ocupado && (
                <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Botao>
            <Botao
              variante="secundario"
              onClick={acoes.aoEditar}
              disabled={acoes.ocupado}
            >
              Editar
            </Botao>
            <Botao
              variante="fantasma"
              onClick={acoes.aoCancelar}
              disabled={acoes.ocupado}
            >
              Cancelar
            </Botao>
            {acoes.erro !== null && (
              <p role="alert" className="w-full text-sm text-critica-texto">
                {acoes.erro}
              </p>
            )}
          </>
        ) : undefined
      }
    >
      {proposta.tipo === "criar" ? (
        <>
          <h3 className="font-semibold text-tinta">
            {proposta.rascunho.titulo}
          </h3>
          <p className="text-sm text-tinta-media">
            {proposta.rascunho.descricao}
          </p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CampoDoCartao rotulo="Tipo">
              {ROTULO_DO_TIPO[proposta.rascunho.tipo]}
            </CampoDoCartao>
            <CampoDoCartao rotulo="Categoria">
              {proposta.rascunho.categoria}
            </CampoDoCartao>
            <CampoDoCartao rotulo="Prioridade">
              <SeloDePrioridade prioridade={proposta.rascunho.prioridade} />
              <span className="block text-xs text-tinta-fraca">
                resposta até{" "}
                {formatarDataHoraCurta(new Date(proposta.prazoDeResposta))}
              </span>
            </CampoDoCartao>
            <CampoDoCartao rotulo="Afetados">
              {ROTULO_DO_IMPACTO[proposta.rascunho.afetados]}
            </CampoDoCartao>
          </dl>
        </>
      ) : (
        <p className="text-sm text-tinta">{proposta.texto}</p>
      )}
    </Cartao>
  );
}
