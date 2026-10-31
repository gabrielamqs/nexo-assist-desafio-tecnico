"use client";

import { useEffect } from "react";
import { Botao } from "@/components/atoms/Botao";
import { Selo, SeloDePrioridade } from "@/components/atoms/Selo";
import {
  CampoDoCartao,
  Cartao,
  GradeDoCartao,
} from "@/components/molecules/Cartao";
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

function TeclaDeAtalho() {
  return (
    <kbd className="rounded bg-superficie/25 px-1.5 py-0.5 text-xs font-normal text-tinta-invertida">
      Ctrl ↵
    </kbd>
  );
}

export function CartaoDeRascunho({ proposta, acoes }: Props) {
  const pendente = proposta.situacao === "pendente" && acoes !== undefined;
  const confirmavel = pendente && acoes !== undefined && !acoes.ocupado;
  const confirmar = acoes?.aoConfirmar;

  useEffect(() => {
    if (!confirmavel || confirmar === undefined) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== "Enter" || !(evento.metaKey || evento.ctrlKey)) return;
      evento.preventDefault();
      confirmar();
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [confirmavel, confirmar]);

  return (
    <Cartao
      cabecalho={cabecalhoDa(proposta)}
      selo={<SeloDaSituacao proposta={proposta} />}
      rodape={
        pendente && acoes !== undefined ? (
          <>
            <Botao onClick={acoes.aoConfirmar} carregando={acoes.ocupado}>
              {acoes.ocupado ? "Confirmando..." : "Confirmar"}
              {!acoes.ocupado && <TeclaDeAtalho />}
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
          <h3 className="text-lg font-semibold tracking-tight text-tinta">
            {proposta.rascunho.titulo}
          </h3>
          <p className="text-sm text-tinta-media">
            {proposta.rascunho.descricao}
          </p>
          <GradeDoCartao>
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
          </GradeDoCartao>
        </>
      ) : (
        <p className="text-sm text-tinta">{proposta.texto}</p>
      )}
    </Cartao>
  );
}
