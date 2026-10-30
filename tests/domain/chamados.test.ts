import { describe, expect, it } from "vitest";
import {
  chamadosVisiveisPara,
  decidirDestinoDaAbertura,
  formatarCodigoDeChamado,
  podeSerReaberto,
  podeVerChamado,
  validarRascunho,
} from "@/domain/chamados";
import type { Chamado, RascunhoDeChamado, Usuario } from "@/domain/types";

const AGORA = new Date("2026-03-10T12:00:00-03:00");

const diasAtras = (dias: number) =>
  new Date(AGORA.getTime() - dias * 24 * 60 * 60 * 1000);

const chamado = (sobrescritas: Partial<Chamado> = {}): Chamado => ({
  codigo: "INC-20311",
  tipo: "incidente",
  titulo: "Notebook lento",
  descricao: "Lentidão desde a atualização",
  categoria: "Hardware",
  prioridade: "media",
  status: "aberto",
  solicitanteId: "usr-ana",
  afetados: "pessoa",
  abertoEm: diasAtras(10),
  atualizadoEm: diasAtras(1),
  resolvidoEm: null,
  ...sobrescritas,
});

const rascunhoCompleto: RascunhoDeChamado = {
  titulo: "VPN não conecta no notebook",
  descricao: "O notebook mostra o erro 809 ao conectar na VPN.",
  tipo: "incidente",
  categoria: "Rede e VPN",
  prioridade: "alta",
  afetados: "pessoa",
};

describe("validarRascunho", () => {
  it("aceita um rascunho com todos os campos do Anexo A", () => {
    expect(validarRascunho(rascunhoCompleto)).toEqual({ valido: true });
  });

  it("lista os campos que faltam", () => {
    const resultado = validarRascunho({
      titulo: "VPN não conecta",
      tipo: "incidente",
    });

    expect(resultado).toEqual({
      valido: false,
      camposFaltando: ["descricao", "categoria", "prioridade", "afetados"],
    });
  });

  it("trata texto em branco como campo faltando", () => {
    const resultado = validarRascunho({ ...rascunhoCompleto, titulo: "   " });

    expect(resultado).toEqual({ valido: false, camposFaltando: ["titulo"] });
  });
});

describe("podeSerReaberto", () => {
  it("aceita chamado resolvido há menos de 7 dias", () => {
    const resolvido = chamado({
      status: "resolvido",
      resolvidoEm: diasAtras(4),
    });
    expect(podeSerReaberto(resolvido, AGORA)).toBe(true);
  });

  it("recusa chamado resolvido há mais de 7 dias", () => {
    const resolvido = chamado({
      status: "resolvido",
      resolvidoEm: diasAtras(8),
    });
    expect(podeSerReaberto(resolvido, AGORA)).toBe(false);
  });

  it("recusa chamado que não está resolvido", () => {
    expect(podeSerReaberto(chamado(), AGORA)).toBe(false);
  });
});

describe("decidirDestinoDaAbertura", () => {
  it("atualiza o chamado quando já existe um aberto sobre o mesmo problema", () => {
    expect(decidirDestinoDaAbertura(chamado(), AGORA)).toBe(
      "atualizar_existente",
    );
  });

  it("reabre o chamado resolvido dentro da janela de 7 dias", () => {
    const resolvido = chamado({
      status: "resolvido",
      resolvidoEm: diasAtras(4),
    });
    expect(decidirDestinoDaAbertura(resolvido, AGORA)).toBe(
      "reabrir_existente",
    );
  });

  it("cria um novo chamado quando o relacionado está resolvido há muito tempo", () => {
    const resolvido = chamado({
      status: "resolvido",
      resolvidoEm: diasAtras(30),
    });
    expect(decidirDestinoDaAbertura(resolvido, AGORA)).toBe("criar_novo");
  });

  it("cria um novo chamado quando não há relacionado", () => {
    expect(decidirDestinoDaAbertura(null, AGORA)).toBe("criar_novo");
  });
});

const ana: Usuario = {
  id: "usr-ana",
  nome: "Ana Souza",
  email: "ana.souza@nexo.com.br",
  departamento: "Financeiro",
  papel: "funcionario",
};

const bruno: Usuario = { ...ana, id: "usr-bruno", nome: "Bruno Tavares" };
const analista: Usuario = { ...ana, id: "usr-rafael", papel: "analista" };

describe("privacidade", () => {
  it("deixa o funcionário ver o próprio chamado", () => {
    expect(podeVerChamado(chamado(), ana)).toBe(true);
  });

  it("esconde o chamado de outro funcionário", () => {
    expect(podeVerChamado(chamado(), bruno)).toBe(false);
  });

  it("deixa o analista ver o chamado para poder atender", () => {
    expect(podeVerChamado(chamado(), analista)).toBe(true);
  });

  it("filtra a lista pelo que o funcionário pode ver", () => {
    const chamados = [
      chamado(),
      chamado({ codigo: "INC-20377", solicitanteId: "usr-bruno" }),
    ];

    expect(chamadosVisiveisPara(chamados, ana).map((c) => c.codigo)).toEqual([
      "INC-20311",
    ]);
  });
});

describe("formatarCodigoDeChamado", () => {
  it("usa INC para incidente e REQ para requisição", () => {
    expect(formatarCodigoDeChamado("incidente", 20311)).toBe("INC-20311");
    expect(formatarCodigoDeChamado("requisicao", 10442)).toBe("REQ-10442");
  });
});
