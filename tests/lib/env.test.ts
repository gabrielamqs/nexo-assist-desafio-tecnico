import { describe, expect, it } from "vitest";
import { AmbienteInvalidoError, lerAmbiente } from "@/lib/env";

const SEGREDO_VALIDO = "s".repeat(32);

const mensagemDoErro = (variaveis: Record<string, string>) => {
  try {
    lerAmbiente(variaveis);
    return "";
  } catch (erro) {
    expect(erro).toBeInstanceOf(AmbienteInvalidoError);
    return (erro as Error).message;
  }
};

describe("lerAmbiente", () => {
  it("usa os padrões quando nada está definido", () => {
    expect(lerAmbiente({})).toEqual({
      NODE_ENV: "development",
      DATABASE_URL: "file:./data/nexo-assist.db",
      GEMINI_MODEL: "gemini-3.5-flash-lite",
      PORT: 3000,
      MCP_SERVER_URL: "http://localhost:3000/api/mcp",
      TICKET_SERVICE_FAILURE_RATE: 0.08,
    });
  });

  it("deriva a URL do MCP da porta, para o agent se achar atrás de porta dinâmica", () => {
    expect(lerAmbiente({ PORT: "8080" }).MCP_SERVER_URL).toBe(
      "http://localhost:8080/api/mcp",
    );
  });

  it("respeita a URL do MCP quando ela é informada", () => {
    expect(
      lerAmbiente({ PORT: "8080", MCP_SERVER_URL: "https://nexo.app/api/mcp" })
        .MCP_SERVER_URL,
    ).toBe("https://nexo.app/api/mcp");
  });

  it("deriva a URL do MCP do domínio da Vercel, onde não há porta própria", () => {
    expect(
      lerAmbiente({ VERCEL_URL: "nexo-assist.vercel.app" }).MCP_SERVER_URL,
    ).toBe("https://nexo-assist.vercel.app/api/mcp");
  });

  it("prefere a URL do MCP informada ao domínio da Vercel", () => {
    expect(
      lerAmbiente({
        VERCEL_URL: "nexo-assist.vercel.app",
        MCP_SERVER_URL: "https://outra.app/api/mcp",
      }).MCP_SERVER_URL,
    ).toBe("https://outra.app/api/mcp");
  });

  it("exige token quando o banco é remoto, que é o caso do Turso", () => {
    expect(
      mensagemDoErro({ DATABASE_URL: "libsql://nexo-assist.turso.io" }),
    ).toMatch("DATABASE_AUTH_TOKEN: é obrigatória quando o banco é remoto");
  });

  it("aceita banco remoto com token, e não exige token de arquivo local", () => {
    expect(
      lerAmbiente({
        DATABASE_URL: "libsql://nexo-assist.turso.io",
        DATABASE_AUTH_TOKEN: "token",
      }).DATABASE_URL,
    ).toBe("libsql://nexo-assist.turso.io");

    expect(
      lerAmbiente({ DATABASE_URL: "file:./data/x.db" }).DATABASE_AUTH_TOKEN,
    ).toBeUndefined();
  });

  it("trata variável vazia como ausente, como vem do .env.example", () => {
    const ambiente = lerAmbiente({
      SESSION_SECRET: "",
      GEMINI_API_KEY: "   ",
      TICKET_SERVICE_FAILURE_RATE: "",
    });

    expect(ambiente.SESSION_SECRET).toBeUndefined();
    expect(ambiente.GEMINI_API_KEY).toBeUndefined();
    expect(ambiente.TICKET_SERVICE_FAILURE_RATE).toBe(0.08);
  });

  it("converte a taxa de falha de texto para número", () => {
    expect(
      lerAmbiente({ TICKET_SERVICE_FAILURE_RATE: "0.25" })
        .TICKET_SERVICE_FAILURE_RATE,
    ).toBe(0.25);
  });

  it("recusa taxa de falha fora de 0 a 1, em vez de corrigir em silêncio", () => {
    expect(mensagemDoErro({ TICKET_SERVICE_FAILURE_RATE: "1.5" })).toMatch(
      "TICKET_SERVICE_FAILURE_RATE: deve estar entre 0 e 1",
    );
    expect(mensagemDoErro({ TICKET_SERVICE_FAILURE_RATE: "abc" })).toMatch(
      "TICKET_SERVICE_FAILURE_RATE: deve ser um número",
    );
  });

  it("recusa URL do MCP malformada logo na leitura", () => {
    expect(mensagemDoErro({ MCP_SERVER_URL: "localhost:3000" })).toMatch(
      "MCP_SERVER_URL: deve ser uma URL completa",
    );
  });

  it("exige segredo de sessão e chave do Gemini em produção", () => {
    const mensagem = mensagemDoErro({ NODE_ENV: "production" });

    expect(mensagem).toMatch("SESSION_SECRET: é obrigatória em produção");
    expect(mensagem).toMatch("GEMINI_API_KEY: é obrigatória em produção");
  });

  it("aceita produção configurada", () => {
    expect(
      lerAmbiente({
        NODE_ENV: "production",
        SESSION_SECRET: SEGREDO_VALIDO,
        GEMINI_API_KEY: "chave",
      }).NODE_ENV,
    ).toBe("production");
  });

  it("recusa segredo de sessão curto demais para assinar com segurança", () => {
    expect(mensagemDoErro({ SESSION_SECRET: "curto" })).toMatch(
      "SESSION_SECRET: precisa ter pelo menos 32 caracteres",
    );
  });

  it("nunca coloca o valor de uma variável na mensagem de erro", () => {
    const segredoCurto = "segredo-que-nao-pode-vazar";

    const mensagem = mensagemDoErro({
      SESSION_SECRET: segredoCurto,
      MCP_SERVER_URL: "url-com-segredo-que-nao-pode-vazar",
    });

    expect(mensagem).not.toContain(segredoCurto);
    expect(mensagem).not.toContain("url-com-segredo-que-nao-pode-vazar");
  });
});
