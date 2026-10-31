import type {
  ConversaNaFila,
  RepositorioDeConversas,
} from "@/application/ports/conversas";
import type { RepositorioDeChamados } from "@/application/ports/ticket-repository";
import type { RepositorioDeUsuarios } from "@/application/ports/usuarios";
import {
  atendidaPor,
  pertenceAoFiltro,
  podeAssumir,
  podeDevolverAoAgent,
  podeEncerrar,
  type FiltroDaFila,
} from "@/domain/conversas";
import { estaVencido, prazoDoChamado } from "@/domain/prazos";
import type { Chamado, Conversa, Mensagem, Usuario } from "@/domain/types";

export class ConversaIndisponivelError extends Error {
  constructor(motivo = "Esta conversa não está disponível.") {
    super(motivo);
    this.name = "ConversaIndisponivelError";
  }
}

export type DependenciasDoConsole = {
  conversas: RepositorioDeConversas;
  chamados: RepositorioDeChamados;
  usuarios: RepositorioDeUsuarios;
  agora?: () => Date;
};

export type ChamadoDoFuncionario = Chamado & {
  prazoDeResposta: Date;
  vencido: boolean;
  desteAtendimento: boolean;
};

export type AtendimentoCarregado = {
  conversa: Conversa;
  funcionario: Usuario;
  mensagens: Mensagem[];
  chamados: ChamadoDoFuncionario[];
  podeAssumir: boolean;
  podeDevolver: boolean;
  podeEncerrar: boolean;
  podeResponder: boolean;
};

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const atendeABusca = (item: ConversaNaFila, busca: string) => {
  const procurado = normalizar(busca);
  const campos = [
    item.funcionario.nome,
    item.funcionario.email,
    item.funcionario.departamento,
    item.conversa.resumoParaAnalista ?? "",
    item.ultimaMensagem?.conteudo ?? "",
  ];

  return campos.some((campo) => normalizar(campo).includes(procurado));
};

export async function listarFila(
  { conversas }: Pick<DependenciasDoConsole, "conversas">,
  {
    analista,
    filtro,
    busca = "",
  }: { analista: Usuario; filtro: FiltroDaFila; busca?: string },
): Promise<ConversaNaFila[]> {
  const fila = await conversas.listarParaAnalista();

  return fila
    .filter((item) => pertenceAoFiltro(item.conversa, filtro, analista.id))
    .filter((item) => busca.trim() === "" || atendeABusca(item, busca.trim()));
}

export async function contarPorFiltro(
  { conversas }: Pick<DependenciasDoConsole, "conversas">,
  analista: Usuario,
  filtros: readonly FiltroDaFila[],
): Promise<Record<FiltroDaFila, number>> {
  const fila = await conversas.listarParaAnalista();

  return Object.fromEntries(
    filtros.map((filtro) => [
      filtro,
      fila.filter((item) =>
        pertenceAoFiltro(item.conversa, filtro, analista.id),
      ).length,
    ]),
  ) as Record<FiltroDaFila, number>;
}

async function exigirConversa(
  conversas: RepositorioDeConversas,
  conversaId: string,
): Promise<Conversa> {
  const conversa = await conversas.buscarPorId(conversaId);
  if (conversa === null) throw new ConversaIndisponivelError();
  return conversa;
}

export async function carregarAtendimento(
  {
    conversas,
    chamados,
    usuarios,
    agora = () => new Date(),
  }: DependenciasDoConsole,
  { analista, conversaId }: { analista: Usuario; conversaId: string },
): Promise<AtendimentoCarregado> {
  const conversa = await exigirConversa(conversas, conversaId);
  const funcionario = await usuarios.buscarPorId(conversa.funcionarioId);
  if (funcionario === null) throw new ConversaIndisponivelError();

  const [mensagens, doFuncionario] = await Promise.all([
    conversas.listarMensagens(conversa.id),
    chamados.listarPorSolicitante(funcionario.id),
  ]);

  const momento = agora();
  const codigosCitados = new Set(
    mensagens.flatMap((mensagem) =>
      mensagem.decisao === null
        ? []
        : [
            mensagem.decisao.chamadoConsultado?.codigo,
            mensagem.decisao.proposta?.situacao === "confirmada"
              ? mensagem.decisao.proposta.codigoDoChamado
              : undefined,
          ].filter((codigo) => codigo !== undefined),
    ),
  );

  return {
    conversa,
    funcionario,
    mensagens,
    chamados: doFuncionario.map((chamado) => ({
      ...chamado,
      prazoDeResposta: prazoDoChamado(chamado),
      vencido: estaVencido(chamado, momento),
      desteAtendimento: codigosCitados.has(chamado.codigo),
    })),
    podeAssumir: podeAssumir(conversa),
    podeDevolver: podeDevolverAoAgent(conversa),
    podeEncerrar: podeEncerrar(conversa),
    podeResponder: atendidaPor(conversa, analista.id),
  };
}

const AVISO_DE_ASSUMIR = (nome: string) =>
  `${nome} assumiu o atendimento · o Nexo Assist está pausado`;

export async function assumirAtendimento(
  { conversas }: Pick<DependenciasDoConsole, "conversas">,
  { analista, conversaId }: { analista: Usuario; conversaId: string },
): Promise<Conversa> {
  const conversa = await exigirConversa(conversas, conversaId);
  if (!podeAssumir(conversa)) {
    throw new ConversaIndisponivelError(
      "Esta conversa já está em atendimento ou foi encerrada.",
    );
  }

  const assumida = await conversas.mudarEstado(conversa.id, {
    estado: "com_analista",
    analistaId: analista.id,
  });

  await conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "sistema",
    conteudo: AVISO_DE_ASSUMIR(analista.nome),
    decisao: null,
  });

  return assumida;
}

export async function devolverAoAgent(
  { conversas }: Pick<DependenciasDoConsole, "conversas">,
  { analista, conversaId }: { analista: Usuario; conversaId: string },
): Promise<Conversa> {
  const conversa = await exigirConversa(conversas, conversaId);
  if (!podeDevolverAoAgent(conversa)) {
    throw new ConversaIndisponivelError(
      "Só dá para devolver uma conversa que está em atendimento.",
    );
  }

  const devolvida = await conversas.mudarEstado(conversa.id, {
    estado: "com_agent",
    analistaId: null,
  });

  await conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "sistema",
    conteudo: `${analista.nome} devolveu a conversa ao Nexo Assist`,
    decisao: null,
  });

  return devolvida;
}

export async function encerrarAtendimento(
  { conversas }: Pick<DependenciasDoConsole, "conversas">,
  { analista, conversaId }: { analista: Usuario; conversaId: string },
): Promise<Conversa> {
  const conversa = await exigirConversa(conversas, conversaId);
  if (!podeEncerrar(conversa)) {
    throw new ConversaIndisponivelError("Esta conversa já foi encerrada.");
  }

  const encerrada = await conversas.mudarEstado(conversa.id, {
    estado: "encerrada",
    analistaId: conversa.analistaId ?? analista.id,
  });

  await conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "sistema",
    conteudo: `${analista.nome} encerrou o atendimento`,
    decisao: null,
  });

  return encerrada;
}

export async function responderComoAnalista(
  { conversas }: Pick<DependenciasDoConsole, "conversas">,
  {
    analista,
    conversaId,
    texto,
  }: { analista: Usuario; conversaId: string; texto: string },
): Promise<Mensagem> {
  const conteudo = texto.trim();
  if (conteudo === "") {
    throw new ConversaIndisponivelError("A mensagem está vazia.");
  }

  const conversa = await exigirConversa(conversas, conversaId);
  if (!atendidaPor(conversa, analista.id)) {
    throw new ConversaIndisponivelError(
      "Assuma o atendimento antes de responder.",
    );
  }

  return conversas.adicionarMensagem({
    conversaId: conversa.id,
    autor: "analista",
    conteudo,
    decisao: null,
  });
}
