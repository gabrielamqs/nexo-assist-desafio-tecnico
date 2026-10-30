import { describe, expect, it } from "vitest";
import {
  assinarSessao,
  criarSessaoPara,
  lerSessao,
  type Sessao,
} from "@/lib/sessao";

const SEGREDO = "segredo-de-teste";
const AGORA = new Date("2026-03-09T14:00:00-03:00");
const DEPOIS_DE_OITO_DIAS = new Date("2026-03-17T14:00:00-03:00");

const sessaoDaAna: Sessao = criarSessaoPara("usr-ana", "funcionario", AGORA);

describe("sessão assinada", () => {
  it("vai e volta preservando usuário e papel", () => {
    const token = assinarSessao(sessaoDaAna, SEGREDO);

    expect(lerSessao(token, SEGREDO, AGORA)).toEqual(sessaoDaAna);
  });

  it("recusa token sem cookie", () => {
    expect(lerSessao(undefined, SEGREDO, AGORA)).toBeNull();
  });

  it("recusa token assinado com outro segredo", () => {
    const token = assinarSessao(sessaoDaAna, "outro-segredo");

    expect(lerSessao(token, SEGREDO, AGORA)).toBeNull();
  });

  it("recusa token com o conteúdo adulterado", () => {
    const token = assinarSessao(sessaoDaAna, SEGREDO);
    const [, assinatura] = token.split(".");
    const adulterado = `${Buffer.from(
      JSON.stringify({ ...sessaoDaAna, papel: "analista" }),
    ).toString("base64url")}.${assinatura}`;

    expect(lerSessao(adulterado, SEGREDO, AGORA)).toBeNull();
  });

  it("recusa token expirado", () => {
    const token = assinarSessao(sessaoDaAna, SEGREDO);

    expect(lerSessao(token, SEGREDO, DEPOIS_DE_OITO_DIAS)).toBeNull();
  });

  it("recusa token malformado", () => {
    for (const token of ["", ".", "sem-ponto", "aaa.bbb"]) {
      expect(lerSessao(token, SEGREDO, AGORA)).toBeNull();
    }
  });

  it("recusa conteúdo válido na assinatura mas sem papel conhecido", () => {
    const conteudo = Buffer.from(
      JSON.stringify({ usuarioId: "usr-ana", papel: "root", expiraEm: 1 }),
    ).toString("base64url");
    const token = assinarSessao(sessaoDaAna, SEGREDO);
    const assinaturaValida = token.slice(token.lastIndexOf(".") + 1);

    expect(
      lerSessao(`${conteudo}.${assinaturaValida}`, SEGREDO, AGORA),
    ).toBeNull();
  });
});

describe("criarSessaoPara", () => {
  it("expira em 7 dias", () => {
    const sessao = criarSessaoPara("usr-ana", "funcionario", AGORA);
    const diasAteExpirar =
      (sessao.expiraEm - AGORA.getTime()) / (24 * 60 * 60 * 1000);

    expect(diasAteExpirar).toBe(7);
  });
});
