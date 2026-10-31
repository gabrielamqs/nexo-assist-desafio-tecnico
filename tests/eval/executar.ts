import { criarAssistenteNexo } from "@/agent/assistente";
import {
  AssistenteIndisponivelError,
  type ChamadaDeFerramenta,
} from "@/application/ports/assistente";
import { responderMensagem } from "@/application/usecases/responder-mensagem";
import type { Usuario } from "@/domain/types";
import { criarRepositorioDeConversas } from "@/infrastructure/conversas/repositorio-sqlite";
import type { BancoDeDados } from "@/infrastructure/db/client";
import { USUARIOS_DE_EXEMPLO } from "@/infrastructure/db/dados-exemplo";
import { chamados } from "@/infrastructure/db/schema";
import { modeloDoAssistente } from "@/infrastructure/llm/modelo";
import { criarServicoEmMemoria } from "../agent/servico-em-memoria";
import type { CasoDeAvaliacao } from "./casos";
import { criarRitmo } from "./ritmo";
import {
  reprovadas,
  VERIFICACOES_DE_TODA_RODADA,
  type Rodada,
} from "./verificacoes";

export const AGORA = new Date("2026-03-09T10:00:00-03:00");

const CHAMADAS_POR_MINUTO_NO_PLANO_GRATUITO = 15;
const CHAMADAS_PREVISTAS_POR_TURNO = 4;
const TENTATIVAS_POR_CASO = 2;
const CARACTERES_DA_ENTRADA_NO_RELATORIO = 240;

const ritmo = criarRitmo(CHAMADAS_POR_MINUTO_NO_PLANO_GRATUITO);

export type RodadaExecutada = Rodada & { chamadas: ChamadaDeFerramenta[] };

export type ResultadoDoCaso = {
  caso: CasoDeAvaliacao;
  rodadas: RodadaExecutada[];
  falhas: string[];
};

function exigirFuncionario(email: string): Usuario {
  const funcionario = USUARIOS_DE_EXEMPLO.find(
    (usuario) => usuario.email === email,
  );
  if (funcionario === undefined) {
    throw new Error(`O caso aponta para ${email}, que não existe.`);
  }
  return funcionario;
}

const contarChamados = async (banco: BancoDeDados) =>
  (await banco.select({ codigo: chamados.codigo }).from(chamados)).length;

export async function executarCaso(
  caso: CasoDeAvaliacao,
): Promise<ResultadoDoCaso> {
  let indisponibilidade: unknown;

  for (let tentativa = 0; tentativa < TENTATIVAS_POR_CASO; tentativa += 1) {
    try {
      return await rodarCaso(caso);
    } catch (erro) {
      if (!(erro instanceof AssistenteIndisponivelError)) throw erro;
      indisponibilidade = erro;
    }
  }

  throw indisponibilidade;
}

async function rodarCaso(caso: CasoDeAvaliacao): Promise<ResultadoDoCaso> {
  const { banco, servico, repositorioDeChamados } =
    await criarServicoEmMemoria(AGORA);

  const dependencias = {
    conversas: criarRepositorioDeConversas({ banco, agora: () => AGORA }),
    chamados: repositorioDeChamados,
    assistente: criarAssistenteNexo({ modelo: modeloDoAssistente(), servico }),
    agora: () => AGORA,
  };

  const funcionario = exigirFuncionario(caso.email);
  const chamadosAntes = await contarChamados(banco);
  const rodadas: RodadaExecutada[] = [];
  const falhas: string[] = [];

  for (const [indice, turno] of caso.turnos.entries()) {
    const chamadas: ChamadaDeFerramenta[] = [];

    await ritmo.aguardarVaga(CHAMADAS_PREVISTAS_POR_TURNO);
    const resultado = await responderMensagem(
      dependencias,
      { funcionario, texto: turno.pessoa },
      { aoUsarFerramenta: (chamada) => chamadas.push(chamada) },
    );
    ritmo.registrar(chamadas.length + 1);

    const decisao =
      resultado.situacao === "respondida" ? resultado.resposta.decisao : null;
    if (resultado.situacao !== "respondida" || decisao === null) {
      throw new Error(
        `O agent não respondeu no turno ${indice + 1} de "${caso.id}".`,
      );
    }

    const rodada: RodadaExecutada = {
      pergunta: turno.pessoa,
      resposta: resultado.resposta.conteudo,
      decisao,
      chamadas,
    };
    rodadas.push(rodada);

    const verificacoes = [...VERIFICACOES_DE_TODA_RODADA, ...turno.espera];
    falhas.push(
      ...reprovadas(verificacoes, rodada).map(
        (descricao) => `turno ${indice + 1}: ${descricao}`,
      ),
    );
  }

  if ((await contarChamados(banco)) !== chamadosAntes) {
    falhas.push("caso: criou chamado sem a confirmação da pessoa");
  }

  return { caso, rodadas, falhas };
}

const descreverProposta = ({ proposta }: Rodada["decisao"]) => {
  if (proposta === null) return "nenhuma";
  return proposta.tipo === "criar"
    ? `criar ${proposta.rascunho.tipo} ${proposta.rascunho.prioridade} (${proposta.rascunho.categoria}, afetados ${proposta.rascunho.afetados})`
    : `${proposta.reabrir ? "reabrir" : "atualizar"} ${proposta.codigo}`;
};

const descreverChamada = ({
  ferramenta,
  entrada,
  sucesso,
}: ChamadaDeFerramenta) =>
  `${ferramenta}${sucesso ? "" : " (falhou)"} ${JSON.stringify(entrada).slice(0, CARACTERES_DA_ENTRADA_NO_RELATORIO)}`;

const descreverRodada = (rodada: RodadaExecutada, indice: number) =>
  [
    `[${indice + 1}] pessoa: ${rodada.pergunta}`,
    `    agent: ${rodada.resposta}`,
    ...rodada.chamadas.map((chamada) => `    · ${descreverChamada(chamada)}`),
    `    intenção: ${rodada.decisao.intencao} · segurança: ${Math.round(rodada.decisao.confianca * 100)}% · proposta: ${descreverProposta(rodada.decisao)}`,
  ].join("\n");

export const relatorio = ({ caso, rodadas }: ResultadoDoCaso): string =>
  [`${caso.id} — ${caso.objetivo}`, ...rodadas.map(descreverRodada)].join("\n");
