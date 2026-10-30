export const CAMINHO_PADRAO_DO_BANCO = "file:./data/nexo-assist.db";

export const TAXA_DE_FALHA_PADRAO = 0.08;

export const urlDoBanco = () =>
  process.env.DATABASE_URL ?? CAMINHO_PADRAO_DO_BANCO;

export function taxaDeFalhaDoServicoDeChamados(): number {
  const configurada = Number.parseFloat(
    process.env.TICKET_SERVICE_FAILURE_RATE ?? "",
  );
  if (Number.isNaN(configurada)) return TAXA_DE_FALHA_PADRAO;
  return Math.min(Math.max(configurada, 0), 1);
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
