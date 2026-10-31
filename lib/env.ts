import { z } from "zod";

const vazioComoAusente = <T extends z.ZodType>(esquema: T) =>
  z.preprocess(
    (valor) =>
      typeof valor === "string" && valor.trim() === "" ? undefined : valor,
    esquema,
  );

const OBRIGATORIAS_EM_PRODUCAO = ["SESSION_SECRET", "GEMINI_API_KEY"] as const;

const esquemaDoAmbiente = z
  .object({
    NODE_ENV: vazioComoAusente(
      z
        .enum(["development", "test", "production"], {
          error: "deve ser development, test ou production",
        })
        .default("development"),
    ),
    DATABASE_URL: vazioComoAusente(
      z.string().trim().default("file:./data/nexo-assist.db"),
    ),
    SESSION_SECRET: vazioComoAusente(
      z
        .string()
        .trim()
        .min(32, { error: "precisa ter pelo menos 32 caracteres" })
        .optional(),
    ),
    GEMINI_API_KEY: vazioComoAusente(z.string().trim().optional()),
    GEMINI_MODEL: vazioComoAusente(
      z.string().trim().default("gemini-3.5-flash-lite"),
    ),
    MCP_SERVER_URL: vazioComoAusente(
      z
        .url({
          protocol: /^https?$/,
          error:
            "deve ser uma URL completa, como http://localhost:3000/api/mcp",
        })
        .default("http://localhost:3000/api/mcp"),
    ),
    TICKET_SERVICE_FAILURE_RATE: vazioComoAusente(
      z.coerce
        .number({ error: "deve ser um número" })
        .min(0, { error: "deve estar entre 0 e 1" })
        .max(1, { error: "deve estar entre 0 e 1" })
        .default(0.08),
    ),
  })
  .superRefine((ambiente, contexto) => {
    if (ambiente.NODE_ENV !== "production") return;

    for (const nome of OBRIGATORIAS_EM_PRODUCAO) {
      if (ambiente[nome] === undefined) {
        contexto.addIssue({
          code: "custom",
          path: [nome],
          message: "é obrigatória em produção",
        });
      }
    }
  });

export type Ambiente = z.infer<typeof esquemaDoAmbiente>;

export class AmbienteInvalidoError extends Error {
  constructor(problemas: string[]) {
    super(
      `Variáveis de ambiente inválidas. Veja o .env.example.\n${problemas.map((problema) => `- ${problema}`).join("\n")}`,
    );
    this.name = "AmbienteInvalidoError";
  }
}

export function lerAmbiente(
  variaveis: Record<string, string | undefined> = process.env,
): Ambiente {
  const resultado = esquemaDoAmbiente.safeParse(variaveis);
  if (resultado.success) return resultado.data;

  throw new AmbienteInvalidoError(
    resultado.error.issues.map(
      (problema) => `${problema.path.join(".")}: ${problema.message}`,
    ),
  );
}

let ambienteValidado: Ambiente | undefined;

export const ambiente = (): Ambiente => (ambienteValidado ??= lerAmbiente());

export const emProducao = () => ambiente().NODE_ENV === "production";

const SEGREDO_DE_DESENVOLVIMENTO =
  "nexo-assist-apenas-para-desenvolvimento-local";

export const segredoDeSessao = () =>
  ambiente().SESSION_SECRET ?? SEGREDO_DE_DESENVOLVIMENTO;

export function chaveDoGemini(): string {
  const chave = ambiente().GEMINI_API_KEY;
  if (chave === undefined) {
    throw new AmbienteInvalidoError([
      "GEMINI_API_KEY: é necessária para o agent responder",
    ]);
  }
  return chave;
}
