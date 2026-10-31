import {
  CAMPOS_OBRIGATORIOS_DO_CHAMADO,
  DIAS_PARA_REABRIR_CHAMADO,
  PREFIXO_POR_TIPO,
  type CampoObrigatorioDoChamado,
  type Chamado,
  type RascunhoCompleto,
  type RascunhoDeChamado,
  type TipoDeChamado,
  type Usuario,
} from "./types";

export type ResultadoDaValidacao =
  | { valido: true }
  | { valido: false; camposFaltando: CampoObrigatorioDoChamado[] };

const estaPreenchido = (valor: unknown) =>
  typeof valor === "string" ? valor.trim().length > 0 : valor !== undefined;

export function validarRascunho(
  rascunho: RascunhoDeChamado,
): ResultadoDaValidacao {
  const camposFaltando = CAMPOS_OBRIGATORIOS_DO_CHAMADO.filter(
    (campo) => !estaPreenchido(rascunho[campo]),
  );

  return camposFaltando.length === 0
    ? { valido: true }
    : { valido: false, camposFaltando };
}

export const rascunhoEstaCompleto = (
  rascunho: RascunhoDeChamado,
): rascunho is RascunhoCompleto => validarRascunho(rascunho).valido;

export const estaEmAberto = (chamado: Chamado) =>
  chamado.status !== "resolvido";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function podeSerReaberto(chamado: Chamado, agora: Date): boolean {
  if (chamado.status !== "resolvido" || chamado.resolvidoEm === null) {
    return false;
  }
  const diasDesdeAResolucao =
    (agora.getTime() - chamado.resolvidoEm.getTime()) / MS_POR_DIA;

  return diasDesdeAResolucao <= DIAS_PARA_REABRIR_CHAMADO;
}

export type DestinoDaAbertura =
  "atualizar_existente" | "reabrir_existente" | "criar_novo";

export function decidirDestinoDaAbertura(
  chamadoRelacionado: Chamado | null,
  agora: Date,
): DestinoDaAbertura {
  if (chamadoRelacionado === null) return "criar_novo";
  if (estaEmAberto(chamadoRelacionado)) return "atualizar_existente";
  if (podeSerReaberto(chamadoRelacionado, agora)) return "reabrir_existente";
  return "criar_novo";
}

export const podeVerChamado = (chamado: Chamado, usuario: Usuario) =>
  usuario.papel === "analista" || chamado.solicitanteId === usuario.id;

export const chamadosVisiveisPara = (chamados: Chamado[], usuario: Usuario) =>
  chamados.filter((chamado) => podeVerChamado(chamado, usuario));

export const formatarCodigoDeChamado = (tipo: TipoDeChamado, numero: number) =>
  `${PREFIXO_POR_TIPO[tipo]}-${numero}`;
