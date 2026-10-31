export const CAMINHO_PADRAO_DO_BANCO = "file:./data/nexo-assist.db";

export const TAXA_DE_FALHA_PADRAO = 0.08;

export const MODELO_PADRAO_DO_GEMINI = "gemini-3.8-flash";

export const URL_PADRAO_DO_SERVIDOR_MCP = "http://localhost:3000/api/mcp";

export const urlDoBanco = () =>
  process.env.DATABASE_URL ?? CAMINHO_PADRAO_DO_BANCO;

const valorOuPadrao = (valor: string | undefined, padrao: string) =>
  valor === undefined || valor.trim() === "" ? padrao : valor.trim();

export const modeloDoGemini = () =>
  valorOuPadrao(process.env.GEMINI_MODEL, MODELO_PADRAO_DO_GEMINI);

export const urlDoServidorMcp = () =>
  new URL(
    valorOuPadrao(process.env.MCP_SERVER_URL, URL_PADRAO_DO_SERVIDOR_MCP),
  );

export function taxaDeFalhaDoServicoDeChamados(): number {
  const configurada = Number.parseFloat(
    process.env.TICKET_SERVICE_FAILURE_RATE ?? "",
  );
  if (Number.isNaN(configurada)) return TAXA_DE_FALHA_PADRAO;
  return Math.min(Math.max(configurada, 0), 1);
}

const SEGREDO_DE_DESENVOLVIMENTO = "nexo-assist-apenas-para-desenvolvimento";

export function segredoDeSessao(): string {
  const configurado = process.env.SESSION_SECRET;
  if (configurado !== undefined && configurado.trim() !== "") {
    return configurado;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET é obrigatório em produção. Veja o .env.example.",
    );
  }
  return SEGREDO_DE_DESENVOLVIMENTO;
}

export function variavelObrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (valor === undefined || valor.trim() === "") {
    throw new Error(
      `A variável de ambiente ${nome} não está definida. Veja o .env.example.`,
    );
  }
  return valor;
}
