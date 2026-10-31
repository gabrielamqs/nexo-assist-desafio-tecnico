"use client";

import { useEffect, useRef, useState } from "react";
import { cancelarRascunho, confirmarRascunho } from "@/app/chat/acoes";
import type { ResultadoDaAcaoNoRascunho } from "@/app/chat/tipos";
import { Aviso } from "@/components/atoms/Aviso";
import { BolhaDoFuncionario } from "@/components/molecules/BolhaDoFuncionario";
import { Compositor } from "@/components/molecules/Compositor";
import { MarcoDaConversa } from "@/components/molecules/MarcoDaConversa";
import {
  LIMITE_DE_MENSAGENS_POR_SESSAO,
  MENSAGENS_PARA_AVISAR_DO_LIMITE,
  type AcaoDoAgent,
} from "@/domain/types";
import { lerEventosDoChat, type MensagemNaTela } from "@/lib/mensagem-na-tela";
import {
  MensagemDeBoasVindas,
  MensagemDoAnalista,
  MensagemDoAssistente,
  MensagemEmAndamento,
} from "./MensagemDoAssistente";

const SUGESTOES_INICIAIS = [
  "Qual o status dos meus chamados?",
  "Minha VPN não conecta",
  "Preciso de um segundo monitor",
];

const FALHA_DE_CONEXAO =
  "Não consegui falar com o servidor. Verifique a sua conexão e tente de novo.";

type Props = {
  primeiroNome: string;
  mensagensIniciais: MensagemNaTela[];
  mensagensEnviadasIniciais: number;
  comAnalistaInicial: boolean;
};

type RespostaEmAndamento = { acoes: AcaoDoAgent[]; parcial: string };

const substituir = (
  mensagens: MensagemNaTela[],
  id: string,
  nova: MensagemNaTela,
) => mensagens.map((mensagem) => (mensagem.id === id ? nova : mensagem));

function ContadorDeMensagens({ enviadas }: { enviadas: number }) {
  const perto = enviadas >= MENSAGENS_PARA_AVISAR_DO_LIMITE;
  return (
    <p
      className={`text-right text-xs ${perto ? "font-medium text-alta" : "text-tinta-fraca"}`}
    >
      {enviadas}/{LIMITE_DE_MENSAGENS_POR_SESSAO} mensagens nesta sessão
    </p>
  );
}

export function ConversaComAssistente({
  primeiroNome,
  mensagensIniciais,
  mensagensEnviadasIniciais,
  comAnalistaInicial,
}: Props) {
  const [mensagens, setMensagens] = useState(mensagensIniciais);
  const [enviadas, setEnviadas] = useState(mensagensEnviadasIniciais);
  const [comAnalista, setComAnalista] = useState(comAnalistaInicial);
  const [emAndamento, setEmAndamento] = useState<RespostaEmAndamento | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [rascunhoEmAcao, setRascunhoEmAcao] = useState<string | null>(null);
  const [erroNoRascunho, setErroNoRascunho] = useState<{
    mensagemId: string;
    texto: string;
  } | null>(null);
  const [texto, setTexto] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const fim = useRef<HTMLDivElement>(null);

  const limiteAtingido = enviadas >= LIMITE_DE_MENSAGENS_POR_SESSAO;
  const ocupado = emAndamento !== null || rascunhoEmAcao !== null;
  const bloqueado = limiteAtingido || comAnalista;
  const restantes = LIMITE_DE_MENSAGENS_POR_SESSAO - enviadas;

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, emAndamento, erro]);

  async function enviar(conteudo: string) {
    if (ocupado || bloqueado) return;

    const provisoria: MensagemNaTela = {
      id: `provisoria-${Date.now()}`,
      autor: "funcionario",
      conteudo,
      criadaEm: new Date().toISOString(),
      decisao: null,
    };

    setTexto("");
    setErro(null);
    setMensagens((atuais) => [...atuais, provisoria]);
    setEmAndamento({ acoes: [], parcial: "" });

    try {
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: conteudo }),
      });
      if (!resposta.ok || resposta.body === null) throw new Error();

      for await (const evento of lerEventosDoChat(resposta.body)) {
        switch (evento.tipo) {
          case "acao":
            setEmAndamento((atual) =>
              atual === null
                ? atual
                : { ...atual, acoes: [...atual.acoes, evento.acao] },
            );
            break;
          case "parcial":
            setEmAndamento((atual) =>
              atual === null ? atual : { ...atual, parcial: evento.texto },
            );
            break;
          case "respondida":
            setMensagens((atuais) => [
              ...substituir(
                atuais,
                provisoria.id,
                evento.mensagemDoFuncionario,
              ),
              evento.resposta,
              ...(evento.transferencia === null ? [] : [evento.transferencia]),
            ]);
            setEnviadas(evento.mensagensEnviadas);
            if (evento.transferencia !== null) setComAnalista(true);
            break;
          case "com_analista":
            setMensagens((atuais) =>
              substituir(atuais, provisoria.id, evento.mensagemDoFuncionario),
            );
            setEnviadas(evento.mensagensEnviadas);
            setComAnalista(true);
            break;
          case "limite":
            setMensagens((atuais) =>
              atuais.filter((mensagem) => mensagem.id !== provisoria.id),
            );
            setEnviadas(LIMITE_DE_MENSAGENS_POR_SESSAO);
            break;
          case "erro":
            setErro(evento.mensagem);
            break;
        }
      }
    } catch {
      setErro(FALHA_DE_CONEXAO);
    } finally {
      setEmAndamento(null);
    }
  }

  async function agirNoRascunho(
    mensagemId: string,
    acao: (id: string) => Promise<ResultadoDaAcaoNoRascunho>,
  ) {
    setRascunhoEmAcao(mensagemId);
    setErroNoRascunho(null);

    try {
      const resultado = await acao(mensagemId);
      if (resultado.ok) {
        setMensagens((atuais) => [
          ...substituir(atuais, mensagemId, resultado.mensagemAtualizada),
          resultado.novaMensagem,
        ]);
      } else {
        setErroNoRascunho({ mensagemId, texto: resultado.erro });
      }
    } catch {
      setErroNoRascunho({ mensagemId, texto: FALHA_DE_CONEXAO });
    } finally {
      setRascunhoEmAcao(null);
    }
  }

  function editarRascunho() {
    setTexto("Quero ajustar o rascunho: ");
    campo.current?.focus();
  }

  const avisoDoRodape = comAnalista
    ? "Sua conversa está com um analista. O Nexo Assist volta a responder quando ele liberar."
    : limiteAtingido
      ? `Esta sessão chegou ao limite de ${LIMITE_DE_MENSAGENS_POR_SESSAO} mensagens. Um analista vai continuar o atendimento.`
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
          {mensagens.length === 0 && (
            <MensagemDeBoasVindas
              primeiroNome={primeiroNome}
              sugestoes={SUGESTOES_INICIAIS}
              aoEscolher={enviar}
            />
          )}

          {mensagens.map((mensagem, indice) => {
            switch (mensagem.autor) {
              case "funcionario":
                return (
                  <BolhaDoFuncionario
                    key={mensagem.id}
                    texto={mensagem.conteudo}
                  />
                );
              case "analista":
                return (
                  <MensagemDoAnalista key={mensagem.id} mensagem={mensagem} />
                );
              case "sistema":
                return (
                  <MarcoDaConversa
                    key={mensagem.id}
                    texto={mensagem.conteudo}
                    criadaEm={mensagem.criadaEm}
                  />
                );
              case "agent":
                return (
                  <MensagemDoAssistente
                    key={mensagem.id}
                    mensagem={mensagem}
                    ehAUltima={
                      indice === mensagens.length - 1 && !ocupado && !bloqueado
                    }
                    aoEnviar={enviar}
                    rascunho={{
                      ocupado: rascunhoEmAcao === mensagem.id,
                      erro:
                        erroNoRascunho?.mensagemId === mensagem.id
                          ? erroNoRascunho.texto
                          : null,
                      aoConfirmar: () =>
                        agirNoRascunho(mensagem.id, confirmarRascunho),
                      aoEditar: editarRascunho,
                      aoCancelar: () =>
                        agirNoRascunho(mensagem.id, cancelarRascunho),
                    }}
                  />
                );
            }
          })}

          {emAndamento !== null && <MensagemEmAndamento {...emAndamento} />}
          {erro !== null && <Aviso tipo="erro">{erro}</Aviso>}
          <div ref={fim} />
        </div>
      </div>

      <div className="border-t border-borda bg-superficie">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-3 sm:px-6">
          {avisoDoRodape !== null && (
            <Aviso tipo="informacao">{avisoDoRodape}</Aviso>
          )}
          {avisoDoRodape === null &&
            enviadas >= MENSAGENS_PARA_AVISAR_DO_LIMITE && (
              <Aviso tipo="atencao">
                {restantes === 1
                  ? "Resta 1 mensagem nesta sessão."
                  : `Restam ${restantes} mensagens nesta sessão.`}
              </Aviso>
            )}
          <Compositor
            valor={texto}
            aoMudar={setTexto}
            aoEnviar={enviar}
            desabilitado={ocupado || bloqueado}
            referencia={campo}
          />
          <ContadorDeMensagens enviadas={enviadas} />
        </div>
      </div>
    </div>
  );
}
